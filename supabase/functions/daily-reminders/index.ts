import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { formatInTimeZone } from "npm:date-fns-tz@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-cron-secret, content-type",
};

function localParts(utcNow: Date, tz: string) {
  const hour = Number(formatInTimeZone(utcNow, tz, "H"));
  const minute = Number(formatInTimeZone(utcNow, tz, "m"));
  const month = Number(formatInTimeZone(utcNow, tz, "M"));
  const day = Number(formatInTimeZone(utcNow, tz, "d"));
  const dateStr = formatInTimeZone(utcNow, tz, "yyyy-MM-dd");
  return { hour, minute, month, day, dateStr };
}

async function sendResend(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    console.warn("RESEND_API_KEY missing, skip email");
    return false;
  }
  const from =
    Deno.env.get("RESEND_FROM") ?? "Organizer <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    console.error("Resend error", await res.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("authorization");
  const headerSecret = req.headers.get("x-cron-secret");
  const okSecret =
    (cronSecret && headerSecret === cronSecret) ||
    (cronSecret && auth === `Bearer ${cronSecret}`);
  if (!cronSecret || !okSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, serviceRole);

  const utcNow = new Date();

  const { data: contacts, error } = await admin
    .from("birthday_contacts")
    .select(
      "id, user_id, display_name, birth_month, birth_day, birth_year, timezone, notify_email",
    )
    .eq("notify_email", true);

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userIds = [...new Set((contacts ?? []).map((c) => c.user_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, is_active")
    .in("id", userIds)
    .eq("is_active", true);

  const activeEmail = new Map(
    (profiles ?? []).map((p) => [p.id as string, p.email as string | null]),
  );

  let sent = 0;
  for (const row of contacts ?? []) {
    const tz = row.timezone as string;
    const parts = localParts(utcNow, tz);
    if (parts.hour !== 6 || parts.minute > 14) continue;

    const m = Number(row.birth_month);
    const d = Number(row.birth_day);
    if (parts.month !== m || parts.day !== d) continue;

    const userId = row.user_id as string;
    const to = activeEmail.get(userId);
    if (!to) continue;

    const contactId = row.id as string;
    const localDate = parts.dateStr;

    const { data: existing } = await admin
      .from("reminder_sent")
      .select("id")
      .eq("kind", "birthday_email")
      .eq("entity_id", contactId)
      .eq("local_date", localDate)
      .eq("timezone", tz)
      .maybeSingle();

    if (existing) continue;

    const name = row.display_name as string;
    const yearPart = row.birth_year
      ? ` (Jahrgang ${Number(row.birth_year)})`
      : "";
    const html =
      `<p>Guten Morgen!</p><p>Heute hat <strong>${name}</strong>${yearPart} Geburtstag — Erinnerung um 06:00 in ${tz}.</p>`;
    const ok = await sendResend(to, `Geburtstag: ${name}`, html);

    if (ok) {
      await admin.from("reminder_sent").insert({
        user_id: userId,
        entity_id: contactId,
        kind: "birthday_email",
        local_date: localDate,
        timezone: tz,
      });
      sent++;
    }
  }

  return new Response(JSON.stringify({ ok: true, birthday_emails: sent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
