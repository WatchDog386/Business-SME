import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorkspaceLoader, loaderElapsed } from '@/components/ui/workspace-loader';

/** The sign-in loader always shows for this long, start to finish. */
const SIGN_IN_LOADER_MS = 5000;

/**
 * Straight after sign-in. Shows the same loader as the workspace and
 * dashboard steps that follow, so the person sees one loading screen from
 * sign-in until the dashboard is ready, not several. It stays up for five
 * seconds in all, counted from when the loader first appeared.
 */
export function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { redirectTo?: string } | null;
  const redirectTo = state?.redirectTo || '/dashboard';

  useEffect(() => {
    const wait = Math.max(0, SIGN_IN_LOADER_MS - loaderElapsed());
    const timer = window.setTimeout(() => navigate(redirectTo, { replace: true }), wait);
    return () => window.clearTimeout(timer);
  }, [navigate, redirectTo]);

  return <WorkspaceLoader />;
}
