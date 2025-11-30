-- Create forum categories table
CREATE TABLE public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#10b981',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum topics table
CREATE TABLE public.forum_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  author_id UUID NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum posts table
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_solution BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_categories
CREATE POLICY "Anyone can view categories"
  ON public.forum_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.forum_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for forum_topics
CREATE POLICY "Anyone can view topics"
  ON public.forum_topics FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create topics"
  ON public.forum_topics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

CREATE POLICY "Authors and admins can update topics"
  ON public.forum_topics FOR UPDATE
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete topics"
  ON public.forum_topics FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for forum_posts
CREATE POLICY "Anyone can view posts"
  ON public.forum_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.forum_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

CREATE POLICY "Authors and admins can update posts"
  ON public.forum_posts FOR UPDATE
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authors and admins can delete posts"
  ON public.forum_posts FOR DELETE
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_forum_topics_category ON public.forum_topics(category_id);
CREATE INDEX idx_forum_topics_author ON public.forum_topics(author_id);
CREATE INDEX idx_forum_topics_created ON public.forum_topics(created_at DESC);
CREATE INDEX idx_forum_posts_topic ON public.forum_posts(topic_id);
CREATE INDEX idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX idx_forum_posts_created ON public.forum_posts(created_at DESC);

-- Insert default categories
INSERT INTO public.forum_categories (name, slug, description, icon, color, display_order) VALUES
  ('Panneaux Solaires', 'panneaux-solaires', 'Questions et discussions sur l''installation et l''optimisation de panneaux solaires', 'Sun', '#f59e0b', 1),
  ('Pompes à Chaleur', 'pompes-a-chaleur', 'Tout sur les pompes à chaleur air-eau, air-air et géothermiques', 'Wind', '#3b82f6', 2),
  ('Isolation Thermique', 'isolation-thermique', 'Conseils sur l''isolation des combles, murs et sols', 'Home', '#10b981', 3),
  ('Aides et Subventions', 'aides-subventions', 'Échanges sur MaPrimeRénov'', CEE et autres dispositifs d''aide', 'HandCoins', '#8b5cf6', 4),
  ('Général', 'general', 'Discussions générales sur les énergies renouvelables', 'MessageSquare', '#6b7280', 5);