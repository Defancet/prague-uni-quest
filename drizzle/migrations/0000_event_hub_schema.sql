
CREATE TYPE public.app_role AS ENUM ('student', 'organizer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('Technology','Business','Networking','Entertainment')),
  date date NOT NULL,
  time text NOT NULL,
  venue text NOT NULL,
  price_czk integer NOT NULL DEFAULT 0 CHECK (price_czk >= 0),
  description text NOT NULL DEFAULT '',
  organizer text NOT NULL,
  agenda text[] NOT NULL DEFAULT '{}',
  image_url text,
  capacity integer NOT NULL CHECK (capacity >= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Organizers create own events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Owners update events" ON public.events FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete events" ON public.events FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
-- No INSERT/UPDATE grant: registering only via register_for_event()
GRANT SELECT, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see own, organizers see own events" ON public.registrations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid()));
CREATE POLICY "Students cancel own" ON public.registrations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Profiles: own row, or students registered for an event you own
CREATE OR REPLACE FUNCTION public.is_attendee_of_my_event(_profile uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.registrations r JOIN public.events e ON e.id = r.event_id
                 WHERE r.user_id = _profile AND e.owner_id = auth.uid())
$$;
CREATE POLICY "Read own or attendee profiles" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_attendee_of_my_event(id));
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Capacity cannot drop below current registrations
CREATE OR REPLACE FUNCTION public.check_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF NEW.capacity < OLD.capacity THEN
    SELECT count(*) INTO n FROM public.registrations WHERE event_id = NEW.id;
    IF NEW.capacity < n THEN
      RAISE EXCEPTION 'Capacity cannot be lower than current registrations (%)', n;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER events_capacity_guard BEFORE UPDATE OF capacity ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.check_capacity();

-- Public counts, no identities
CREATE OR REPLACE FUNCTION public.get_registration_counts()
RETURNS TABLE (event_id uuid, registered int) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, (SELECT count(*)::int FROM public.registrations r WHERE r.event_id = e.id) FROM public.events e
$$;
GRANT EXECUTE ON FUNCTION public.get_registration_counts() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_for_event(_event_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); cap int; n int; new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please sign in first'; END IF;
  IF NOT public.has_role(uid, 'student') THEN RAISE EXCEPTION 'Only students can register'; END IF;
  SELECT capacity INTO cap FROM public.events WHERE id = _event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
  IF EXISTS (SELECT 1 FROM public.registrations WHERE event_id = _event_id AND user_id = uid) THEN
    RAISE EXCEPTION 'You are already registered';
  END IF;
  SELECT count(*) INTO n FROM public.registrations WHERE event_id = _event_id;
  IF n >= cap THEN RAISE EXCEPTION 'Event is full'; END IF;
  INSERT INTO public.registrations (event_id, user_id) VALUES (_event_id, uid) RETURNING id INTO new_id;
  RETURN new_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.register_for_event(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_for_event(uuid) TO authenticated;

-- Demo accounts
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone_change, phone_change_token)
SELECT '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', u.name), now(), now(),
  '', '', '', '', '', '', '', ''
FROM (VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'anna@eventhub-demo.test', 'Anna Studentova'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'petr@eventhub-demo.test', 'Petr Maly'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'klara@eventhub-demo.test', 'Klara Horakova'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'ondrej@eventhub-demo.test', 'Ondrej Benes')
) AS u(id, email, name);

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
SELECT gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now(), now()
FROM auth.users WHERE email LIKE '%@eventhub-demo.test';

INSERT INTO public.profiles (id, full_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Anna Studentova'),
  ('22222222-2222-2222-2222-222222222222', 'Petr Maly'),
  ('33333333-3333-3333-3333-333333333333', 'Klara Horakova'),
  ('44444444-4444-4444-4444-444444444444', 'Ondrej Benes');
INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'student'),
  ('22222222-2222-2222-2222-222222222222', 'student'),
  ('33333333-3333-3333-3333-333333333333', 'organizer'),
  ('44444444-4444-4444-4444-444444444444', 'organizer');

INSERT INTO public.events (owner_id, title, category, date, time, venue, price_czk, description, organizer, agenda, image_url, capacity) VALUES
('33333333-3333-3333-3333-333333333333','AI Hack Night: Build in 12 Hours','Technology','2026-11-06','18:00 – 06:00','ČVUT FIT, Dejvice',0,'Team up with students from across Prague to prototype AI-powered tools overnight. Mentors, pizza and prizes included.','ČVUT Student Union',ARRAY['Kick-off & team forming','Mentor check-ins at midnight','Demo pitches & awards'],'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=70',60),
('33333333-3333-3333-3333-333333333333','Startup Pitch Battle','Business','2026-11-12','17:30 – 20:30','Impact Hub Smíchov',150,'Ten student founders pitch to real investors. Watch, vote and network with the Prague startup scene.','Prague Student Founders',ARRAY['Founder pitches (5 min each)','Investor Q&A panel','Networking drinks'],'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=70',80),
('44444444-4444-4444-4444-444444444444','Career Night: Finance & Consulting','Networking','2026-11-18','18:00 – 21:00','VŠE, Žižkov — Rajská budova',0,'Meet recruiters from top consulting firms and banks. Bring your CV — on-the-spot reviews available.','VŠE Career Centre',ARRAY['Company booths open','CV clinic with recruiters','Alumni speed-mentoring'],'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=900&q=70',120),
('33333333-3333-3333-3333-333333333333','Design Talks: Future of Visual Culture','Technology','2026-11-21','16:00 – 19:00','UMPRUM, Old Town',100,'Designers and creative technologists discuss generative tools, typography and the next wave of visual culture.','UMPRUM Design Collective',ARRAY['Keynote: Designing with AI','Panel: Craft vs. code','Portfolio walk-through'],'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=70',50),
('44444444-4444-4444-4444-444444444444','Rooftop Winter Kick-off Party','Entertainment','2026-11-27','20:00 – 02:00','Rooftop bar, Wenceslas Square',250,'DJs, city views and hot drinks. Celebrate the end of November with students from every faculty.','Erasmus Student Network Prague',ARRAY['Welcome drink & views','Live DJ sets','Midnight photo booth'],'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=70',150),
('44444444-4444-4444-4444-444444444444','Founders & Researchers Meetup','Networking','2026-12-02','18:30 – 21:00','Kampus Hybernská',0,'An informal evening connecting PhD researchers with founders looking for deep-tech collaborators.','Charles University Innovations',ARRAY['Lightning talks','Matchmaking round','Open networking'],'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=70',40),
('33333333-3333-3333-3333-333333333333','Growth Marketing Workshop','Business','2026-12-05','10:00 – 14:00','Charles University, Karolinum',200,'Hands-on workshop on campaigns, analytics and social growth with practitioners from Czech scale-ups.','CUNI Business Club',ARRAY['Funnels & metrics 101','Live campaign teardown','Build your own growth plan'],'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=70',30),
('44444444-4444-4444-4444-444444444444','Robotics Open Lab','Technology','2026-12-10','15:00 – 18:00','CIIRC ČVUT, Dejvice',0,'Tour the robotics labs, try industrial cobots and meet research teams looking for student assistants.','CIIRC ČVUT',ARRAY['Guided lab tour','Hands-on cobot demo','Meet the research teams'],'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=70',1),
('33333333-3333-3333-3333-333333333333','Christmas Pub Quiz Night','Entertainment','2026-12-16','19:00 – 23:00','Klub Mlejn, Stodůlky',80,'Form a team of up to six and battle it out across trivia, music and Prague-themed rounds. Festive prizes!','VŠE Student Club',ARRAY['Team registration','Five quiz rounds','Awards & mulled wine'],'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=900&q=70',36);
