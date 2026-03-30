-- Powerhouse Productivity Upgrade: estimates, daily plan, ICS feeds, monitoring links

-- 1) Tasks: estimated duration
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS estimate_minutes INTEGER
  CHECK (estimate_minutes IS NULL OR estimate_minutes >= 0);

CREATE INDEX IF NOT EXISTS tasks_user_due_open_idx
  ON public.tasks (user_id, due_at)
  WHERE completed_at IS NULL;

-- 2) Daily Plan: timeboxes (timeblocking)
CREATE TABLE IF NOT EXISTS public.task_timeboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks (id) ON DELETE SET NULL,
  title TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS task_timeboxes_user_start_idx
  ON public.task_timeboxes (user_id, start_at);

-- 3) Calendar feeds: tokenized ICS subscription
CREATE TABLE IF NOT EXISTS public.calendar_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE UNIQUE,
  token TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  include_birthdays BOOLEAN NOT NULL DEFAULT true,
  include_tasks BOOLEAN NOT NULL DEFAULT true,
  include_timeboxes BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER calendar_feeds_updated_at
  BEFORE UPDATE ON public.calendar_feeds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Monitoring links + checks (server-side heartbeat)
CREATE TABLE IF NOT EXISTS public.monitor_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  check_interval_minutes INTEGER NOT NULL DEFAULT 10 CHECK (check_interval_minutes BETWEEN 1 AND 1440),
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monitor_links_user_enabled_idx
  ON public.monitor_links (user_id, enabled);

CREATE TABLE IF NOT EXISTS public.monitor_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_link_id UUID NOT NULL REFERENCES public.monitor_links (id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status_code INTEGER,
  ok BOOLEAN NOT NULL DEFAULT false,
  latency_ms INTEGER,
  error TEXT
);

CREATE INDEX IF NOT EXISTS monitor_checks_link_checked_idx
  ON public.monitor_checks (monitor_link_id, checked_at DESC);

-- RLS
ALTER TABLE public.task_timeboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_checks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY task_timeboxes_all_own ON public.task_timeboxes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY calendar_feeds_all_own ON public.calendar_feeds
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY monitor_links_all_own ON public.monitor_links
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Checks are written by server (service role), but readable by owner.
CREATE POLICY monitor_checks_select_own ON public.monitor_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.monitor_links ml
      WHERE ml.id = monitor_checks.monitor_link_id
        AND ml.user_id = auth.uid()
    )
  );

