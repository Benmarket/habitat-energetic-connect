-- Add trigger_type and trigger_id columns to support click-triggered popups
-- trigger_type: 'auto' (existing behavior) or 'click' (triggered by button click)
-- trigger_id: unique identifier for click triggers (e.g., 'find-professional-cta')

ALTER TABLE public.popups 
ADD COLUMN trigger_type text NOT NULL DEFAULT 'auto',
ADD COLUMN trigger_id text;

-- Add a check constraint to ensure valid trigger_type values
ALTER TABLE public.popups 
ADD CONSTRAINT popups_trigger_type_check CHECK (trigger_type IN ('auto', 'click'));

-- Add comment for documentation
COMMENT ON COLUMN public.popups.trigger_type IS 'Type of trigger: auto (automatic on page load) or click (triggered by specific button click)';
COMMENT ON COLUMN public.popups.trigger_id IS 'Unique identifier for click triggers, used to match with button events';