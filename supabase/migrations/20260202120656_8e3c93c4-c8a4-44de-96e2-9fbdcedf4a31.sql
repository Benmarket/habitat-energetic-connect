-- Drop existing public policy for posts table
DROP POLICY IF EXISTS "Public read access for published non-members-only posts" ON public.posts;

-- Create new policy that allows reading all published posts metadata
-- The frontend will handle showing paywall for members-only content
CREATE POLICY "Public read access for published posts"
ON public.posts
FOR SELECT
USING (
  status = 'published'::post_status
);

-- For authenticated users, they can read all published posts (they are members)
-- This is already covered by the policy above since any published post is accessible
-- The is_members_only flag is now handled purely on the frontend