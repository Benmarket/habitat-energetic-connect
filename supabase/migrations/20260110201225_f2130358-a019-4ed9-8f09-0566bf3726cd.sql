-- Add is_main column to identify the main/entry flow
ALTER TABLE public.chatbot_flows ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

-- Ensure only one flow can be main at a time
CREATE OR REPLACE FUNCTION public.ensure_single_main_flow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_main = true THEN
    UPDATE public.chatbot_flows SET is_main = false WHERE id != NEW.id AND is_main = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for single main flow
DROP TRIGGER IF EXISTS trigger_ensure_single_main_flow ON public.chatbot_flows;
CREATE TRIGGER trigger_ensure_single_main_flow
BEFORE INSERT OR UPDATE ON public.chatbot_flows
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_main_flow();

-- Add comment for clarity
COMMENT ON COLUMN public.chatbot_flows.is_main IS 'Indicates if this is the main/entry flow that starts first in the chatbot';