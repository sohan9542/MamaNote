import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { AppState, Platform } from 'react-native';
import { FunctionsHttpError } from '@supabase/supabase-js';

import {
  PADDLE_PRICE_IDS,
  type SubscriptionPlan,
} from '@constants/subscription';
import { supabase } from '@lib/supabase';

/** Deep link path after Paddle checkout (scheme: mamanote). Custom schemes often fail on emulators — use a dev client on a real device. */
export const CHECKOUT_SUCCESS_PATH = 'subscribe/success';

/** How often to refetch subscription while waiting for the Paddle webhook. */
export const PLUS_ACTIVATION_POLL_MS = 2_000;

/** Stop polling and show the “still processing” state after this long. */
export const PLUS_ACTIVATION_TIMEOUT_MS = 30_000;

export function isCheckoutSuccessUrl(url: string): boolean {
  return url.includes(CHECKOUT_SUCCESS_PATH);
}

export function parseCheckoutSuccessUrl(
  url: string,
): { transactionId?: string } | null {
  if (!url.includes(CHECKOUT_SUCCESS_PATH)) return null;

  const parsed = Linking.parse(url);
  const raw = parsed.queryParams?.transactionId;
  const transactionId =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw) && typeof raw[0] === 'string'
        ? raw[0]
        : undefined;

  if (transactionId) {
    console.info('[checkout] Paddle transactionId:', transactionId);
  }

  return { transactionId };
}

export function checkoutSuccessRoute(transactionId?: string): {
  pathname: '/subscribe/success';
  params: { transactionId?: string };
} {
  return {
    pathname: '/subscribe/success',
    params: transactionId ? { transactionId } : {},
  };
}

/** Close the in-app checkout browser if it is still open after redirect. */
export async function dismissCheckoutBrowser(): Promise<void> {
  try {
    await WebBrowser.dismissBrowser();
  } catch {
    /* Auth session may already have closed the sheet */
  }
  try {
    await WebBrowser.dismissAuthSession();
  } catch {
    /* noop */
  }
}

async function invokeErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = (await error.context.json()) as {
        error?: string;
        message?: string;
      };
      return payload.error ?? payload.message ?? error.message;
    } catch {
      return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export async function createCheckoutSession(plan: SubscriptionPlan): Promise<string> {
  const priceId = PADDLE_PRICE_IDS[plan];
  if (!priceId) {
    throw new Error(
      `Paddle price not configured for ${plan}. Add EXPO_PUBLIC_PADDLE_PRICE_${plan.toUpperCase()} to .env`,
    );
  }

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { priceId, plan },
  });

  if (error) throw new Error(await invokeErrorMessage(error));
  if (data?.error) throw new Error(data.error as string);

  const checkoutUrl = data?.checkoutUrl as string | undefined;
  if (!checkoutUrl) throw new Error('No checkout URL returned');

  return checkoutUrl;
}

export async function openCustomerPortal(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-customer-portal');

  if (error) throw new Error(await invokeErrorMessage(error));
  if (data?.error) throw new Error(data.error as string);

  const portalUrl = data?.portalUrl as string | undefined;
  if (!portalUrl) throw new Error('No portal URL returned');

  return portalUrl;
}

export type CheckoutSessionResult =
  | { type: 'cancelled' }
  | { type: 'success'; transactionId?: string };

export async function openCheckout(
  plan: SubscriptionPlan,
): Promise<CheckoutSessionResult> {
  const checkoutUrl = await createCheckoutSession(plan);
  const redirectUrl = Linking.createURL(CHECKOUT_SUCCESS_PATH);

  // ASWebAuthenticationSession (iOS) / redirect listener (Android) closes the sheet when
  // checkout hits mamanote://subscribe/success. openBrowserAsync cannot do that.
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirectUrl);

  if (result.type === 'success' && result.url && result.url.includes(CHECKOUT_SUCCESS_PATH)) {
    await dismissCheckoutBrowser();
    const parsed = parseCheckoutSuccessUrl(result.url);
    return { type: 'success', transactionId: parsed?.transactionId };
  }

  return { type: 'cancelled' };
}

/** Handle mamanote://subscribe/success from web checkout or cold start. */
export async function handleCheckoutSuccessDeepLink(url: string): Promise<{
  transactionId?: string;
} | null> {
  const parsed = parseCheckoutSuccessUrl(url);
  if (!parsed) return null;
  await dismissCheckoutBrowser();
  return parsed;
}

export async function openBillingPortal(): Promise<void> {
  const portalUrl = await openCustomerPortal();
  await Linking.openURL(portalUrl);
}

/** Apple External Purchase Link disclosure — required before opening external checkout on iOS (US). */
export function requiresExternalPurchaseDisclosure(): boolean {
  return Platform.OS === 'ios';
}

export function subscribeToAppState(onForeground: () => void): () => void {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') onForeground();
  });
  return () => sub.remove();
}

export function subscribeToDeepLinks(onUrl: (url: string) => void): () => void {
  const handle = ({ url }: { url: string }) => onUrl(url);

  Linking.getInitialURL().then((url) => {
    if (url) onUrl(url);
  });

  const sub = Linking.addEventListener('url', handle);
  return () => sub.remove();
}

/** Listens for mamanote://subscribe/success (and initial URL on cold start). */
export function subscribeToCheckoutSuccessDeepLinks(
  onSuccess: (params: { transactionId?: string }) => void,
): () => void {
  const handleUrl = (url: string) => {
    void (async () => {
      const parsed = await handleCheckoutSuccessDeepLink(url);
      if (parsed) onSuccess(parsed);
    })();
  };

  Linking.getInitialURL().then((url) => {
    if (url) handleUrl(url);
  });

  const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
  return () => sub.remove();
}
