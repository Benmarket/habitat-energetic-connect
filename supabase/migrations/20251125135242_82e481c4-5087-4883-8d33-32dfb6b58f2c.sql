-- Add scheduled_publish_at column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamp with time zone;

-- Add source column to posts table to track if article is manual or AI automated
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual' CHECK (source IN ('manual', 'ai_auto'));

-- Create article_automations table for AI-powered article scheduling
CREATE TABLE IF NOT EXISTS article_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  instructions text NOT NULL,
  frequency_cron text NOT NULL,
  is_active boolean DEFAULT true,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on article_automations
ALTER TABLE article_automations ENABLE ROW LEVEL SECURITY;

-- RLS policies for article_automations
CREATE POLICY "Users can view their own automations"
  ON article_automations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automations"
  ON article_automations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations"
  ON article_automations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations"
  ON article_automations FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all automations
CREATE POLICY "Admins can view all automations"
  ON article_automations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_article_automations_updated_at
  BEFORE UPDATE ON article_automations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_article_automations_user_id ON article_automations(user_id);
CREATE INDEX IF NOT EXISTS idx_article_automations_is_active ON article_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_publish_at ON posts(scheduled_publish_at) WHERE scheduled_publish_at IS NOT NULL;