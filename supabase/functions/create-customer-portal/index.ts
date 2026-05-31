import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsPreflightResponse,
  jsonResponse,
  paddleFetch,
} from "../_shared/paddle.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "Server misconfigured" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) {
      return jsonResponse({ error: subError.message }, 500);
    }

    if (!sub?.paddle_customer_id) {
      return jsonResponse(
        { error: "No billing account found. Subscribe to MamaNote Plus first." },
        404,
      );
    }

    const subscriptionIds = sub.paddle_subscription_id
      ? [sub.paddle_subscription_id]
      : [];

    const paddleRes = await paddleFetch("/customers/" + sub.paddle_customer_id + "/portal-sessions", {
      method: "POST",
      body: JSON.stringify({
        subscription_ids: subscriptionIds,
      }),
    });

    const payload = await paddleRes.json();
    if (!paddleRes.ok) {
      console.error("Paddle portal session failed:", payload);
      return jsonResponse(
        {
          error:
            payload?.error?.detail ??
            payload?.error?.message ??
            "Failed to open billing portal",
        },
        502,
      );
    }

    const portalUrl =
      payload?.data?.urls?.general?.overview ??
      payload?.data?.urls?.subscriptions?.[0]?.update_subscription_payment_method;

    if (!portalUrl) {
      return jsonResponse({ error: "No portal URL returned" }, 502);
    }

    return jsonResponse({ portalUrl });
  } catch (e) {
    console.error("create-customer-portal error:", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
