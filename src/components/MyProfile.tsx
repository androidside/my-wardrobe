import { useState, useEffect, useRef } from 'react';
import { LogOut, Lock, Mail, Upload, X, Camera } from 'lucide-react';
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
import { uploadProfilePicture } from '@/services/storage';

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
    headSize: undefined,
    generalSize: undefined,
    profilePictureUrl: undefined,
    notes: '',
  });
  
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          // Set profile picture preview if URL exists
          if (userProfile.profilePictureUrl) {
            setProfilePicturePreview(userProfile.profilePictureUrl);
          }
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
      headSize: undefined,
      generalSize: undefined,
      profilePictureUrl: undefined,
      notes: '',
    });
    setProfilePicturePreview(null);
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingPicture(true);
      
      if (!user) {
        alert('No user logged in');
        return;
      }

      // Create temporary preview for immediate feedback
      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);

      // Upload to Firebase Storage
      const fileToUpload = new File([file], `profile_${Date.now()}.jpg`, {
        type: file.type || 'image/jpeg',
      });
      
      console.log('[MyProfile] Uploading profile picture for user:', user.uid);
      console.log('[MyProfile] Storage path will be: users/', user.uid, '/profile/');
      
      const imageUrl = await uploadProfilePicture(user.uid, fileToUpload);
      console.log('[MyProfile] Profile picture uploaded successfully, URL:', imageUrl);
      
      // Update profile with new picture URL
      const updatedProfile = { ...profile, profilePictureUrl: imageUrl };
      setProfile(updatedProfile);
      
      // Save to Firestore immediately to persist the URL
      try {
        await saveUserProfile(user.uid, updatedProfile);
        console.log('[MyProfile] Profile saved with picture URL to Firestore');
      } catch (saveError) {
        console.error('[MyProfile] Failed to save profile with picture URL:', saveError);
        // Profile upload succeeded but save failed - still update local state
        // User can manually save later
      }
      
      // Update preview to use the uploaded URL (Firebase URL is permanent)
      setProfilePicturePreview(imageUrl);
      
      // Clean up temporary preview URL
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      console.error('[MyProfile] Error uploading profile picture:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[MyProfile] Upload error details:', {
        code: (error as any)?.code,
        message: errorMessage,
        serverResponse: (error as any)?.serverResponse,
        storagePath: user ? `users/${user.uid}/profile/` : 'unknown',
      });
      
      // Clean up temporary preview URL on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // Provide more specific error messages
      let userMessage = 'Failed to upload profile picture. Please try again.';
      if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || (error as any)?.code === 'storage/unauthorized') {
        userMessage = 'Permission denied. Please check Firebase Storage security rules. See FIREBASE_STORAGE_RULES.md for setup instructions.';
      } else if (errorMessage.includes('bucket') || errorMessage.includes('Storage bucket') || (error as any)?.code === 'storage/no-default-bucket') {
        userMessage = 'Storage bucket not configured. Please check your Firebase configuration and VITE_FIREBASE_STORAGE_BUCKET in .env file.';
      } else if (errorMessage.includes('not initialized')) {
        userMessage = 'Firebase Storage not initialized. Please check your Firebase configuration.';
      }
      
      alert(userMessage);
      
      // Revert preview to previous picture (if any)
      setProfilePicturePreview(profile.profilePictureUrl || null);
    } finally {
      setUploadingPicture(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user) return;
    
    setProfilePicturePreview(null);
    const updatedProfile = { ...profile, profilePictureUrl: undefined };
    setProfile(updatedProfile);
    
    // Save to Firestore immediately to persist the removal
    try {
      await saveUserProfile(user.uid, updatedProfile);
      console.log('[MyProfile] Profile picture removed from profile');
    } catch (error) {
      console.error('Error removing profile picture from profile:', error);
      // Revert on error
      setProfilePicturePreview(profile.profilePictureUrl || null);
    }
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
          {/* Profile Picture */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {profilePicturePreview ? (
                  <div className="relative">
                    <img
                      src={profilePicturePreview}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Remove picture"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingPicture ? 'Uploading...' : profilePicturePreview ? 'Change Picture' : 'Upload Picture'}
                </Button>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 5MB</p>
              </div>
            </div>
          </div>

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
            <Label htmlFor="headSize" className="text-sm font-medium text-gray-700 block mb-1">Head Size</Label>
            <Select 
              value={profile.headSize || ''} 
              onValueChange={(value) => setProfile({ ...profile, headSize: (value || undefined) as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Other' | undefined })}
            >
              <SelectTrigger id="headSize" className="mt-1">
                <SelectValue placeholder="Select head size" />
              </SelectTrigger>
              <SelectContent>
                {REGULAR_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
