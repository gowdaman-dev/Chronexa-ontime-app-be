export interface AuthUser {
  userId: number;
  login: string;
  employeeId: number;
  role: string;
  employeeType: string;
  isADUser: boolean;
}

export interface TokenValidationResult {
  valid: boolean;
  user?: AuthUser;
  message?: string;
}
