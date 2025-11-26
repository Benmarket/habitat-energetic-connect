-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT DEFAULT 'footer',
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public can insert (subscribe)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins and users with poster_actualite permission can view subscribers
CREATE POLICY "Authorized users can view newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'moderator') OR
  has_permission(auth.uid(), 'poster_actualite')
);

-- Only admins can delete subscribers
CREATE POLICY "Admins can delete newsletter subscribers"
ON public.newsletter_subscribers
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'admin')
);

-- Only admins can update (for unsubscribe status)
CREATE POLICY "Admins can update newsletter subscribers"
ON public.newsletter_subscribers
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'admin')
);

-- Add trigger for updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();