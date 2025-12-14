export type GeneralSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Other';

export interface UserProfile {
  fullName?: string;
  shoeSize?: string; // EU shoe size string from SHOE_SIZES
  pantsSizeUs?: string; // numeric or string (US sizing)
  heightCm?: number;
  generalSize?: GeneralSize;
  notes?: string;
}
