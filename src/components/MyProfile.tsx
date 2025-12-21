import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/types/profile';
import { getUserProfile, saveUserProfile } from '@/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { SHOE_SIZES, REGULAR_SIZES } from '@/types/clothing';

export function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
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
      fullName: '',
      shoeSize: '',
      pantsSizeUs: '',
      heightCm: undefined,
      weightKg: undefined,
      headSizeCm: undefined,
      generalSize: undefined,
      notes: '',
    });
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
          <div>
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 block mb-1">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={profile.fullName || ''}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="mt-1"
            />
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
      </div>
    </div>
  );
}

export default MyProfile;
