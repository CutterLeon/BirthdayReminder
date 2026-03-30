import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function escapeIcsText(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function formatUtc(dt: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}` +
    `T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`
  );
}

function formatDate(y: number, m: number, d: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}${pad(m)}${pad(d)}`;
}

function nextBirthdayStart(month: number, day: number, now: Date) {
  const y = now.getUTCFullYear();
  const thisYear = new Date(Date.UTC(y, month - 1, day, 0, 0, 0));
  if (thisYear.getTime() >= now.getTime()) return thisYear;
  return new Date(Date.UTC(y + 1, month - 1, day, 0, 0, 0));
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim() ?? "";
    if (!token) return new Response("missing token", { status: 400 });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRole);

    const { data: feed, error: feedErr } = await admin
      .from("calendar_feeds")
      .select(
        "user_id, enabled, include_birthdays, include_tasks, include_timeboxes, token",
      )
      .eq("token", token)
      .maybeSingle();

    if (feedErr) {
      console.error(feedErr);
      return new Response("error", { status: 500 });
    }
    if (!feed?.enabled) return new Response("not found", { status: 404 });

    const userId = feed.user_id as string;
    const now = new Date();
    const dtStamp = formatUtc(now);

    const lines: string[] = [];
    lines.push("BEGIN:VCALENDAR");
    lines.push("VERSION:2.0");
    lines.push("CALSCALE:GREGORIAN");
    lines.push("METHOD:PUBLISH");
    lines.push("PRODID:-//Organizer//Powerhouse Calendar//DE");

    // Birthdays (all-day, yearly)
    if (feed.include_birthdays) {
      const { data: birthdays } = await admin
        .from("birthday_contacts")
        .select("id, display_name, birth_month, birth_day")
        .eq("user_id", userId);

      for (const b of birthdays ?? []) {
        const m = Number(b.birth_month);
        const d = Number(b.birth_day);
        if (!m || !d) continue;
        const start = nextBirthdayStart(m, d, now);
        const dt = formatDate(
          start.getUTCFullYear(),
          start.getUTCMonth() + 1,
          start.getUTCDate(),
        );
        lines.push("BEGIN:VEVENT");
        lines.push(`UID:birthday-${b.id}@organizer`);
        lines.push(`DTSTAMP:${dtStamp}`);
        lines.push(`SUMMARY:${escapeIcsText(`Geburtstag: ${b.display_name}`)}`);
        lines.push(`DTSTART;VALUE=DATE:${dt}`);
        lines.push("RRULE:FREQ=YEARLY");
        lines.push("END:VEVENT");
      }
    }

    // Tasks (due_at)
    if (feed.include_tasks) {
      const until = new Date(now.getTime() + 180 * 24 * 60 * 60_000);
      const { data: tasks } = await admin
        .from("tasks")
        .select("id, title, due_at")
        .eq("user_id", userId)
        .is("completed_at", null)
        .not("due_at", "is", null)
        .gte("due_at", new Date(now.getTime() - 7 * 24 * 60 * 60_000).toISOString())
        .lte("due_at", until.toISOString())
        .order("due_at", { ascending: true });

      for (const t of tasks ?? []) {
        if (!t.due_at) continue;
        const start = new Date(String(t.due_at));
        const end = new Date(start.getTime() + 15 * 60_000);
        lines.push("BEGIN:VEVENT");
        lines.push(`UID:task-${t.id}@organizer`);
        lines.push(`DTSTAMP:${dtStamp}`);
        lines.push(`SUMMARY:${escapeIcsText(`Task: ${t.title}`)}`);
        lines.push(`DTSTART:${formatUtc(start)}`);
        lines.push(`DTEND:${formatUtc(end)}`);
        lines.push("END:VEVENT");
      }
    }

    // Daily Plan timeboxes
    if (feed.include_timeboxes) {
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60_000);
      const until = new Date(now.getTime() + 30 * 24 * 60 * 60_000);
      const { data: boxes } = await admin
        .from("task_timeboxes")
        .select("id, task_id, title, start_at, end_at, notes")
        .eq("user_id", userId)
        .gte("start_at", from.toISOString())
        .lte("start_at", until.toISOString())
        .order("start_at", { ascending: true });

      const taskIds = [
        ...new Set((boxes ?? []).map((b) => b.task_id).filter(Boolean)),
      ] as string[];
      const taskTitle = new Map<string, string>();
      if (taskIds.length > 0) {
        const { data: trows } = await admin
          .from("tasks")
          .select("id, title")
          .in("id", taskIds);
        for (const tr of trows ?? []) taskTitle.set(tr.id as string, tr.title as string);
      }

      for (const b of boxes ?? []) {
        const start = new Date(String(b.start_at));
        const end = new Date(String(b.end_at));
        const title =
          (b.task_id ? taskTitle.get(String(b.task_id)) : null) ??
          (b.title as string | null) ??
          "Daily Plan";
        lines.push("BEGIN:VEVENT");
        lines.push(`UID:timebox-${b.id}@organizer`);
        lines.push(`DTSTAMP:${dtStamp}`);
        lines.push(`SUMMARY:${escapeIcsText(title)}`);
        if (b.notes) lines.push(`DESCRIPTION:${escapeIcsText(String(b.notes))}`);
        lines.push(`DTSTART:${formatUtc(start)}`);
        lines.push(`DTEND:${formatUtc(end)}`);
        lines.push("END:VEVENT");
      }
    }

    lines.push("END:VCALENDAR");

    // RFC 5545 wants CRLF
    const body = lines.join("\r\n") + "\r\n";
    return new Response(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
});

