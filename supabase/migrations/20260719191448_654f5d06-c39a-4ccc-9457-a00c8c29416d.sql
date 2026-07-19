
-- Email preferences (weekly nudges)
CREATE TABLE public.email_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_enabled boolean NOT NULL DEFAULT true,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX email_prefs_unsub_idx ON public.email_preferences(unsubscribe_token);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_preferences TO authenticated;
GRANT ALL ON public.email_preferences TO service_role;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own email prefs" ON public.email_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER email_prefs_updated
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Summary share tokens (WhatsApp share link → public read-only summary)
CREATE TABLE public.summary_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX summary_shares_token_idx ON public.summary_shares(token);
GRANT SELECT, INSERT, DELETE ON public.summary_shares TO authenticated;
GRANT ALL ON public.summary_shares TO service_role;
ALTER TABLE public.summary_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own summary shares" ON public.summary_shares FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
