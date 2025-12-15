import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SHOE_SIZES, REGULAR_SIZES } from '@/types/clothing';
import { UserProfile } from '@/types/profile';
import { profileStorage } from '@/utils/profileStorage';

export function MyProfile() {
  const [profile, setProfile] = useState<UserProfile>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('MyProfile component mounted');
    try {
      profileStorage.getProfile().then((p) => {
        console.log('Profile loaded:', p);
        if (p) setProfile(p);
      }).catch((err) => {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      });
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError('Error initializing profile');
    }
  }, []);

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await profileStorage.saveProfile(profile);
      alert('Profile saved');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear profile?')) return;
    await profileStorage.clearProfile();
    setProfile({});
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">👤 Personal Information</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 block mb-1">Full name</Label>
            <Input
              id="fullName"
              value={profile.fullName || ''}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="Enter your full name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="shoeSize" className="text-sm font-medium text-gray-700 block mb-1">Shoe size (EU)</Label>
            <Select
              value={profile.shoeSize || ''}
              onValueChange={(v) => update('shoeSize', v || undefined)}
            >
              <SelectTrigger id="shoeSize" className="mt-1 w-full sm:w-48 h-9">
                <SelectValue placeholder="Select shoe size" />
              </SelectTrigger>
              <SelectContent>
                {SHOE_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pantsSize" className="text-sm font-medium text-gray-700 block mb-1">Pants size (US)</Label>
            <Input
              id="pantsSize"
              value={profile.pantsSizeUs || ''}
              onChange={(e) => update('pantsSizeUs', e.target.value)}
              placeholder="e.g., 32, 34"
              className="mt-1 w-full sm:w-40"
            />
          </div>

          <div>
            <Label htmlFor="height" className="text-sm font-medium text-gray-700 block mb-1">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={profile.heightCm ?? ''}
              onChange={(e) => update('heightCm', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g., 175"
              className="mt-1 w-full sm:w-40"
            />
          </div>

          <div>
            <Label htmlFor="weight" className="text-sm font-medium text-gray-700 block mb-1">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              value={profile.weightKg ?? ''}
              onChange={(e) => update('weightKg', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g., 70"
              className="mt-1 w-full sm:w-40"
            />
          </div>

          <div>
            <Label htmlFor="headSize" className="text-sm font-medium text-gray-700 block mb-1">Head size (cm)</Label>
            <Input
              id="headSize"
              type="number"
              value={profile.headSizeCm ?? ''}
              onChange={(e) => update('headSizeCm', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g., 57"
              className="mt-1 w-full sm:w-40"
            />
          </div>

          <div>
            <Label htmlFor="generalSize" className="text-sm font-medium text-gray-700 block mb-1">General size</Label>
            <Select
              value={profile.generalSize || ''}
              onValueChange={(v) => update('generalSize', v as any || undefined)}
            >
              <SelectTrigger id="generalSize" className="mt-1 w-full sm:w-40 h-9">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {REGULAR_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 block mb-1">Notes</Label>
            <Input
              id="notes"
              value={profile.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Any other measurements or notes"
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2"
            >
              {isSaving ? 'Saving...' : '✓ Save Profile'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClear}
              className="px-4 py-2"
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyProfile;
