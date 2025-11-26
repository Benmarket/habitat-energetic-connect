-- Create chat_conversations table to store all conversations
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id TEXT, -- For anonymous users
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'awaiting_agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat_messages table to store all messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot', 'agent')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- For agent messages
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat_agent_requests table for human assistance requests
CREATE TABLE public.chat_agent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'closed')),
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_agent_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id OR visitor_id IS NOT NULL);

CREATE POLICY "Users can create conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR visitor_id IS NOT NULL);

CREATE POLICY "Admins can view all conversations"
  ON public.chat_conversations FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'moderator')
  );

CREATE POLICY "Admins can update conversations"
  ON public.chat_conversations FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'moderator')
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = chat_messages.conversation_id
      AND (user_id = auth.uid() OR visitor_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = chat_messages.conversation_id
      AND (user_id = auth.uid() OR visitor_id IS NOT NULL)
    )
  );

CREATE POLICY "Admins can view all messages"
  ON public.chat_messages FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'moderator')
  );

CREATE POLICY "Admins can create messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_type = 'agent' AND
    (public.has_role(auth.uid(), 'super_admin') OR 
     public.has_role(auth.uid(), 'admin') OR 
     public.has_role(auth.uid(), 'moderator'))
  );

-- RLS Policies for chat_agent_requests
CREATE POLICY "Users can create agent requests"
  ON public.chat_agent_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = chat_agent_requests.conversation_id
      AND (user_id = auth.uid() OR visitor_id IS NOT NULL)
    )
  );

CREATE POLICY "Admins can view all agent requests"
  ON public.chat_agent_requests FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'moderator')
  );

CREATE POLICY "Admins can update agent requests"
  ON public.chat_agent_requests FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'moderator')
  );

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_agent_requests;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_chat_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_chat_conversation_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_conversation_updated_at();