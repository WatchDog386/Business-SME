import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorkspaceLoader } from '@/components/ui/workspace-loader';

/**
 * Straight after sign-in. Shows the same loader as the workspace and
 * dashboard steps that follow, so the person sees one loading screen from
 * sign-in until the dashboard is ready, not several.
 */
export function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { redirectTo?: string } | null;
  const redirectTo = state?.redirectTo || '/dashboard';

  useEffect(() => {
    // Move on at once; the loader carries on while the workspace loads
    navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo]);

  return <WorkspaceLoader />;
}
