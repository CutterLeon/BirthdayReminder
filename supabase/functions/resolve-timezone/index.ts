import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import tzlookup from "npm:tz-lookup@6.1.25";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const { error: userError } = await supabase.auth.getUser();
    if (userError) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { city, country } = await req.json() as {
      city?: string;
      country?: string;
    };
    if (!city?.trim()) {
      return new Response(JSON.stringify({ error: "city required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const q = country
      ? `${city.trim()}, ${country.trim()}`
      : city.trim();
    const nominatim = `https://nominatim.openstreetmap.org/search?q=${
      encodeURIComponent(q)
    }&format=json&limit=1`;
    const nf = await fetch(nominatim, {
      headers: {
        "User-Agent": "BirthdayReminderOrganizer/1.0 (support@example.com)",
        Accept: "application/json",
      },
    });
    if (!nf.ok) {
      return new Response(JSON.stringify({ error: "Geocoding failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const results = await nf.json() as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) {
      return new Response(JSON.stringify({ timezone: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lat = Number(first.lat);
    const lon = Number(first.lon);
    let timezone: string | null = null;
    try {
      timezone = tzlookup(lat, lon) as string;
    } catch {
      timezone = null;
    }

    return new Response(JSON.stringify({ timezone, lat, lon }), {
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
