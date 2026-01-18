import { useState, useEffect, useRef } from 'react';
import { Upload, X, Camera, Mail } from 'lucide-react';
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
import { getUserProfile, saveUserProfile, validateUsername, checkUsernameAvailability } from '@/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { SHOE_SIZES, REGULAR_SIZES } from '@/types/clothing';
import { COUNTRIES } from '@/data/countries';
import { uploadProfilePicture } from '@/services/storage';

interface PersonalInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonalInfoDialog({ open, onOpenChange }: PersonalInfoDialogProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
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
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const profileData = await getUserProfile(user.uid);
      if (profileData) {
        setProfile(profileData);
        if (profileData.profilePictureUrl) {
          setProfilePicturePreview(profileData.profilePictureUrl);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingPicture(true);
      setError(null);

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const imageUrl = await uploadProfilePicture(user.uid, file);
      
      // Update profile
      setProfile({ ...profile, profilePictureUrl: imageUrl });
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfile({ ...profile, profilePictureUrl: undefined });
    setProfilePicturePreview(null);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Validate username if provided
      if (profile.username) {
        if (!validateUsername(profile.username)) {
          setError('Username must be 3-20 characters with letters, numbers, and underscores only');
          return;
        }

        const available = await checkUsernameAvailability(profile.username, user.uid);
        if (!available) {
          setError('This username is already taken');
          return;
        }
      }

      // Ensure userId is set in profile
      await saveUserProfile(user.uid, {
        ...profile,
        userId: user.uid,
      });
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personal Information</DialogTitle>
          <DialogDescription>
            Update your personal details and preferences
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {successMessage}
              </div>
            )}

            {/* Profile Picture */}
            <div>
              <Label className="text-sm font-medium text-gray-700 block mb-2">Profile Picture</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profilePicturePreview ? (
                    <div className="relative w-24 h-24">
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

            {/* Email (Read-only) */}
            <div>
              <Label className="text-sm font-medium text-gray-700 block mb-1">Email Address</Label>
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.email || 'Not available'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Your email address cannot be changed</p>
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 block mb-1">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe123"
                value={profile.username || ''}
                onChange={(e) => {
                  setProfile({ ...profile, username: e.target.value });
                  setUsernameAvailable(null);
                }}
                onBlur={async () => {
                  const currentUsername = profile.username?.trim() || '';
                  if (currentUsername && validateUsername(currentUsername)) {
                    setCheckingUsername(true);
                    try {
                      const available = await checkUsernameAvailability(currentUsername, user?.uid);
                      setUsernameAvailable(available);
                    } catch (error) {
                      console.error('Error checking username:', error);
                    } finally {
                      setCheckingUsername(false);
                    }
                  }
                }}
                className={usernameAvailable === true ? 'border-green-500' : ''}
              />
              {checkingUsername && (
                <p className="text-gray-500 text-xs mt-1">Checking availability...</p>
              )}
              {!checkingUsername && usernameAvailable === true && (
                <p className="text-green-500 text-xs mt-1">Username available</p>
              )}
              {profile.username && !validateUsername(profile.username) && (
                <p className="text-red-500 text-xs mt-1">3-20 characters, letters, numbers, and underscores only</p>
              )}
            </div>

            {/* First and Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={profile.firstName || ''}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={profile.lastName || ''}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={profile.dateOfBirth || ''}
                onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Gender */}
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={profile.gender || ''}
                onValueChange={(value) => setProfile({ ...profile, gender: (value || undefined) as 'Male' | 'Female' | 'Other' | undefined })}
              >
                <SelectTrigger id="gender">
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
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="New York"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={profile.country || ''}
                  onValueChange={(value) => setProfile({ ...profile, country: value || undefined })}
                >
                  <SelectTrigger id="country">
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

            {/* Sizes Section */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Size Information</h3>
              <div className="space-y-4">
                {/* Height and Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="e.g., 175"
                      value={profile.heightCm || ''}
                      onChange={(e) => setProfile({ ...profile, heightCm: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="e.g., 75"
                      value={profile.weightKg || ''}
                      onChange={(e) => setProfile({ ...profile, weightKg: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                {/* Shoe Size */}
                <div>
                  <Label htmlFor="shoeSize">Shoe Size (EU)</Label>
                  <Select
                    value={profile.shoeSize || ''}
                    onValueChange={(value) => setProfile({ ...profile, shoeSize: value })}
                  >
                    <SelectTrigger id="shoeSize">
                      <SelectValue placeholder="Select shoe size" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pants Size */}
                <div>
                  <Label htmlFor="pantsSize">Pants Size (US)</Label>
                  <Input
                    id="pantsSize"
                    type="text"
                    placeholder="e.g., 32, 34, 36"
                    value={profile.pantsSizeUs || ''}
                    onChange={(e) => setProfile({ ...profile, pantsSizeUs: e.target.value })}
                  />
                </div>

                {/* Head Size and General Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="headSize">Head Size</Label>
                    <Select
                      value={profile.headSize || ''}
                      onValueChange={(value) => setProfile({ ...profile, headSize: (value || undefined) as any })}
                    >
                      <SelectTrigger id="headSize">
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
                    <Label htmlFor="generalSize">General Size</Label>
                    <Select
                      value={profile.generalSize || ''}
                      onValueChange={(value) => setProfile({ ...profile, generalSize: (value || undefined) as any })}
                    >
                      <SelectTrigger id="generalSize">
                        <SelectValue placeholder="Select general size" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGULAR_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                placeholder="Any additional notes about your preferences..."
                value={profile.notes || ''}
                onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
