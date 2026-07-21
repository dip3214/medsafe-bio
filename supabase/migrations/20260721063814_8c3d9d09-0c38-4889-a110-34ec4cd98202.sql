
-- Extensions for scheduled HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Backfill email_preferences for users who don't have a row yet
INSERT INTO public.email_preferences (user_id, unsubscribe_token)
SELECT u.id, gen_random_uuid()
FROM auth.users u
LEFT JOIN public.email_preferences ep ON ep.user_id = u.id
WHERE ep.user_id IS NULL;

-- Ensure every new signup gets an email_preferences row via handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  INSERT INTO public.family_members (user_id, name, segment, relation, is_default)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Me'), 'me', 'self', true);
  INSERT INTO public.email_preferences (user_id, unsubscribe_token)
  VALUES (NEW.id, gen_random_uuid())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
