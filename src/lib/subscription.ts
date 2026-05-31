import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { AppState, Platform } from 'react-native';
import { FunctionsHttpError } from '@supabase/supabase-js';

import {
  PADDLE_PRICE_IDS,
  type SubscriptionPlan,
} from '@constants/subscription';
import { supabase } from '@lib/supabase';

export const CHECKOUT_SUCCESS_PATH = 'subscribe/success';

export function isCheckoutSuccessUrl(url: string): boolean {
  return url.includes(CHECKOUT_SUCCESS_PATH);
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

export async function openCheckout(plan: SubscriptionPlan): Promise<boolean> {
  const checkoutUrl = await createCheckoutSession(plan);
  const redirectUrl = Linking.createURL(CHECKOUT_SUCCESS_PATH);

  // ASWebAuthenticationSession (iOS) / redirect listener (Android) closes the sheet when
  // checkout hits mamanote://subscribe/success. openBrowserAsync cannot do that.
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirectUrl);

  return result.type === 'success' && !!result.url && isCheckoutSuccessUrl(result.url);
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
