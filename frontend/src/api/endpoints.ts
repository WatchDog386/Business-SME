import { api, type Paginated } from './client';
import type {
  AuthResult,
  Business,
  BusinessMember,
  Category,
  Customer,
  DashboardData,
  DailySummaryRow,
  Expense,
  InventoryTransaction,
  Payment,
  Product,
  ProductPerformanceRow,
  ProfitLoss,
  Sale,
  SaleDetail,
  Service,
  User,
  UserRole,
} from './types';

// ---- Auth ----

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResult>({ method: 'POST', url: '/auth/login', data: { email, password } }),
  register: (data: {
    email: string;
    fullName: string;
    phone?: string;
    password: string;
  }) => api<AuthResult>({ method: 'POST', url: '/auth/register', data }),
  me: () => api<User>({ method: 'GET', url: '/auth/me' }),
  forgotPassword: (email: string) =>
    api<{ resetToken?: string }>({
      method: 'POST',
      url: '/auth/forgot-password',
      data: { email },
    }),
  resetPassword: (token: string, newPassword: string) =>
    api<{ success: boolean }>({
      method: 'POST',
      url: '/auth/reset-password',
      data: { token, newPassword },
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ success: boolean }>({
      method: 'POST',
      url: '/auth/change-password',
      data: { currentPassword, newPassword },
    }),
  updateProfile: (data: { fullName?: string; phone?: string; avatarUrl?: string }) =>
    api<User>({ method: 'PATCH', url: '/auth/profile', data }),
};

// ---- Businesses ----

export const businessesApi = {
  create: (data: {
    name: string;
    businessType: string;
    phone?: string;
    address?: string;
    county?: string;
    currency?: string;
    timezone?: string;
  }) => api<Business>({ method: 'POST', url: '/businesses', data }),
  mine: () => api<Business[]>({ method: 'GET', url: '/businesses/mine' }),
  current: () => api<Business>({ method: 'GET', url: '/businesses/current' }),
  update: (data: Partial<Business>) =>
    api<Business>({ method: 'PATCH', url: '/businesses/current', data }),
  members: () =>
    api<BusinessMember[]>({ method: 'GET', url: '/businesses/current/members' }),
  addMember: (email: string, role: UserRole) =>
    api<{ email: string; role: UserRole }>({
      method: 'POST',
      url: '/businesses/current/members',
      data: { email, role },
    }),
};

// ---- Categories ----

export const categoriesApi = {
  list: (type?: 'PRODUCT' | 'SERVICE' | 'EXPENSE') =>
    api<Category[]>({
      method: 'GET',
      url: '/categories',
      params: type ? { type } : {},
    }),
  create: (data: { name: string; type: 'PRODUCT' | 'SERVICE' | 'EXPENSE' }) =>
    api<Category>({ method: 'POST', url: '/categories', data }),
};

// ---- Customers ----

export const customersApi = {
  list: (params: { page?: number; limit?: number; search?: string }) =>
    api<Paginated<Customer>>({ method: 'GET', url: '/customers', params }),
  get: (id: string) => api<Customer>({ method: 'GET', url: `/customers/${id}` }),
  create: (data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  }) => api<Customer>({ method: 'POST', url: '/customers', data }),
  update: (
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      notes?: string;
    },
  ) => api<Customer>({ method: 'PATCH', url: `/customers/${id}`, data }),
  remove: (id: string) =>
    api<{ success: boolean }>({ method: 'DELETE', url: `/customers/${id}` }),
};

// ---- Products & Services ----

export const productsApi = {
  list: (params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    stockStatus?: string;
  }) => api<Paginated<Product>>({ method: 'GET', url: '/products', params }),
  get: (id: string) => api<Product>({ method: 'GET', url: `/products/${id}` }),
  create: (data: {
    name: string;
    sku?: string;
    categoryId?: string;
    costPrice: number;
    sellingPrice: number;
    stockQuantity?: number;
    lowStockThreshold?: number;
    trackInventory?: boolean;
  }) => api<Product>({ method: 'POST', url: '/products', data }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      sku: string;
      categoryId: string;
      costPrice: number;
      sellingPrice: number;
      lowStockThreshold: number;
      trackInventory: boolean;
      active: boolean;
    }>,
  ) => api<Product>({ method: 'PATCH', url: `/products/${id}`, data }),
  remove: (id: string) =>
    api<{ success: boolean }>({ method: 'DELETE', url: `/products/${id}` }),
  restock: (id: string, quantity: number, reason?: string) =>
    api<Product>({
      method: 'POST',
      url: `/products/${id}/restock`,
      data: { quantity, reason },
    }),
  adjust: (id: string, quantity: number, reason?: string) =>
    api<Product>({
      method: 'POST',
      url: `/products/${id}/adjust`,
      data: { quantity, reason },
    }),
  damage: (id: string, quantity: number, reason?: string) =>
    api<Product>({
      method: 'POST',
      url: `/products/${id}/damage`,
      data: { quantity, reason },
    }),
  history: (id: string) =>
    api<InventoryTransaction[]>({
      method: 'GET',
      url: `/products/${id}/transactions`,
    }),
};

export const servicesApi = {
  list: (params: { search?: string; categoryId?: string; active?: boolean }) =>
    api<Service[]>({ method: 'GET', url: '/services', params }),
  get: (id: string) => api<Service>({ method: 'GET', url: `/services/${id}` }),
  create: (data: {
    name: string;
    description?: string;
    price: number;
    durationMinutes?: number;
    categoryId?: string;
  }) => api<Service>({ method: 'POST', url: '/services', data }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      durationMinutes: number;
      categoryId: string;
      active: boolean;
    }>,
  ) => api<Service>({ method: 'PATCH', url: `/services/${id}`, data }),
  remove: (id: string) =>
    api<{ success: boolean }>({ method: 'DELETE', url: `/services/${id}` }),
};

// ---- Sales ----

export interface SaleItemInput {
  productId?: string;
  serviceId?: string;
  quantity: number;
}

export interface CreateSaleInput {
  items: SaleItemInput[];
  customerId?: string;
  employeeId?: string;
  discount?: number;
  taxRate?: number;
  paymentMethod: string;
  amountPaid?: number;
  reference?: string;
  notes?: string;
  idempotencyKey: string;
}

export interface SalePreview {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: Array<{
    type: 'PRODUCT' | 'SERVICE';
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export const salesApi = {
  list: (params: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    customerId?: string;
    paymentStatus?: string;
    search?: string;
  }) =>
    api<Paginated<Sale>>({ method: 'GET', url: '/sales', params }),
  get: (id: string) => api<SaleDetail>({ method: 'GET', url: `/sales/${id}` }),
  preview: (data: CreateSaleInput) =>
    api<SalePreview>({ method: 'POST', url: '/sales/preview', data }),
  create: (data: CreateSaleInput) =>
    api<SaleDetail>({ method: 'POST', url: '/sales', data }),
  recordPayment: (
    saleId: string,
    data: { amount: number; method: string; reference?: string; notes?: string },
  ) =>
    api<SaleDetail>({
      method: 'POST',
      url: `/sales/${saleId}/payments`,
      data,
    }),
  cancel: (saleId: string) =>
    api<SaleDetail>({ method: 'POST', url: `/sales/${saleId}/cancel` }),
};

// ---- Expenses ----

export const expensesApi = {
  list: (params: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    categoryId?: string;
    search?: string;
  }) => api<Paginated<Expense>>({ method: 'GET', url: '/expenses', params }),
  get: (id: string) => api<Expense>({ method: 'GET', url: `/expenses/${id}` }),
  create: (data: {
    description: string;
    amount: number;
    categoryId?: string;
    paymentMethod?: string;
    expenseDate?: string;
    receiptUrl?: string;
  }) => api<Expense>({ method: 'POST', url: '/expenses', data }),
  update: (
    id: string,
    data: Partial<{
      description: string;
      amount: number;
      categoryId: string;
      paymentMethod: string;
      expenseDate: string;
      receiptUrl: string;
    }>,
  ) => api<Expense>({ method: 'PATCH', url: `/expenses/${id}`, data }),
  remove: (id: string) =>
    api<{ success: boolean }>({ method: 'DELETE', url: `/expenses/${id}` }),
};

// ---- Dashboard ----

export const dashboardApi = {
  get: () => api<DashboardData>({ method: 'GET', url: '/dashboard' }),
};

// ---- Reports ----

export const reportsApi = {
  profitLoss: (params: { from?: string; to?: string }) =>
    api<ProfitLoss>({ method: 'GET', url: '/reports/profit-loss', params }),
  dailySummary: (params: { from?: string; to?: string }) =>
    api<DailySummaryRow[]>({
      method: 'GET',
      url: '/reports/daily-summary',
      params,
    }),
  productPerformance: (params: { from?: string; to?: string; limit?: number }) =>
    api<ProductPerformanceRow[]>({
      method: 'GET',
      url: '/reports/products',
      params,
    }),
  customerPerformance: (params: { limit?: number }) =>
    api<Customer[]>({ method: 'GET', url: '/reports/customers', params }),
  expenseSummary: (params: { from?: string; to?: string }) =>
    api<Array<{ category: string; amount: number }>>({
      method: 'GET',
      url: '/reports/expenses',
      params,
    }),
};

export type { Payment };