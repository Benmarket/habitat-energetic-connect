-- Enable RLS on realtime.messages and restrict subscriptions to authenticated users.
-- The actual row payloads from postgres_changes are already filtered by RLS on the
-- source tables (chat_conversations, chat_messages, chat_agent_requests).
-- This adds a second layer that prevents anonymous JWT-less clients from opening
-- broadcast/presence/postgres_changes channels on realtime.messages.

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated users can receive broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can send broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated users can send broadcasts"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);