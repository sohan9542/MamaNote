import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsPreflightResponse,
  jsonResponse,
  paddleFetch,
} from "../_shared/paddle.ts";

/** Only set when overriding the account default — must be an approved Paddle domain. */
function checkoutUrlOverride(): string | null {
  const url = Deno.env.get("PADDLE_CHECKOUT_URL")?.trim();
  return url || null;
}

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

    let body: { priceId?: string; plan?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { priceId, plan } = body;
    if (!priceId) {
      return jsonResponse({ error: "priceId is required" }, 400);
    }

    const checkoutOverride = checkoutUrlOverride();
    const transactionBody: Record<string, unknown> = {
      items: [{ price_id: priceId, quantity: 1 }],
      custom_data: {
        supabase_user_id: user.id,
        plan: plan ?? null,
      },
      customer: {
        email: user.email,
      },
    };

    // Omit checkout.url to use Paddle account default payment link (your approved website).
    // Only pass checkout.url when explicitly overriding with another approved domain.
    if (checkoutOverride) {
      transactionBody.checkout = { url: checkoutOverride };
    }

    const paddleRes = await paddleFetch("/transactions", {
      method: "POST",
      body: JSON.stringify(transactionBody),
    });

    const payload = await paddleRes.json();
    if (!paddleRes.ok) {
      console.error("Paddle create transaction failed:", payload);
      return jsonResponse(
        {
          error:
            payload?.error?.detail ??
            payload?.error?.message ??
            "Failed to create checkout",
        },
        502,
      );
    }

    const checkoutUrl = payload?.data?.checkout?.url as string | undefined;
    if (!checkoutUrl) {
      return jsonResponse({ error: "No checkout URL returned" }, 502);
    }

    return jsonResponse({ checkoutUrl, transactionId: payload.data.id });
  } catch (e) {
    console.error("create-checkout error:", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
