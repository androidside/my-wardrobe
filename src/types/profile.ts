export type GeneralSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Other';

export type Gender = 'Male' | 'Female' | 'Other';

export interface UserProfile {
  // User Identification
  userId?: string; // Firebase Auth user ID
  
  // Personal Information
  username?: string; // Unique username for social features
  usernameLower?: string; // Lowercase version for case-insensitive search
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  gender?: Gender;
  city?: string;
  country?: string;
  profilePictureUrl?: string; // URL to profile picture stored in Firebase Storage
  
  // Privacy Settings
  privacySettings?: {
    allowDirectFollow: boolean; // If true, users can follow directly; if false, requires approval
  };
  
  // Size Information
  shoeSize?: string; // EU shoe size string from SHOE_SIZES
  pantsSizeUs?: string; // numeric or string (US sizing)
  heightCm?: number;
  weightKg?: number;
  headSize?: GeneralSize; // Changed from headSizeCm (number) to headSize (GeneralSize)
  generalSize?: GeneralSize;
  notes?: string;
}
