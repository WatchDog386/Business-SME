import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useBootstrap } from '@/hooks/use-bootstrap';
import { useBusinessStore } from '@/stores/business';
import { useAuthStore } from '@/stores/auth';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { Topbar } from './topbar';
import { PageLoader } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function AppShell() {
  const { token, loading } = useBootstrap();
  const businesses = useBusinessStore((s) => s.businesses);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (businesses.length === 0) {
    // Platform admins have no business of their own — send them to the admin console.
    if (user?.isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main
          className={cn(
            'flex-1 px-4 pb-28 lg:px-8 lg:pb-10',
            isDashboard ? 'pt-2 pb-28 lg:pt-3 lg:pb-10' : 'py-6 lg:py-8',
          )}
        >
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
