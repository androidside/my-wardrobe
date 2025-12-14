import { UserProfile } from '@/types/profile';

const PROFILE_KEY = 'wardrobe_user_profile';

class ProfileStorage {
  async getProfile(): Promise<UserProfile | null> {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error('Error reading profile:', err);
      return null;
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (err) {
      console.error('Error saving profile:', err);
      throw err;
    }
  }

  async clearProfile(): Promise<void> {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch (err) {
      console.error('Error clearing profile:', err);
      throw err;
    }
  }
}

export const profileStorage = new ProfileStorage();
