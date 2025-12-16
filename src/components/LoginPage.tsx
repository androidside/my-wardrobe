import { useState } from 'react';
import { LoginCredentials, ValidationErrors } from '@/types/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { login } from '@/services/auth';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onLogin: (credentials: LoginCredentials) => void;
}

export function LoginPage({ onSwitchToSignup, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Call Firebase login
      await login(email, password);
      
      // Reset form
      setEmail('');
      setPassword('');
      setErrors({});
      
      // onLogin callback will be triggered by App.tsx auth state change listener
      onLogin({ email, password });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setErrors({ email: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👔</div>
          <h1 className="text-3xl font-bold text-gray-900">My Wardrobe</h1>
          <p className="text-gray-600 mt-2">Manage your style, everywhere</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="you@example.com"
                className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                placeholder="••••••••"
                className={`w-full ${errors.password ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                type="button"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials (for testing):</p>
          <p className="text-sm text-blue-800">
            <span className="font-mono bg-white px-2 py-1 rounded">demo@example.com</span>
          </p>
          <p className="text-sm text-blue-800 mt-1">
            <span className="font-mono bg-white px-2 py-1 rounded">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
