
CREATE TABLE public.internal_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  hide_name BOOLEAN NOT NULL DEFAULT false,
  email TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT,
  profile_photo_url TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.internal_reviews TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.internal_reviews TO authenticated;
GRANT ALL ON public.internal_reviews TO service_role;

ALTER TABLE public.internal_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an internal review"
  ON public.internal_reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can view internal reviews"
  ON public.internal_reviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update internal reviews"
  ON public.internal_reviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete internal reviews"
  ON public.internal_reviews FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_internal_reviews_updated_at
  BEFORE UPDATE ON public.internal_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_internal_reviews_created_at ON public.internal_reviews (created_at DESC);
