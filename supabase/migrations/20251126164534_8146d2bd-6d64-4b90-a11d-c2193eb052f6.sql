-- Add sender_name column to chat_messages table
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS sender_name text;