-- Add expires_at column to advertisements table
ALTER TABLE public.advertisements 
ADD COLUMN expires_at timestamp with time zone NULL;

-- Add index for performance when filtering by expiration
CREATE INDEX idx_advertisements_expires_at ON public.advertisements (expires_at);

-- Comment for documentation
COMMENT ON COLUMN public.advertisements.expires_at IS 'Date and time when the advertisement expires. NULL means no expiration.';