import { usePageViewTracking } from "@/hooks/usePageViewTracking";

/**
 * Component that enables page view tracking with region context.
 * This should be placed inside BrowserRouter and RegionProvider.
 */
const PageViewTracker = () => {
  usePageViewTracking();
  return null;
};

export default PageViewTracker;
