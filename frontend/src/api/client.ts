import axios, { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: ApiError;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export class ApiErrorShape extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

function getToken(): string | null {
  return localStorage.getItem('ksa_token');
}

function getBusinessId(): string | null {
  return localStorage.getItem('ksa_business_id');
}

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const businessId = getBusinessId();
  if (businessId) {
    config.headers['X-Business-Id'] = businessId;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    if (status === 401) {
      localStorage.removeItem('ksa_token');
      localStorage.removeItem('ksa_business_id');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    const err = new ApiErrorShape(
      status,
      body?.error?.code ?? (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED'),
      body?.error?.message ?? 'Something went wrong. Please try again.',
      body?.error?.details,
    );
    return Promise.reject(err);
  },
);

export async function api<T>(
  ...args: Parameters<typeof client.request>
): Promise<T> {
  const config = args[0];
  const response = await client.request<ApiEnvelope<T>>(config);
  return response.data.data;
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiErrorShape) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export { client };