CREATE TABLE public.article_quality_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | done | error
  overall_score INTEGER,                  -- 0..100
  verdict TEXT,                           -- excellent | bon | à revoir | non conforme
  seo_score INTEGER,
  factual_score INTEGER,
  editorial_score INTEGER,
  compliance_score INTEGER,
  summary TEXT,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.article_quality_reviews TO authenticated;
GRANT ALL ON public.article_quality_reviews TO service_role;

ALTER TABLE public.article_quality_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read quality reviews"
ON public.article_quality_reviews FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_aqr_post_id ON public.article_quality_reviews(post_id);
CREATE INDEX idx_aqr_created_at ON public.article_quality_reviews(created_at DESC);

CREATE TRIGGER trg_aqr_updated_at
BEFORE UPDATE ON public.article_quality_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();