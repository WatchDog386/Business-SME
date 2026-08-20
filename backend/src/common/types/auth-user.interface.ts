import { Request } from 'express';

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  ACCOUNTANT = 'ACCOUNTANT',
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface RequestWithUser extends Request {
  user: AuthUser;
  membership: {
    id: string;
    businessId: string;
    role: UserRole;
  };
  business: {
    id: string;
    name: string;
    timezone: string;
    currency: string;
  };
}