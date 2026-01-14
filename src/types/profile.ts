export type GeneralSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Other';

export type Gender = 'Male' | 'Female' | 'Other';

export interface UserProfile {
  // Personal Information
  username?: string; // Unique username for social features
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  gender?: Gender;
  city?: string;
  country?: string;
  profilePictureUrl?: string; // URL to profile picture stored in Firebase Storage
  
  // Size Information
  shoeSize?: string; // EU shoe size string from SHOE_SIZES
  pantsSizeUs?: string; // numeric or string (US sizing)
  heightCm?: number;
  weightKg?: number;
  headSize?: GeneralSize; // Changed from headSizeCm (number) to headSize (GeneralSize)
  generalSize?: GeneralSize;
  notes?: string;
}
