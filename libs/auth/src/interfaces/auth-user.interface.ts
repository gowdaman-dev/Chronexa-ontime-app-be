export interface AuthUser {
  userId: number;
  login: string;
  employeeId: number;
  role: string;
  isADUser: boolean;
}

export interface TokenValidationResult {
  valid: boolean;
  user?: AuthUser;
  message?: string;
}
