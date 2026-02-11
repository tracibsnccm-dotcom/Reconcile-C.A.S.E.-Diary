import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window to top on route changes (pathname or search).
 * Mount once near the router (e.g. in App/main Routes) to fix "each step loads
 * scrolled to bottom" for client intake and other multi-step flows.
 */
export function ScrollToTopOnRouteChange() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);
  return null;
}
