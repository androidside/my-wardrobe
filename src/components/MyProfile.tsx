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

  useEffect(() => {
    profileStorage.getProfile().then((p) => {
      if (p) setProfile(p);
    });
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
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">My Profile</h2>
      <div className="space-y-4">
        <div>
          <Label className="text-base">Full name</Label>
          <Input
            value={profile.fullName || ''}
            onChange={(e) => update('fullName', e.target.value)}
            placeholder="Your name"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-base">Shoe size (EU)</Label>
          <Select
            value={profile.shoeSize || ''}
            onValueChange={(v) => update('shoeSize', v)}
          >
            <SelectTrigger className="mt-1 w-48 h-9">
              <SelectValue placeholder="Select shoe size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {SHOE_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base">Pants size (US)</Label>
          <Input
            value={profile.pantsSizeUs || ''}
            onChange={(e) => update('pantsSizeUs', e.target.value)}
            placeholder="e.g., 32, 34"
            className="mt-1 w-40"
          />
        </div>

        <div>
          <Label className="text-base">Height (cm)</Label>
          <Input
            type="number"
            value={profile.heightCm ?? ''}
            onChange={(e) => update('heightCm', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="e.g., 175"
            className="mt-1 w-40"
          />
        </div>

        <div>
          <Label className="text-base">General size</Label>
          <Select
            value={profile.generalSize || ''}
            onValueChange={(v) => update('generalSize', v as any)}
          >
            <SelectTrigger className="mt-1 w-40 h-9">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {REGULAR_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base">Notes</Label>
          <Input
            value={profile.notes || ''}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Any other measurements or notes"
            className="mt-1"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MyProfile;
