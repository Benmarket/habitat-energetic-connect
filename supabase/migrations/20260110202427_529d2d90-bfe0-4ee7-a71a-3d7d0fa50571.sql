-- Add show_back_button column to chatbot_flows
ALTER TABLE public.chatbot_flows ADD COLUMN IF NOT EXISTS show_back_button BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.chatbot_flows.show_back_button IS 'Show a back button to return to the main flow when this flow is accessed as a secondary flow';