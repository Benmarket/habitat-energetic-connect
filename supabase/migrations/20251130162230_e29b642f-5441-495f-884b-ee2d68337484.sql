-- Add status column to form_submissions table
ALTER TABLE public.form_submissions 
ADD COLUMN status TEXT NOT NULL DEFAULT 'new' 
CHECK (status IN ('new', 'in_progress', 'processed', 'converted'));

-- Add index for better query performance
CREATE INDEX idx_form_submissions_status ON public.form_submissions(status);