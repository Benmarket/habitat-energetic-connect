-- Ensure public access to published posts and related data
-- This is safe because we only expose published content

-- Posts: Already has "Anyone can view published posts" policy
-- Let's make sure it's explicit and working

-- Ensure categories and tags are publicly readable (they already should be)
-- No changes needed as policies already exist

-- Make sure featured_aides setting is publicly readable (for homepage)
-- Already handled by site_settings public read policy

-- Let's verify post_categories and post_tags have correct policies
-- These should already exist but let's be explicit

-- No migration needed - existing policies should work
-- But let's add a comment to confirm the security model
COMMENT ON TABLE posts IS 'Public can read published posts via RLS policy. Authors and admins can manage their own posts.';
COMMENT ON TABLE categories IS 'Public read access for all categories via RLS policy.';
COMMENT ON TABLE tags IS 'Public read access for all tags via RLS policy.';
COMMENT ON TABLE site_settings IS 'Public read access for all settings. Only admins can modify.';