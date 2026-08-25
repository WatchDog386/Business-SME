import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { applyTheme, getTheme } from '@/lib/theme';
import { AppShell } from '@/components/layout/app-shell';
import { SplashPage } from '@/features/auth/splash-page';
import { LoginPage } from '@/features/auth/login-page';
import { RegisterPage } from '@/features/auth/register-page';
import { ForgotPasswordPage } from '@/features/auth/forgot-password-page';
import { ResetPasswordPage } from '@/features/auth/reset-password-page';
import { SuccessPage } from '@/features/auth/success-page';
import { OnboardingPage } from '@/features/onboarding/onboarding-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { CustomersPage } from '@/features/customers/customers-page';
import { CustomerDetailPage } from '@/features/customers/customer-detail-page';
import { ProductsPage } from '@/features/products/products-page';
import { ServicesPage } from '@/features/products/services-page';
import { SalesPage } from '@/features/sales/sales-page';
import { RecordSalePage } from '@/features/sales/record-sale-page';
import { SaleDetailPage } from '@/features/sales/sale-detail-page';
import { ExpensesPage } from '@/features/expenses/expenses-page';
import { AccountPage } from '@/features/account/account-page';
import { ReportsPage } from '@/features/reports/reports-page';
import { ProfilePage } from '@/features/profile/profile-page';
import { NotificationsPage } from '@/features/notifications/notifications-page';
import { AdminGate } from '@/features/admin/admin-gate';
import { AdminOverviewPage } from '@/features/admin/admin-page';
import { AdminBusinessesPage } from '@/features/admin/admin-businesses-page';
import { AdminBusinessDetailPage } from '@/features/admin/admin-business-detail-page';
import { AdminPaymentsPage } from '@/features/admin/admin-payments-page';
import { AdminUsersPage } from '@/features/admin/admin-users-page';
import { AdminSettingsPage } from '@/features/admin/admin-settings-page';

/** Re-applies the theme on every route change so it survives navigation. */
function ThemeScope() {
  const { pathname } = useLocation();

  useEffect(() => {
    applyTheme(getTheme());
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ThemeScope />
      <Routes>
      <Route path="/splash" element={<SplashPage />} />
      <Route path="/" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth-success" element={<SuccessPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/admin" element={<AdminGate />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="businesses" element={<AdminBusinessesPage />} />
        <Route path="businesses/:id" element={<AdminBusinessDetailPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/new" element={<RecordSalePage />} />
        <Route path="/sales/:id" element={<SaleDetailPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}