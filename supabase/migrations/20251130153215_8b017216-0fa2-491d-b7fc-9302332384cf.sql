-- Create form_configurations table to manage forms
CREATE TABLE public.form_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  form_identifier TEXT NOT NULL UNIQUE,
  description TEXT,
  webhook_url TEXT,
  webhook_enabled BOOLEAN NOT NULL DEFAULT false,
  fields_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_submissions table to store form data
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.form_configurations(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID
);

-- Enable RLS
ALTER TABLE public.form_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for form_configurations
CREATE POLICY "Admins can manage form configurations"
  ON public.form_configurations
  FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Public can view form configurations"
  ON public.form_configurations
  FOR SELECT
  USING (true);

-- RLS policies for form_submissions
CREATE POLICY "Anyone can submit forms"
  ON public.form_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all form submissions"
  ON public.form_submissions
  FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Admins can delete form submissions"
  ON public.form_submissions
  FOR DELETE
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create indexes
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX idx_form_submissions_submitted_at ON public.form_submissions(submitted_at DESC);
CREATE INDEX idx_form_configurations_identifier ON public.form_configurations(form_identifier);

-- Create trigger for updated_at
CREATE TRIGGER update_form_configurations_updated_at
  BEFORE UPDATE ON public.form_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();