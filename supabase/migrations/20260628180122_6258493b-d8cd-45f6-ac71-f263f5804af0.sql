
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'patient');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ TIMESTAMPS TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ CONSENTS ============
CREATE TABLE public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own consents" ON public.consents FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_consents_updated BEFORE UPDATE ON public.consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EPISODES ============
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  episode_type TEXT,
  doctor_name TEXT,
  hospital_name TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.episodes TO authenticated;
GRANT ALL ON public.episodes TO service_role;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own episodes" ON public.episodes FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_episodes_updated BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_episodes_user ON public.episodes(user_id);

-- ============ DOCUMENTS ============
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_type TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  document_date DATE,
  processing_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own documents" ON public.documents FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_documents_user ON public.documents(user_id);
CREATE INDEX idx_documents_episode ON public.documents(episode_id);

-- ============ EXTRACTIONS ============
CREATE TABLE public.extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  extraction_type TEXT,
  raw_text TEXT,
  structured_data JSONB,
  confidence NUMERIC,
  model_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extractions TO authenticated;
GRANT ALL ON public.extractions TO service_role;
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own extractions" ON public.extractions FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_extractions_updated BEFORE UPDATE ON public.extractions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_extractions_document ON public.extractions(document_id);

-- ============ LAB RESULTS ============
CREATE TABLE public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  value NUMERIC,
  value_text TEXT,
  unit TEXT,
  reference_low NUMERIC,
  reference_high NUMERIC,
  flag TEXT,
  test_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT ALL ON public.lab_results TO service_role;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lab results" ON public.lab_results FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_lab_results_updated BEFORE UPDATE ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_lab_results_user ON public.lab_results(user_id);

-- ============ MEDICATIONS ============
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  route TEXT,
  start_date DATE,
  end_date DATE,
  prescribed_by TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own medications" ON public.medications FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_medications_updated BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_medications_user ON public.medications(user_id);

-- ============ ACTION ITEMS ============
CREATE TABLE public.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_items TO authenticated;
GRANT ALL ON public.action_items TO service_role;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own action items" ON public.action_items FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_action_items_updated BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_action_items_user ON public.action_items(user_id);

-- ============ SUMMARIES ============
CREATE TABLE public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  summary_type TEXT,
  content TEXT NOT NULL,
  model_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.summaries TO authenticated;
GRANT ALL ON public.summaries TO service_role;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own summaries" ON public.summaries FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_summaries_updated BEFORE UPDATE ON public.summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATIONS LOG ============
CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  notification_type TEXT,
  subject TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  metadata JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.notifications_log TO authenticated;
GRANT ALL ON public.notifications_log TO service_role;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service writes notifications" ON public.notifications_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_notifications_user ON public.notifications_log(user_id);

-- ============ CHAT MESSAGES ============
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat messages" ON public.chat_messages FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_conv ON public.chat_messages(conversation_id);

-- ============ STORAGE POLICIES ============
-- Bucket created via storage tool; policies on storage.objects:
CREATE POLICY "Users read own medical files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'medical-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Users upload own medical files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own medical files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own medical files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
