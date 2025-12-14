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
  | 'Accessories'
  | 'Other';

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

export interface ClothingItem {
  id: string;
  type: ClothingType;
  brand: string;
  size: ClothingSize;
  color: ClothingColor;
  cost: number;
  imageId: string; // Reference to image stored in IndexedDB
  dateAdded: string; // ISO date string
  notes?: string; // Optional field for additional notes
}

export interface ClothingItemInput {
  type: ClothingType;
  brand: string;
  size: ClothingSize;
  color: ClothingColor;
  cost: number;
  imageBlob: Blob; // Image file to be stored
  notes?: string;
}

// Helper constants
export const FOOTWEAR_TYPES: ClothingType[] = ['Shoes', 'Sneakers', 'Boots', 'Sandals'];

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
export function isFootwear(type: ClothingType): boolean {
  return FOOTWEAR_TYPES.includes(type);
}

export function formatShoeSize(euSize: ShoeSize): string {
  const usSize = EU_TO_US_SIZES[euSize];
  return usSize ? `${euSize} (US ${usSize})` : euSize;
}
