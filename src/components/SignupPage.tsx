import { useState } from 'react';
import { SignupCredentials, ValidationErrors } from '@/types/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { COUNTRIES } from '@/data/countries';
import { validateUsername, checkUsernameAvailability } from '@/services/firestore';

interface SignupPageProps {
  onSwitchToLogin: () => void;
  onSignup: (credentials: SignupCredentials) => void;
}

export function SignupPage({ onSwitchToLogin, onSignup }: SignupPageProps) {
  const { signup: signupUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

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

    // Username validation
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(username.trim())) {
      newErrors.username = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
    } else if (usernameAvailable === false) {
      newErrors.username = 'This username is already taken';
    }

    // Personal information validation
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Validate date is not in the future
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    if (!gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!country.trim()) {
      newErrors.country = 'Country is required';
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
      // Call signup from AuthContext
      await signupUser(email, password);
      
      // Call callback with profile data for saving
      onSignup({ 
        email, 
        password, 
        confirmPassword,
        profile: {
          username: username.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth,
          gender: gender as 'Male' | 'Female' | 'Other',
          city: city.trim(),
          country: country.trim(),
        }
      });
      
      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setGender('');
      setCity('');
      setCountry('');
      setErrors({});
      setUsernameAvailable(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      setErrors({ email: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
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
            {/* Personal Information Section */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              
              {/* Username */}
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700 block mb-2">
                  Username *
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const newUsername = e.target.value;
                    setUsername(newUsername);
                    setUsernameAvailable(null);
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                  onBlur={async () => {
                    if (username.trim() && validateUsername(username.trim())) {
                      setCheckingUsername(true);
                      try {
                        const available = await checkUsernameAvailability(username.trim());
                        setUsernameAvailable(available);
                        if (!available) {
                          setErrors({ ...errors, username: 'This username is already taken' });
                        }
                      } catch (error) {
                        console.error('Error checking username:', error);
                      } finally {
                        setCheckingUsername(false);
                      }
                    }
                  }}
                  placeholder="johndoe123"
                  className={`w-full ${errors.username ? 'border-red-500' : usernameAvailable === true ? 'border-green-500' : ''}`}
                  disabled={isLoading}
                />
                {checkingUsername && (
                  <p className="text-gray-500 text-sm mt-1">Checking availability...</p>
                )}
                {!checkingUsername && usernameAvailable === true && !errors.username && (
                  <p className="text-green-500 text-sm mt-1">Username available</p>
                )}
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
                {username.trim() && !errors.username && !checkingUsername && usernameAvailable === null && (
                  <p className="text-gray-500 text-sm mt-1">3-20 characters, letters, numbers, and underscores only</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* First Name */}
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 block mb-2">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                    }}
                    placeholder="John"
                    className={`w-full ${errors.firstName ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 block mb-2">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                    }}
                    placeholder="Doe"
                    className={`w-full ${errors.lastName ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="mt-4">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 block mb-2">
                  Date of Birth *
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: undefined });
                  }}
                  className={`w-full ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* Gender */}
              <div className="mt-4">
                <Label htmlFor="gender" className="text-sm font-medium text-gray-700 block mb-2">
                  Gender *
                </Label>
                <Select
                  value={gender}
                  onValueChange={(value) => {
                    setGender(value as 'Male' | 'Female' | 'Other');
                    if (errors.gender) setErrors({ ...errors, gender: undefined });
                  }}
                >
                  <SelectTrigger 
                    id="gender" 
                    className={`w-full ${errors.gender ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                )}
              </div>

              {/* City and Country */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium text-gray-700 block mb-2">
                    City *
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors({ ...errors, city: undefined });
                    }}
                    placeholder="New York"
                    className={`w-full ${errors.city ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country" className="text-sm font-medium text-gray-700 block mb-2">
                    Country *
                  </Label>
                  <Select
                    value={country}
                    onValueChange={(value) => {
                      setCountry(value);
                      if (errors.country) setErrors({ ...errors, country: undefined });
                    }}
                  >
                    <SelectTrigger 
                      id="country" 
                      className={`w-full ${errors.country ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    >
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {COUNTRIES.map((countryName) => (
                        <SelectItem key={countryName} value={countryName}>
                          {countryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              
              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-2">
                  Email Address *
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
              <div className="mt-4">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-2">
                  Password *
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
              <div className="mt-4">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block mb-2">
                  Confirm Password *
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
