-- Create table for chatbot flows
CREATE TABLE public.chatbot_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  tree_structure JSONB NOT NULL DEFAULT '{"start_node": "node_1", "nodes": {}}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chatbot_flows ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage chatbot flows
CREATE POLICY "Admins can manage chatbot flows"
ON public.chatbot_flows
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Policy: Public can view active flows
CREATE POLICY "Public can view active chatbot flows"
ON public.chatbot_flows
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_chatbot_flows_updated_at
BEFORE UPDATE ON public.chatbot_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default starter flow
INSERT INTO public.chatbot_flows (name, description, is_active, tree_structure)
VALUES (
  'Parcours de qualification par défaut',
  'Parcours initial pour qualifier les prospects',
  true,
  '{
    "start_node": "node_1",
    "nodes": {
      "node_1": {
        "type": "question",
        "question": "Comment puis-je vous aider aujourd''hui ?",
        "answer_type": "buttons",
        "options": [
          {"label": "Isolation thermique", "next_node": "node_2"},
          {"label": "Chauffage / Pompe à chaleur", "next_node": "node_2"},
          {"label": "Panneaux solaires", "next_node": "node_2"},
          {"label": "Autre question", "next_node": "node_agent"}
        ]
      },
      "node_2": {
        "type": "question",
        "question": "Êtes-vous propriétaire de votre logement ?",
        "answer_type": "buttons",
        "options": [
          {"label": "Oui", "next_node": "node_3"},
          {"label": "Non", "next_node": "non_prospect_1"}
        ]
      },
      "node_3": {
        "type": "question",
        "question": "Quel est votre code postal ?",
        "answer_type": "text",
        "next_node": "node_4"
      },
      "node_4": {
        "type": "end",
        "message": "Parfait ! Un conseiller va prendre contact avec vous sous peu. Puis-je avoir votre email pour vous recontacter ?",
        "is_qualified": true
      },
      "non_prospect_1": {
        "type": "end",
        "message": "Nos services s''adressent uniquement aux propriétaires. Cependant, vous pouvez consulter nos guides pour obtenir des informations utiles.",
        "is_qualified": false
      },
      "node_agent": {
        "type": "agent_handoff",
        "message": "Je comprends. Souhaitez-vous parler à un conseiller humain ?",
        "is_qualified": true
      }
    }
  }'::jsonb
);