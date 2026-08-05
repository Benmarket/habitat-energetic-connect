-- forum_images: remove public read of PII
DROP POLICY IF EXISTS "Anyone can view forum images" ON public.forum_images;

CREATE POLICY "Users can view their own forum images"
ON public.forum_images
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all forum images"
ON public.forum_images
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can update their own forum images"
ON public.forum_images
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

REVOKE SELECT ON public.forum_images FROM anon;

-- media: restrict cross-user visibility
DROP POLICY IF EXISTS "Authenticated users can view media" ON public.media;

CREATE POLICY "Users can view their own media"
ON public.media
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all media"
ON public.media
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));