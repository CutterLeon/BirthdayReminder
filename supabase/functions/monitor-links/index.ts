import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-cron-secret, content-type",
};

function shouldRun(now: Date, last: string | null, intervalMin: number) {
  if (!last) return true;
  const lastMs = new Date(last).getTime();
  const dueMs = lastMs + intervalMin * 60_000;
  return now.getTime() >= dueMs;
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
    });
    const latency = Date.now() - start;
    return { ok: true as const, status: res.status, latency };
  } catch (e) {
    const latency = Date.now() - start;
    return { ok: false as const, error: String(e), latency };
  } finally {
    clearTimeout(t);
  }
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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRole);

    const now = new Date();
    const { data: links, error } = await admin
      .from("monitor_links")
      .select("id, url, enabled, check_interval_minutes, last_checked_at")
      .eq("enabled", true);
    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let checked = 0;
    let ok = 0;
    for (const l of links ?? []) {
      const interval = Number(l.check_interval_minutes ?? 10);
      if (!shouldRun(now, (l.last_checked_at as string | null) ?? null, interval))
        continue;

      const out = await fetchWithTimeout(String(l.url), 10_000);
      checked++;
      if (out.ok && out.status === 200) ok++;

      await admin.from("monitor_checks").insert({
        monitor_link_id: l.id,
        checked_at: now.toISOString(),
        status_code: out.ok ? out.status : null,
        ok: out.ok && out.status === 200,
        latency_ms: out.latency,
        error: out.ok ? null : out.error,
      });

      await admin
        .from("monitor_links")
        .update({ last_checked_at: now.toISOString() })
        .eq("id", l.id);
    }

    return new Response(JSON.stringify({ ok: true, checked, ok_200: ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

