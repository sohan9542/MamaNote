import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Claude Sonnet — override via ANTHROPIC_MODEL secret if needed */
const CLAUDE_MODEL =
  Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";

type LogEntry = {
  type: string;
  started_at: string;
  ended_at: string | null;
  amount: number | null;
  unit: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function babyAgeLabel(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months >= 1) return `${months} month${months === 1 ? "" : "s"}`;
  const days = Math.floor((now.getTime() - birth.getTime()) / 86_400_000);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function summarizeEntries(entries: LogEntry[]) {
  return entries.map((e) => {
    const start = new Date(e.started_at);
    let durationMinutes: number | null = null;
    if (e.ended_at) {
      durationMinutes = Math.round(
        (new Date(e.ended_at).getTime() - start.getTime()) / 60_000,
      );
    } else if (e.metadata?.durationMinutes) {
      durationMinutes = Number(e.metadata.durationMinutes);
    }
    return {
      type: e.type,
      day: start.toLocaleDateString("en-US", { weekday: "short" }),
      time: start.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      durationMinutes,
      amount: e.amount,
      unit: e.unit,
      notes: e.notes,
      metadata: e.metadata,
    };
  });
}

function extractJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  return JSON.parse(raw) as Record<string, unknown>;
}

async function callClaude(
  anthropicKey: string,
  prompt: string,
): Promise<{ schedule: Record<string, unknown>; model: string }> {
  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!aiRes.ok) {
    throw new Error(`Claude Sonnet: ${await aiRes.text()}`);
  }

  const aiData = await aiRes.json();
  const textBlock = aiData.content?.find(
    (b: { type: string }) => b.type === "text",
  );
  if (!textBlock?.text) {
    throw new Error("Claude Sonnet: empty response");
  }

  try {
    const schedule = extractJson(textBlock.text);
    if (!Array.isArray(schedule.typicalDay)) {
      throw new Error("Claude Sonnet: missing typicalDay array");
    }
    return { schedule, model: CLAUDE_MODEL };
  } catch (e) {
    if (e instanceof Error && e.message.includes("typicalDay")) throw e;
    throw new Error("Claude Sonnet: invalid JSON in response");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")?.trim();

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "Server misconfigured" }, 500);
    }

    if (!anthropicKey) {
      return jsonResponse(
        {
          error:
            "Claude is not configured. Add ANTHROPIC_API_KEY in Supabase Dashboard → Project Settings → Edge Functions → Secrets, then redeploy generate-schedule.",
          code: "ANTHROPIC_KEY_MISSING",
        },
        503,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse(
        { error: userError?.message ?? "Unauthorized — sign in again" },
        401,
      );
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) {
      return jsonResponse({ error: "Server misconfigured" }, 500);
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);

    let { data: entitlement } = await serviceClient
      .from("subscriptions")
      .select(
        "status, free_ai_generations_used, complimentary_premium_until",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!entitlement) {
      await serviceClient.from("subscriptions").insert({ user_id: user.id });
      entitlement = {
        status: "free",
        free_ai_generations_used: 0,
        complimentary_premium_until: null,
      };
    }

    const hasPaidPremium = entitlement.status === "active" ||
      entitlement.status === "trialing";
    const complimentaryUntil = entitlement.complimentary_premium_until;
    const isComplimentaryPremium = !hasPaidPremium &&
      complimentaryUntil != null &&
      new Date(complimentaryUntil) > new Date();
    const isPremium = hasPaidPremium || isComplimentaryPremium;

    if (!isPremium) {
      return jsonResponse(
        {
          error: "MamaNote Plus required for AI routine generation",
          code: "PREMIUM_REQUIRED",
        },
        402,
      );
    }

    let body: { babyId?: string; periodDays?: number };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { babyId, periodDays = 7 } = body;
    if (!babyId) {
      return jsonResponse({ error: "babyId is required" }, 400);
    }

    const { data: baby, error: babyError } = await supabase
      .from("babies")
      .select("id, name, birth_date")
      .eq("id", babyId)
      .eq("user_id", user.id)
      .single();

    if (babyError || !baby) {
      return jsonResponse({ error: "Baby not found" }, 404);
    }

    const since = new Date();
    since.setDate(since.getDate() - Number(periodDays));

    const { data: entries, error: entriesError } = await supabase
      .from("log_entries")
      .select("*")
      .eq("baby_id", babyId)
      .gte("started_at", since.toISOString())
      .order("started_at", { ascending: false })
      .limit(200);

    if (entriesError) {
      return jsonResponse({ error: entriesError.message }, 500);
    }

    const activityLog = summarizeEntries((entries ?? []) as LogEntry[]);
    const age = babyAgeLabel(baby.birth_date);

    const prompt = `Create a baby daily rhythm from activity logs. Keep ALL text short — parents skim on mobile.

Baby: ${baby.name}, ${age} old | Last ${periodDays} days
Logs: ${JSON.stringify(activityLog)}

Return ONLY valid JSON:
{
  "summary": "ONE short sentence, max 15 words",
  "typicalDay": [
    { "startTime": "HH:mm", "endTime": "HH:mm", "type": "feeding|sleep|diaper|pump|medication|note", "label": "2-3 word label" }
  ],
  "weeklyInsights": ["max 2, under 8 words each"],
  "recommendations": ["max 2, under 8 words each"],
  "nextFeedWindow": "short phrase e.g. ~2pm",
  "nextSleepWindow": "short phrase e.g. after next feed"
}

6-8 typicalDay blocks max. 24h HH:mm. No notes field. Not medical advice.`;

    console.log(
      `Calling Claude Sonnet (${CLAUDE_MODEL}) for baby ${babyId}, ${activityLog.length} activities`,
    );

    const { schedule: claudeSchedule, model } = await callClaude(
      anthropicKey,
      prompt,
    );

    const schedule = {
      ...claudeSchedule,
      _meta: {
        source: "claude",
        model,
        generatedAt: new Date().toISOString(),
        activityCount: activityLog.length,
      },
    };

    const summary =
      typeof schedule.summary === "string" ? schedule.summary : null;

    const { data: saved, error: saveError } = await supabase
      .from("baby_routines")
      .insert({
        baby_id: babyId,
        user_id: user.id,
        period_days: periodDays,
        summary,
        schedule,
      })
      .select()
      .single();

    if (saveError) {
      const hint = saveError.message.includes("baby_routines")
        ? " Run supabase/FIX_BABY_ROUTINES.sql in the Supabase SQL Editor."
        : "";
      return jsonResponse({ error: `${saveError.message}${hint}` }, 500);
    }

    return jsonResponse({
      id: saved.id,
      created_at: saved.created_at,
      period_days: saved.period_days,
      summary: saved.summary,
      schedule: saved.schedule,
      source: "claude",
      model,
    });
  } catch (e) {
    console.error("generate-schedule error:", e);
    const message = (e as Error).message;
    if (message.includes("Claude") || message.includes("Model ")) {
      return jsonResponse({ error: message, code: "CLAUDE_API_ERROR" }, 502);
    }
    return jsonResponse({ error: message }, 500);
  }
});
