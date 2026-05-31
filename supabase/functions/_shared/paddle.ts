const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function corsPreflightResponse() {
  return new Response("ok", { headers: corsHeaders });
}

export function paddleApiBase(): string {
  const env = Deno.env.get("PADDLE_ENV") ?? "sandbox";
  return env === "live"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

export async function paddleFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const apiKey = Deno.env.get("PADDLE_API_KEY");
  if (!apiKey) {
    throw new Error("PADDLE_API_KEY not configured");
  }

  return fetch(`${paddleApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

/** Verify Paddle-Signature header (HMAC-SHA256, ts:h1 format). */
export async function verifyPaddleWebhook(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  let ts = "";
  let h1 = "";
  for (const part of signatureHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key === "ts") ts = val;
    if (key === "h1") h1 = val;
  }
  if (!ts || !h1) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  const ageSec = Math.abs(Date.now() / 1000 - tsNum);
  if (ageSec > 300) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload),
  );
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === h1;
}

export type SubscriptionPlan = "monthly" | "annual" | "lifetime";

export function mapPaddleStatus(
  paddleStatus: string,
): "free" | "trialing" | "active" | "canceled" | "past_due" {
  switch (paddleStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "paused":
      return "canceled";
    default:
      return "free";
  }
}

export function inferPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  const monthly = Deno.env.get("PADDLE_PRICE_MONTHLY");
  const annual = Deno.env.get("PADDLE_PRICE_ANNUAL");
  const lifetime = Deno.env.get("PADDLE_PRICE_LIFETIME");
  if (priceId === monthly) return "monthly";
  if (priceId === annual) return "annual";
  if (priceId === lifetime) return "lifetime";
  return null;
}

export function extractUserId(customData: unknown): string | null {
  if (!customData || typeof customData !== "object") return null;
  const data = customData as Record<string, unknown>;
  const id = data.supabase_user_id ?? data.app_user_id;
  return typeof id === "string" ? id : null;
}

export { corsHeaders };
