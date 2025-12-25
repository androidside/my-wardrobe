export type GeneralSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Other';

export interface UserProfile {
  // Personal Information
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  city?: string;
  country?: string;
  
  // Size Information
  shoeSize?: string; // EU shoe size string from SHOE_SIZES
  pantsSizeUs?: string; // numeric or string (US sizing)
  heightCm?: number;
  weightKg?: number;
  headSizeCm?: number;
  generalSize?: GeneralSize;
  notes?: string;
}
