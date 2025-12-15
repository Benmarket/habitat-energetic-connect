-- Add target_categories column to popups table for category-based targeting
ALTER TABLE public.popups 
ADD COLUMN target_categories text[] DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.popups.target_categories IS 'Array of category slugs to show popup on article pages. NULL or empty means all categories.';