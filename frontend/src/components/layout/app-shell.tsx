import { useEffect } from 'react';
import { WorkspaceLoader } from '@/components/ui/workspace-loader';
import { Navigate, useLocation } from 'react-router-dom';
import { useBootstrap } from '@/hooks/use-bootstrap';
import { useBusinessStore } from '@/stores/business';
import { useAuthStore } from '@/stores/auth';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { AnimatedOutlet } from './animated-outlet';
import { Topbar } from './topbar';
import { Brand } from './brand';
import { cn } from '@/lib/utils';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { hasOnboarded } from '@/features/onboarding/welcome-page';
import { useTheme } from '@/lib/theme';
import { useRole } from '@/hooks/use-role';

export function AppShell() {
  const { token, loading } = useBootstrap();
  const businesses = useBusinessStore((s) => s.businesses);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const { isClient } = useRole();

  // Pinned headers only show their edge once the page has scrolled under them
  useEffect(() => {
    const onScroll = () => document.documentElement.classList.toggle('page-scrolled', window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.documentElement.classList.remove('page-scrolled');
    };
  }, []);
  const isDesktop = useIsDesktop();
  const [theme] = useTheme();

  // Inside the app the phone's status bar matches the page (white, or #121212
  // in dark mode) instead of the Optimas blue kept for the opening splash
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    const splashBlue = meta.content;
    // Phone pages have a soft sky glow at the top: the status bar matches it
    const glow = !isDesktop;
    document.body.classList.toggle('app-glow', glow);
    meta.content = theme === 'dark' ? (glow ? '#16202F' : '#121212') : glow ? '#D7E7FF' : '#FFFFFF';
    return () => {
      meta.content = splashBlue;
      document.body.classList.remove('app-glow');
    };
  }, [theme, isDesktop]);

  if (!token) {
    return <Navigate to={isDesktop || hasOnboarded() ? '/login' : '/welcome'} replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <WorkspaceLoader />
      </div>
    );
  }

  if (businesses.length === 0) {
    return <NoAccess name={user?.fullName} onSignOut={logout} />;
  }

  // Clients only have their own dashboard: no staff menu, footer bar or other pages
  if (isClient) {
    if (!isDashboard) return <Navigate to="/dashboard" replace />;
    return (
      <main className="mx-auto w-full max-w-xl px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-2 lg:pt-8">
        <AnimatedOutlet />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main
          className={cn(
            // Bottom room so the last item scrolls clear of the floating nav bar
            // overflow-x-clip: pages slide in from the side; without it the page is briefly
            // wider than the screen and the fixed footer bar shifts with it
            'min-w-0 flex-1 overflow-x-clip px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-10',
            isDashboard ? 'pt-2 lg:pt-8' : 'pt-6 lg:py-8',
          )}
        >
          <div className="mx-auto w-full max-w-6xl lg:max-w-none">
            <AnimatedOutlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

/** Signed-in user who hasn't been added to the company yet. */
function NoAccess({ name, onSignOut }: { name?: string; onSignOut: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm space-y-4 text-center">
        <Brand className="justify-center" compact />
        <h1 className="text-lg font-medium text-foreground">
          {name ? `Hi ${name.split(' ')[0]}, ` : ''}your account isn&apos;t active yet
        </h1>
        <p className="text-sm text-foreground-4">
          Ask an Optimas administrator to add you from the Staff page, then sign in again.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-full border border-edge px-5 py-2 text-sm font-medium text-foreground hover:bg-surface-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
