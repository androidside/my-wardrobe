export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthUser {
  uid: string;
  email: string;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}
