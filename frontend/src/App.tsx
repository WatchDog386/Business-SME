import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { applyTheme, getTheme, isLightOnlyRoute } from '@/lib/theme';
import { AppShell } from '@/components/layout/app-shell';
import { HomePage } from '@/features/home/home-page';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useAuthStore } from '@/stores/auth';
import { LoginPage } from '@/features/auth/login-page';
import { ForgotPasswordPage } from '@/features/auth/forgot-password-page';
import { ResetPasswordPage } from '@/features/auth/reset-password-page';
import { SuccessPage } from '@/features/auth/success-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { CustomersPage } from '@/features/customers/customers-page';
import { CustomerDetailPage } from '@/features/customers/customer-detail-page';
import { ProductsPage } from '@/features/products/products-page';
import { ServicesPage } from '@/features/products/services-page';
import { SalesPage } from '@/features/sales/sales-page';
import { RecordSalePage } from '@/features/sales/record-sale-page';
import { SaleDetailPage } from '@/features/sales/sale-detail-page';
import { ExpensesPage } from '@/features/expenses/expenses-page';
import { RecurringExpensesPage } from '@/features/expenses/recurring-expenses-page';
import { BudgetsPage } from '@/features/budgets/budgets-page';
import { AccountPage } from '@/features/account/account-page';
import { ReportsPage } from '@/features/reports/reports-page';
import { ProfilePage } from '@/features/profile/profile-page';
import { NotificationsPage } from '@/features/notifications/notifications-page';
import { StaffPage } from '@/features/business/staff-page';
import { SubscribersPage } from '@/features/isp/subscribers-page';
import { SubscriberFormPage } from '@/features/isp/subscriber-form-page';
import { CallsPage } from '@/features/isp/calls-page';
import { WelcomePage, hasOnboarded } from '@/features/onboarding/welcome-page';
import { NotFoundPage } from '@/features/misc/not-found-page';
import { OfflineBanner } from '@/components/layout/offline-banner';

/**
 * Desktop visitors get the landing page. Phones go straight to work: the boot
 * splash in index.html covers the app while it loads, then first-timers see
 * the welcome screens before signing in.
 */
function HomeRoute() {
  const isDesktop = useIsDesktop();
  const token = useAuthStore((s) => s.token);
  if (isDesktop) return <HomePage />;
  if (token) return <Navigate to="/dashboard" replace />;
  return <Navigate to={hasOnboarded() ? '/login' : '/welcome'} replace />;
}

/** Re-applies the theme on every route change; home/auth/success stay light. */
function ThemeScope() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (isLightOnlyRoute(pathname)) {
      document.documentElement.classList.remove('dark');
    } else {
      applyTheme(getTheme());
    }
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ThemeScope />
      <OfflineBanner />
      <Routes>
      <Route path="/splash" element={<Navigate to="/" replace />} />
      <Route path="/" element={<HomeRoute />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Accounts are created by the company admin — no public sign-up */}
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth-success" element={<SuccessPage />} />

      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<Navigate to="/products?new=1" replace />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/new" element={<Navigate to="/services?new=1" replace />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/new" element={<RecordSalePage />} />
        <Route path="/sales/:id" element={<SaleDetailPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/expenses/recurring" element={<RecurringExpensesPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/subscribers" element={<SubscribersPage />} />
        <Route path="/subscribers/new" element={<SubscriberFormPage />} />
        <Route path="/subscribers/:id/edit" element={<SubscriberFormPage />} />
        <Route path="/calls" element={<CallsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}