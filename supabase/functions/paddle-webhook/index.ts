import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsPreflightResponse,
  extractUserId,
  inferPlanFromPriceId,
  jsonResponse,
  mapPaddleStatus,
  verifyPaddleWebhook,
  type SubscriptionPlan,
} from "../_shared/paddle.ts";

type PaddleSubscription = {
  id: string;
  status: string;
  customer_id: string;
  current_billing_period?: { ends_at?: string } | null;
  custom_data?: Record<string, unknown> | null;
  items?: Array<{ price?: { id?: string } }>;
};

type PaddleTransaction = {
  id: string;
  status: string;
  customer_id?: string | null;
  subscription_id?: string | null;
  custom_data?: Record<string, unknown> | null;
  items?: Array<{ price?: { id?: string; billing_cycle?: unknown } }>;
};

async function upsertEntitlement(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  patch: {
    status: string;
    plan?: SubscriptionPlan | null;
    paddle_customer_id?: string | null;
    paddle_subscription_id?: string | null;
    current_period_end?: string | null;
  },
) {
  const { error } = await serviceClient.from("subscriptions").upsert(
    {
      user_id: userId,
      status: patch.status,
      plan: patch.plan ?? null,
      provider: "paddle",
      paddle_customer_id: patch.paddle_customer_id ?? null,
      paddle_subscription_id: patch.paddle_subscription_id ?? null,
      current_period_end: patch.current_period_end ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

async function handleSubscriptionEvent(
  serviceClient: ReturnType<typeof createClient>,
  sub: PaddleSubscription,
  customPlan?: SubscriptionPlan | null,
) {
  const userId = extractUserId(sub.custom_data);
  if (!userId) {
    console.warn("subscription event missing supabase_user_id", sub.id);
    return;
  }

  const priceId = sub.items?.[0]?.price?.id;
  const plan = customPlan ?? (priceId ? inferPlanFromPriceId(priceId) : null);

  await upsertEntitlement(serviceClient, userId, {
    status: mapPaddleStatus(sub.status),
    plan,
    paddle_customer_id: sub.customer_id,
    paddle_subscription_id: sub.id,
    current_period_end: sub.current_billing_period?.ends_at ?? null,
  });
}

async function handleTransactionCompleted(
  serviceClient: ReturnType<typeof createClient>,
  txn: PaddleTransaction,
) {
  const userId = extractUserId(txn.custom_data);
  if (!userId) {
    console.warn("transaction event missing supabase_user_id", txn.id);
    return;
  }

  if (txn.subscription_id) return;

  const priceId = txn.items?.[0]?.price?.id;
  const billingCycle = txn.items?.[0]?.price?.billing_cycle;
  const isRecurring = billingCycle != null;
  if (isRecurring) return;

  const plan = priceId ? inferPlanFromPriceId(priceId) : "lifetime";

  await upsertEntitlement(serviceClient, userId, {
    status: "active",
    plan: plan ?? "lifetime",
    paddle_customer_id: txn.customer_id ?? null,
    paddle_subscription_id: null,
    current_period_end: null,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();

  try {
    const webhookSecret = Deno.env.get("PADDLE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!webhookSecret || !supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "Server misconfigured" }, 500);
    }

    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature") ?? "";

    const valid = await verifyPaddleWebhook(rawBody, signature, webhookSecret);
    if (!valid) {
      return jsonResponse({ error: "Invalid signature" }, 400);
    }

    const event = JSON.parse(rawBody) as {
      event_type: string;
      data: PaddleSubscription | PaddleTransaction;
    };

    const serviceClient = createClient(supabaseUrl, serviceKey);

    switch (event.event_type) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.activated":
      case "subscription.trialing":
        await handleSubscriptionEvent(
          serviceClient,
          event.data as PaddleSubscription,
        );
        break;
      case "subscription.canceled":
      case "subscription.past_due": {
        const sub = event.data as PaddleSubscription;
        const userId = extractUserId(sub.custom_data);
        if (userId) {
          await upsertEntitlement(serviceClient, userId, {
            status: mapPaddleStatus(sub.status),
            paddle_customer_id: sub.customer_id,
            paddle_subscription_id: sub.id,
            current_period_end: sub.current_billing_period?.ends_at ?? null,
          });
        }
        break;
      }
      case "transaction.completed":
        await handleTransactionCompleted(
          serviceClient,
          event.data as PaddleTransaction,
        );
        break;
      default:
        console.log("Unhandled Paddle event:", event.event_type);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error("paddle-webhook error:", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
