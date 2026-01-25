// Legacy type - kept for backward compatibility during migration
export type ClothingType =
  | 'T-shirt'
  | 'Shirt'
  | 'Jacket'
  | 'Coat'
  | 'Sweater'
  | 'Hoodie'
  | 'Pants'
  | 'Jeans'
  | 'Shorts'
  | 'Skirt'
  | 'Dress'
  | 'Shoes'
  | 'Sneakers'
  | 'Boots'
  | 'Sandals'
  | 'Hat'
  | 'Socks'
  | 'Underwear'
  | 'Accessories'
  | 'Other';

// New hierarchical structure
export type ClothingCategory = 'Tops' | 'Bottoms' | 'Footwear' | 'Outerwear' | 'Accessories';

// Clothing tags for additional metadata - Organized by category
export type ClothingTag =
  // Occasion-based
  | 'Work/Office'
  | 'Formal Event'
  | 'Party/Night Out'
  | 'Vacation'
  | 'Travel'
  | 'Home/Lounge'
  | 'Business Casual'
  | 'Family Event'
  | 'Date Night'
  // Activity-based
  | 'Sport/Active'
  | 'Gym/Training'
  | 'Yoga/Stretch'
  | 'Outdoor'
  | 'Swim/Beach'
  | 'Winter Sports'
  | 'Running'
  | 'Cycling'
  // Season/Weather
  | 'Summer'
  | 'Winter'
  | 'Spring/Fall'
  | 'Rainy Day'
  | 'Hot Weather'
  | 'Cold Weather'
  // Style/Vibe
  | 'Trendy'
  | 'Streetwear'
  | 'Minimalist'
  | 'Bold/Statement'
  | 'Classic'
  | 'Edgy'
  | 'Romantic'
  | 'Vintage'
  | 'Casual'
  // Comfort/Fit
  | 'Cozy/Comfort'
  | 'Stretchy'
  | 'Lightweight'
  | 'Warm'
  | 'Breathable'
  | 'Relaxed Fit';

// Types organized by category
export const CLOTHING_TYPES_BY_CATEGORY: Record<ClothingCategory, string[]> = {
  Tops: ['T-shirt', 'Shirt', 'Sweater', 'Hoodie', 'Tank Top', 'Polo', 'Blouse', 'Tunic', 'Crop Top', 'Long Sleeve'],
  Bottoms: ['Pants', 'Jeans', 'Shorts', 'Skirt', 'Leggings', 'Sweatpants', 'Chinos', 'Cargo Pants', 'Dress'],
  Footwear: ['Sneakers', 'Shoes', 'Boots', 'Sandals', 'Slippers', 'Loafers', 'Heels', 'Flats', 'Running Shoes'],
  Outerwear: ['Jacket', 'Coat', 'Blazer', 'Vest', 'Cardigan', 'Windbreaker', 'Parka', 'Bomber', 'Trench Coat'],
  Accessories: ['Hat', 'Socks', 'Underwear', 'Belt', 'Tie', 'Watch', 'Scarf', 'Gloves', 'Bag', 'Wallet', 'Jewelry'],
};

// Get all types as a flat array (for backward compatibility)
export const ALL_CLOTHING_TYPES: string[] = Object.values(CLOTHING_TYPES_BY_CATEGORY).flat();

// Get category for a given type
export function getCategoryForType(type: string): ClothingCategory {
  for (const [category, types] of Object.entries(CLOTHING_TYPES_BY_CATEGORY)) {
    if (types.includes(type)) {
      return category as ClothingCategory;
    }
  }
  return 'Accessories'; // Default fallback
}

// Clothing sizes (for tops, bottoms, etc.)
export type RegularSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'One Size';

// Shoe sizes (European)
export type ShoeSize =
  | '35' | '35.5' | '36' | '36.5' | '37' | '37.5' | '38' | '38.5' | '39' | '39.5'
  | '40' | '40.5' | '41' | '41.5' | '42' | '42.5' | '43' | '43.5' | '44' | '44.5'
  | '45' | '45.5' | '46' | '46.5' | '47' | '47.5' | '48' | '48.5' | '49' | '50';

export type ClothingSize = RegularSize | ShoeSize;

export type ClothingColor =
  | 'Black'
  | 'White'
  | 'Gray'
  | 'Navy'
  | 'Blue'
  | 'Red'
  | 'Green'
  | 'Yellow'
  | 'Orange'
  | 'Pink'
  | 'Purple'
  | 'Brown'
  | 'Beige'
  | 'Multicolor'
  | 'Other';

// Clothing patterns
export type ClothingPattern =
  | 'Solid'
  | 'Stripes'
  | 'Checks'
  | 'Plaid'
  | 'Polka Dots'
  | 'Floral'
  | 'Abstract'
  | 'Geometric'
  | 'Corduroy'
  | 'Other';

// Formality level: 1 = Very Informal, 5 = Very Formal
export type FormalityLevel = 1 | 2 | 3 | 4 | 5;

export interface ClothingItem {
  id: string;
  
  // New hierarchical structure
  category?: ClothingCategory; // Optional for backward compatibility
  type: string; // Changed from ClothingType to string to support new structure
  
  // Legacy field (kept for migration)
  legacyType?: ClothingType; // Optional - kept for migration reference
  
  // Tags for additional metadata
  tags?: ClothingTag[]; // Array of tags
  
  brand: string;
  size: ClothingSize;
  color: ClothingColor; // Primary/dominant color (required for backward compatibility)
  colors?: ClothingColor[]; // Additional colors for multicolor items (optional)
  pattern?: ClothingPattern; // Pattern type (defaults to 'Solid' if not specified)
  cost: number;
  formalityLevel?: FormalityLevel; // User-defined formality level (1-5), optional for backward compatibility
  imageId: string; // Reference to image stored in IndexedDB
  dateAdded: string; // ISO date string
  notes?: string; // Optional field for additional notes
  wardrobeId?: string; // Optional for backward compatibility - ID of the wardrobe this item belongs to
  
  // Migration flag
  migrated?: boolean; // Flag to track if item was migrated
}

export interface ClothingItemInput {
  category: ClothingCategory;
  type: string; // Type within the category
  tags?: ClothingTag[]; // Optional tags
  brand: string;
  size: ClothingSize;
  color: ClothingColor; // Primary/dominant color (required)
  colors?: ClothingColor[]; // Additional colors for multicolor items (optional)
  pattern?: ClothingPattern; // Pattern type (optional, defaults to 'Solid')
  cost: number;
  formalityLevel: FormalityLevel; // User-defined formality level (1-5)
  imageBlob: Blob; // Image file to be stored
  notes?: string;
}

// Helper constants
export const FOOTWEAR_TYPES: string[] = CLOTHING_TYPES_BY_CATEGORY.Footwear;

// Helper function to check if type is footwear
export function isFootwearType(type: string): boolean {
  return CLOTHING_TYPES_BY_CATEGORY.Footwear.includes(type);
}

// Mapping EU shoe size to US size (approximate conversions)
export const EU_TO_US_SIZES: Record<string, string> = {
  '35': '4',
  '35.5': '4.5',
  '36': '5',
  '36.5': '5.5',
  '37': '6',
  '37.5': '6.5',
  '38': '7',
  '38.5': '7.5',
  '39': '8',
  '39.5': '8.5',
  '40': '9',
  '40.5': '9.5',
  '41': '10',
  '41.5': '10.5',
  '42': '11',
  '42.5': '11.5',
  '43': '12',
  '43.5': '12.5',
  '44': '13',
  '44.5': '13.5',
  '45': '14',
  '45.5': '14.5',
  '46': '15',
  '46.5': '15.5',
  '47': '16',
  '47.5': '16.5',
  '48': '17',
  '48.5': '17.5',
  '49': '18',
  '50': '18.5',
};

export const SHOE_SIZES: ShoeSize[] = [
  '35', '35.5', '36', '36.5', '37', '37.5', '38', '38.5', '39', '39.5',
  '40', '40.5', '41', '41.5', '42', '42.5', '43', '43.5', '44', '44.5',
  '45', '45.5', '46', '46.5', '47', '47.5', '48', '48.5', '49', '50',
];

export const REGULAR_SIZES: RegularSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];

// Legacy function - kept for backward compatibility
export function isFootwear(type: ClothingType | string): boolean {
  if (typeof type === 'string') {
    return isFootwearType(type);
  }
  return FOOTWEAR_TYPES.includes(type as string);
}

export function formatShoeSize(euSize: ShoeSize): string {
  const usSize = EU_TO_US_SIZES[euSize];
  return usSize ? `${euSize} (US ${usSize})` : euSize;
}
