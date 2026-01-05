import { useState, useEffect } from 'react';
import { LogOut, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UserProfile } from '@/types/profile';
import { getUserProfile, saveUserProfile } from '@/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserPassword } from '@/services/auth';
import { SHOE_SIZES, REGULAR_SIZES } from '@/types/clothing';
import { COUNTRIES } from '@/data/countries';

export function MyProfile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: undefined,
    city: '',
    country: '',
    shoeSize: '',
    pantsSizeUs: '',
    heightCm: undefined,
    weightKg: undefined,
    headSizeCm: undefined,
    generalSize: undefined,
    notes: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('MyProfile: Current user from context:', user);
        
        if (!user) {
          setError('No user logged in');
          setLoading(false);
          return;
        }

        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          setProfile(userProfile);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (!user) {
        setError('No user logged in');
        return;
      }

      await saveUserProfile(user.uid, profile);
      setSuccessMessage('Profile saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearProfile = () => {
    setProfile({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: undefined,
      city: '',
      country: '',
      shoeSize: '',
      pantsSizeUs: '',
      heightCm: undefined,
      weightKg: undefined,
      headSizeCm: undefined,
      generalSize: undefined,
      notes: '',
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      setUpdatingPassword(true);
      setPasswordError(null);

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordError('All fields are required');
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters');
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      if (currentPassword === newPassword) {
        setPasswordError('New password must be different from current password');
        return;
      }

      await updateUserPassword(currentPassword, newPassword);
      
      // Success - clear form and close dialog
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordDialog(false);
      setSuccessMessage('Password updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">👤 Personal Information</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            ✓ {successMessage}
          </div>
        )}

        <div className="space-y-5">
          {/* Email Display (Read-only) */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-1">Email Address</Label>
            <div className="flex items-center gap-2 mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{user?.email || 'Not available'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Your email address cannot be changed</p>
          </div>

          {/* First Name and Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 block mb-1">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={profile.firstName || ''}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 block mb-1">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={profile.lastName || ''}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 block mb-1">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={profile.dateOfBirth || ''}
              onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
              className="mt-1"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Gender */}
          <div>
            <Label htmlFor="gender" className="text-sm font-medium text-gray-700 block mb-1">Gender</Label>
            <Select 
              value={profile.gender || ''} 
              onValueChange={(value) => setProfile({ ...profile, gender: (value || undefined) as 'Male' | 'Female' | 'Other' | undefined })}
            >
              <SelectTrigger id="gender" className="mt-1">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* City and Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-sm font-medium text-gray-700 block mb-1">City</Label>
              <Input
                id="city"
                type="text"
                placeholder="New York"
                value={profile.city || ''}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country" className="text-sm font-medium text-gray-700 block mb-1">Country</Label>
              <Select 
                value={profile.country || ''} 
                onValueChange={(value) => setProfile({ ...profile, country: value || undefined })}
              >
                <SelectTrigger id="country" className="mt-1">
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
            </div>
          </div>

          <div>
            <Label htmlFor="shoeSize" className="text-sm font-medium text-gray-700 block mb-1">Shoe Size (EU)</Label>
            <Select 
              value={profile.shoeSize || ''} 
              onValueChange={(value) => setProfile({ ...profile, shoeSize: value })}
            >
              <SelectTrigger id="shoeSize" className="mt-1">
                <SelectValue placeholder="Select shoe size" />
              </SelectTrigger>
              <SelectContent>
                {SHOE_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pantsSize" className="text-sm font-medium text-gray-700 block mb-1">Pants Size (US)</Label>
            <Input
              id="pantsSize"
              type="text"
              placeholder="e.g., 32, 34, 36"
              value={profile.pantsSizeUs || ''}
              onChange={(e) => setProfile({ ...profile, pantsSizeUs: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="height" className="text-sm font-medium text-gray-700 block mb-1">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="e.g., 175"
              value={profile.heightCm || ''}
              onChange={(e) => setProfile({ ...profile, heightCm: e.target.value ? parseInt(e.target.value) : undefined })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="weight" className="text-sm font-medium text-gray-700 block mb-1">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="e.g., 75"
              value={profile.weightKg || ''}
              onChange={(e) => setProfile({ ...profile, weightKg: e.target.value ? parseInt(e.target.value) : undefined })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="headSize" className="text-sm font-medium text-gray-700 block mb-1">Head Size (cm)</Label>
            <Input
              id="headSize"
              type="number"
              placeholder="e.g., 58"
              value={profile.headSizeCm || ''}
              onChange={(e) => setProfile({ ...profile, headSizeCm: e.target.value ? parseInt(e.target.value) : undefined })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="generalSize" className="text-sm font-medium text-gray-700 block mb-1">General Size</Label>
            <Select 
              value={profile.generalSize || ''} 
              onValueChange={(value) => setProfile({ ...profile, generalSize: (value || undefined) as any })}
            >
              <SelectTrigger id="generalSize" className="mt-1">
                <SelectValue placeholder="Select general size" />
              </SelectTrigger>
              <SelectContent>
                {REGULAR_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 block mb-1">Notes</Label>
            <textarea
              id="notes"
              placeholder="Any additional notes about your preferences..."
              value={profile.notes || ''}
              onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button 
            onClick={handleSaveProfile} 
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
          <Button 
            onClick={handleClearProfile}
            variant="outline"
            className="flex-1"
          >
            Clear All
          </Button>
        </div>

        {/* Password Update Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
          <Button
            onClick={() => setShowPasswordDialog(true)}
            variant="outline"
            className="w-full"
          >
            <Lock className="h-4 w-4 mr-2" />
            Update Password
          </Button>
        </div>

        {/* Logout Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Password Update Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {passwordError}
              </div>
            )}

            <div>
              <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 block mb-1">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 block mb-1">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block mb-1">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => {
                setShowPasswordDialog(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError(null);
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePassword}
              disabled={updatingPassword}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyProfile;
