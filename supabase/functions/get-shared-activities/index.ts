import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type LogEntry = {
  id: string;
  type: string;
  started_at: string;
  ended_at: string | null;
  amount: number | null;
  unit: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
};

type ShareRow = {
  filter_mode: "all" | "categories";
  activity_ids: string[];
  expires_at: string;
  created_at: string;
  baby_id: string;
};

const SUBTYPE_LABELS: Record<string, string> = {
  breastfeeding: "Breastfeeding",
  bottle: "Bottle",
  nutrition: "Nutrition",
  wet: "Wet",
  dirty: "Dirty",
  both: "Wet and Dirty",
  temperature: "Temperature",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sleep: "Sleep",
  breastfeeding: "Breastfeeding",
  medicine: "Medicine",
  pumping: "Pumping",
  nutrition: "Nutrition",
  diaper: "Diaper",
  temperature: "Temperature",
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
  const days = Math.max(
    0,
    Math.floor((now.getTime() - birth.getTime()) / 86_400_000),
  );
  return `${days} day${days === 1 ? "" : "s"}`;
}

function getActivityIdForEntry(
  type: string,
  metadata: Record<string, unknown> | null,
): string | null {
  const subtype = metadata?.subtype as string | undefined;
  if (type === "feeding" && subtype === "nutrition") return "nutrition";
  if (type === "feeding" && subtype === "breastfeeding") return "breastfeeding";
  if (type === "note" && subtype === "temperature") return "temperature";
  if (type === "sleep") return "sleep";
  if (type === "pump") return "pumping";
  if (type === "diaper") return "diaper";
  if (type === "medication") return "medicine";
  return null;
}

function entryDisplayTitle(entry: LogEntry): string {
  const meta = entry.metadata ?? {};
  const subtype = meta.subtype as string | undefined;
  if (subtype && SUBTYPE_LABELS[subtype]) return SUBTYPE_LABELS[subtype];
  if (entry.type === "sleep") return "Sleep";
  if (entry.type === "pump") return "Pumping";
  if (entry.type === "feeding") return "Feeding";
  if (entry.type === "diaper") return "Diaper Change";
  if (entry.type === "medication") {
    return entry.notes ?? (meta.medicineName as string | undefined) ?? "Medicine";
  }
  if (entry.type === "note") return entry.notes ?? "Note";
  return entry.type;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function entryDetailLine(entry: LogEntry): string {
  const meta = entry.metadata ?? {};
  const subtype = meta.subtype as string | undefined;

  if (subtype === "temperature" && meta.temperature != null) {
    return `${meta.temperature} °C`;
  }
  if (entry.type === "diaper" && subtype) {
    return SUBTYPE_LABELS[subtype] ?? "Diaper change";
  }
  if (entry.type === "medication") return entry.notes ?? "Medication logged";
  if (entry.amount != null) {
    const unit = entry.unit === "ml" ? "ml" : (entry.unit ?? "ml");
    return `${entry.amount} ${unit}`;
  }
  return entry.notes ?? `Logged at ${formatTime(entry.started_at)}`;
}

function shareFilterLabel(
  filterMode: ShareRow["filter_mode"],
  activityIds: string[],
): string {
  if (filterMode === "all") return "All activities";
  const labels = activityIds
    .map((id) => ACTIVITY_LABELS[id])
    .filter(Boolean) as string[];
  if (labels.length === 0) return "Selected activities";
  if (labels.length <= 3) return labels.join(", ");
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2} more`;
}

function entryMatchesFilter(
  entry: LogEntry,
  filterMode: ShareRow["filter_mode"],
  activityIds: string[],
): boolean {
  if (filterMode === "all") return true;
  const activityId = getActivityIdForEntry(entry.type, entry.metadata);
  return activityId != null && activityIds.includes(activityId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim();
    if (!token) {
      return jsonResponse({ error: "Missing share token" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "Server misconfigured" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: share, error: shareError } = await admin
      .from("activity_shares")
      .select("filter_mode, activity_ids, expires_at, created_at, baby_id")
      .eq("token", token)
      .maybeSingle();

    if (shareError || !share) {
      return jsonResponse({ error: "Share link not found" }, 404);
    }

    const shareRow = share as ShareRow;
    if (new Date(shareRow.expires_at).getTime() < Date.now()) {
      return jsonResponse({ error: "This share link has expired" }, 410);
    }

    const { data: baby, error: babyError } = await admin
      .from("babies")
      .select("name, birth_date")
      .eq("id", shareRow.baby_id)
      .maybeSingle();

    if (babyError || !baby) {
      return jsonResponse({ error: "Baby profile not found" }, 404);
    }

    const { data: entries, error: entriesError } = await admin
      .from("log_entries")
      .select("id, type, started_at, ended_at, amount, unit, notes, metadata")
      .eq("baby_id", shareRow.baby_id)
      .order("started_at", { ascending: false })
      .limit(200);

    if (entriesError) {
      return jsonResponse({ error: "Could not load activities" }, 500);
    }

    const filtered = ((entries ?? []) as LogEntry[]).filter((entry) =>
      entryMatchesFilter(entry, shareRow.filter_mode, shareRow.activity_ids),
    );

    return jsonResponse({
      babyName: baby.name as string,
      babyAge: babyAgeLabel(baby.birth_date as string),
      filterLabel: shareFilterLabel(shareRow.filter_mode, shareRow.activity_ids),
      sharedAt: shareRow.created_at,
      expiresAt: shareRow.expires_at,
      entryCount: filtered.length,
      entries: filtered.map((entry) => ({
        id: entry.id,
        title: entryDisplayTitle(entry),
        detail: entryDetailLine(entry),
        startedAt: entry.started_at,
        type: entry.type,
        activityId: getActivityIdForEntry(entry.type, entry.metadata),
      })),
    });
  } catch (error) {
    console.error("[get-shared-activities]", error);
    return jsonResponse({ error: "Unexpected server error" }, 500);
  }
});
