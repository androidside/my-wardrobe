import { useState } from 'react';
import { SignupCredentials, ValidationErrors } from '@/types/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { signup } from '@/services/auth';

interface SignupPageProps {
  onSwitchToLogin: () => void;
  onSignup: (credentials: SignupCredentials) => void;
}

export function SignupPage({ onSwitchToLogin, onSignup }: SignupPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      newErrors.password = 'Password must contain uppercase letter and number';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      // Call Firebase signup
      await signup(email, password);
      
      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
      
      // onSignup callback will be triggered by App.tsx auth state change listener
      onSignup({ email, password, confirmPassword });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
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
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

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
              <p className="text-xs text-gray-500 mt-1">
                At least 6 characters, 1 uppercase letter, 1 number
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block mb-2">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                placeholder="••••••••"
                className={`w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                type="button"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This demo doesn't save data yet. Use any credentials to test.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
