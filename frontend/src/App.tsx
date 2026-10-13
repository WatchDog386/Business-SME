import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { applyTheme, getTheme } from '@/lib/theme';
import { AppShell } from '@/components/layout/app-shell';
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
import { CallsPage } from '@/features/isp/calls-page';
import { WelcomePage } from '@/features/onboarding/welcome-page';
import { MobileHomePage } from '@/features/home/mobile-home-page';
import { ClientProfilePage } from '@/features/client/client-profile-page';
import {
  ClientContactPage,
  ClientPackagesPage,
  ClientPayPage,
  ClientPaymentsPage,
} from '@/features/client/client-pages';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { NotFoundPage } from '@/features/misc/not-found-page';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { SessionTimeout } from '@/components/layout/session-timeout';
import { PopupHost } from '@/components/ui/popup-host';

/**
 * Signed-in users go straight to the dashboard. Signed-out phones see the mobile
 * home page (also where logout lands); desktop opens the login page.
 */
function HomeRoute() {
  const token = useAuthStore((s) => s.token);
  const isDesktop = useIsDesktop();
  if (token) return <Navigate to="/dashboard" replace />;
  if (!isDesktop) return <MobileHomePage />;
  return <Navigate to="/login" replace />;
}

/** Re-applies the theme on every route change; home/auth/success stay light. */
function ThemeScope() {
  const { pathname } = useLocation();

  useEffect(() => {
    // applyTheme handles the light-only routes too (dark off, white status bar)
    applyTheme(getTheme());
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ThemeScope />
      <OfflineBanner />
      <SessionTimeout />
      <PopupHost />
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
        {/* Subscriber's own pages (packages, pay, receipts, support, account) */}
        <Route path="/my-account" element={<ClientProfilePage />} />
        <Route path="/my-packages" element={<ClientPackagesPage />} />
        <Route path="/my-pay" element={<ClientPayPage />} />
        <Route path="/my-payments" element={<ClientPaymentsPage />} />
        <Route path="/my-contact" element={<ClientContactPage />} />
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
        <Route path="/calls" element={<CallsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}