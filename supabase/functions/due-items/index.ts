import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Aufgaben & Geburtstage in den nächsten `windowMin` Minuten — für Desktop-Polling */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .single();

    if (!profile?.is_active) {
      return new Response(JSON.stringify({ tasks: [], birthdays: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const windowMin = Math.min(
      60,
      Math.max(5, Number(url.searchParams.get("window") ?? 30)),
    );
    const now = new Date();
    const until = new Date(now.getTime() + windowMin * 60_000);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, due_at, priority")
      .eq("user_id", user.id)
      .is("completed_at", null)
      .not("due_at", "is", null)
      .gte("due_at", now.toISOString())
      .lte("due_at", until.toISOString())
      .order("due_at", { ascending: true });

    const { data: birthdayRows } = await supabase
      .from("birthday_contacts")
      .select("id, display_name, birth_month, birth_day, timezone")
      .eq("user_id", user.id);

    const birthdays: Array<{ id: string; display_name: string }> = [];
    for (const b of birthdayRows ?? []) {
      const m = Number(b.birth_month);
      const d = Number(b.birth_day);
      const t = String(b.timezone);
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: t,
        month: "numeric",
        day: "numeric",
      }).formatToParts(now);
      const lm = Number(parts.find((p) => p.type === "month")?.value);
      const ld = Number(parts.find((p) => p.type === "day")?.value);
      if (lm === m && ld === d) {
        birthdays.push({
          id: b.id as string,
          display_name: b.display_name as string,
        });
      }
    }

    return new Response(
      JSON.stringify({
        tasks: tasks ?? [],
        birthdays,
        server_now: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
