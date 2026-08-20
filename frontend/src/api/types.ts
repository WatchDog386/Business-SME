import type { Paginated } from './client';

export type UserRole = 'OWNER' | 'MANAGER' | 'EMPLOYEE' | 'ACCOUNTANT';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export interface AuthResult {
  accessToken: string;
  user: User;
}

export interface Business {
  id: string;
  name: string;
  business_type: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  county: string | null;
  currency: string;
  timezone: string;
  subscription_plan: string;
  status: string;
  ownerId: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  role: UserRole;
  status: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
}

export interface Category {
  id: string;
  businessId: string;
  type: 'PRODUCT' | 'SERVICE' | 'EXPENSE';
  name: string;
  created_at: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  total_spent: number;
  outstanding_balance: number;
  visit_count: number;
  last_visit_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string | null;
  categoryId: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
  stock_status?: StockStatus;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  categoryId: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'M-PESA' | 'CASH' | 'BANK' | 'CARD' | 'CREDIT';
export type PaymentStatus =
  | 'PAID'
  | 'PARTIAL'
  | 'UNPAID'
  | 'REFUNDED'
  | 'CANCELLED';

export interface Sale {
  id: string;
  businessId: string;
  customerId: string | null;
  employeeId: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes: string | null;
  idempotency_key: string;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string | null;
  item_count?: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string | null;
  serviceId: string | null;
  quantity: number;
  unit_price: number;
  cost_price: number | null;
  total: number;
  item_name: string | null;
  product_name?: string | null;
  service_name?: string | null;
}

export interface Payment {
  id: string;
  businessId: string;
  saleId: string | null;
  customerId: string | null;
  amount: number;
  method: string;
  reference: string | null;
  status: string;
  transaction_date: string;
  created_at: string;
}

export interface SaleDetail extends Sale {
  customer: Customer | null;
  items: SaleItem[];
  payments: Payment[];
}

export interface Expense {
  id: string;
  businessId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  payment_method: string;
  receipt_url: string | null;
  employeeId: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
}

export interface DashboardData {
  today: {
    sales: number;
    expenses: number;
    grossProfit: number;
    netProfit: number;
    salesCount: number;
  };
  weekRevenue: number;
  monthRevenue: number;
  outstandingDebts: number;
  lowStock: number;
  appointmentsToday: number;
  recentCustomers: Customer[];
  recentTransactions: Array<{
    type: 'SALE' | 'EXPENSE';
    id: string;
    amount: number;
    paymentMethod: string;
    status: string;
    description: string;
    customerName: string | null;
    createdAt: string;
  }>;
  topProducts: Array<{ name: string; quantity: string; revenue: string }>;
  salesSeries: Array<{ date: string; total: string }>;
}

export interface ProfitLoss {
  from: string;
  to: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  salesCount: number;
  averageSaleValue: number;
  revenueByMethod: Array<{ method: string; total: number }>;
}

export interface DailySummaryRow {
  date: string;
  revenue: number;
  cogs: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface ProductPerformanceRow {
  name: string;
  quantity: number;
  revenue: number;
  cogs: number;
  profit: number;
}

export interface InventoryTransaction {
  id: string;
  businessId: string;
  productId: string;
  type: string;
  quantity: number;
  referenceId: string | null;
  reason: string | null;
  created_at: string;
}

export type {
  Paginated,
};