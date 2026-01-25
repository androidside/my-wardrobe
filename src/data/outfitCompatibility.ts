// Enhanced compatibility matrices for outfit combinations
// Generated with AI assistance and fashion expertise

import { ClothingColor, ClothingPattern, CLOTHING_TYPES_BY_CATEGORY } from '../types/clothing';

export interface CompatibilityMatrix {
  colorCompatibility: Record<ClothingColor, Record<ClothingColor, number>>;
  patternCompatibility: Record<ClothingPattern, Record<ClothingPattern, number>>; // NEW!
  typeCompatibility: Record<string, Record<string, number>>;
  styleRules: {
    formalityLevels?: Record<string, 'formal' | 'casual' | 'sporty' | 'versatile'>; // Deprecated - using user-defined formality levels
    typeCategories: {
      tops: string[];
      bottoms: string[];
      outerwear: string[];
      footwear: string[];
      accessories: string[];
    };
    compatibilityRules: Array<{
      rule: string;
      description: string;
      score: number;
    }>;
  };
}

// Enhanced color compatibility matrix (0-10 scale)
// Improved with better neutral pairing and complementary color theory
const colorCompatibility: Record<ClothingColor, Record<ClothingColor, number>> = {
  Black: { Black: 4, White: 10, Gray: 9, Navy: 7, Blue: 7, Red: 8, Green: 7, Yellow: 8, Orange: 7, Pink: 7, Purple: 7, Brown: 7, Beige: 8, Multicolor: 8, Other: 7 },
  White: { Black: 10, White: 4, Gray: 9, Navy: 9, Blue: 8, Red: 8, Green: 8, Yellow: 8, Orange: 7, Pink: 8, Purple: 8, Brown: 7, Beige: 8, Multicolor: 8, Other: 7 },
  Gray: { Black: 9, White: 9, Gray: 4, Navy: 8, Blue: 8, Red: 7, Green: 7, Yellow: 7, Orange: 6, Pink: 7, Purple: 7, Brown: 7, Beige: 8, Multicolor: 7, Other: 7 },
  Navy: { Black: 7, White: 9, Gray: 8, Navy: 4, Blue: 7, Red: 7, Green: 7, Yellow: 7, Orange: 8, Pink: 6, Purple: 7, Brown: 8, Beige: 9, Multicolor: 7, Other: 7 },
  Blue: { Black: 7, White: 8, Gray: 8, Navy: 7, Blue: 4, Red: 6, Green: 7, Yellow: 7, Orange: 8, Pink: 6, Purple: 7, Brown: 7, Beige: 8, Multicolor: 7, Other: 7 },
  Red: { Black: 8, White: 8, Gray: 7, Navy: 7, Blue: 6, Red: 4, Green: 8, Yellow: 7, Orange: 6, Pink: 4, Purple: 6, Brown: 6, Beige: 7, Multicolor: 6, Other: 6 },
  Green: { Black: 7, White: 8, Gray: 7, Navy: 7, Blue: 7, Red: 8, Green: 4, Yellow: 7, Orange: 5, Pink: 5, Purple: 5, Brown: 8, Beige: 8, Multicolor: 6, Other: 6 },
  Yellow: { Black: 8, White: 8, Gray: 7, Navy: 7, Blue: 7, Red: 7, Green: 7, Yellow: 4, Orange: 7, Pink: 5, Purple: 8, Brown: 6, Beige: 7, Multicolor: 6, Other: 6 },
  Orange: { Black: 7, White: 7, Gray: 6, Navy: 8, Blue: 8, Red: 6, Green: 5, Yellow: 7, Orange: 4, Pink: 4, Purple: 3, Brown: 7, Beige: 7, Multicolor: 6, Other: 6 },
  Pink: { Black: 7, White: 8, Gray: 7, Navy: 6, Blue: 6, Red: 4, Green: 5, Yellow: 5, Orange: 4, Pink: 4, Purple: 7, Brown: 5, Beige: 7, Multicolor: 6, Other: 6 },
  Purple: { Black: 7, White: 8, Gray: 7, Navy: 7, Blue: 7, Red: 6, Green: 5, Yellow: 8, Orange: 3, Pink: 7, Purple: 4, Brown: 5, Beige: 7, Multicolor: 6, Other: 6 },
  Brown: { Black: 7, White: 7, Gray: 7, Navy: 8, Blue: 7, Red: 6, Green: 8, Yellow: 6, Orange: 7, Pink: 5, Purple: 5, Brown: 4, Beige: 9, Multicolor: 6, Other: 6 },
  Beige: { Black: 8, White: 8, Gray: 8, Navy: 9, Blue: 8, Red: 7, Green: 8, Yellow: 7, Orange: 7, Pink: 7, Purple: 7, Brown: 9, Beige: 4, Multicolor: 7, Other: 7 },
  Multicolor: { Black: 8, White: 8, Gray: 7, Navy: 7, Blue: 7, Red: 6, Green: 6, Yellow: 6, Orange: 6, Pink: 6, Purple: 6, Brown: 6, Beige: 7, Multicolor: 5, Other: 6 },
  Other: { Black: 7, White: 7, Gray: 7, Navy: 7, Blue: 7, Red: 6, Green: 6, Yellow: 6, Orange: 6, Pink: 6, Purple: 6, Brown: 6, Beige: 7, Multicolor: 6, Other: 5 },
};

// NEW: Pattern compatibility matrix (0-10 scale)
// Patterns can make or break an outfit - this matrix captures professional styling rules
const patternCompatibility: Record<ClothingPattern, Record<ClothingPattern, number>> = {
  Solid: { Solid: 7, Stripes: 9, Checks: 8, Plaid: 8, 'Polka Dots': 8, Floral: 8, Abstract: 7, Geometric: 8, Corduroy: 7, Other: 7 },
  Stripes: { Solid: 9, Stripes: 4, Checks: 6, Plaid: 5, 'Polka Dots': 5, Floral: 3, Abstract: 3, Geometric: 6, Corduroy: 6, Other: 5 },
  Checks: { Solid: 8, Stripes: 6, Checks: 4, Plaid: 6, 'Polka Dots': 5, Floral: 3, Abstract: 3, Geometric: 5, Corduroy: 6, Other: 5 },
  Plaid: { Solid: 8, Stripes: 5, Checks: 6, Plaid: 4, 'Polka Dots': 4, Floral: 2, Abstract: 2, Geometric: 4, Corduroy: 6, Other: 5 },
  'Polka Dots': { Solid: 8, Stripes: 5, Checks: 5, Plaid: 4, 'Polka Dots': 4, Floral: 3, Abstract: 3, Geometric: 4, Corduroy: 6, Other: 5 },
  Floral: { Solid: 8, Stripes: 3, Checks: 3, Plaid: 2, 'Polka Dots': 3, Floral: 3, Abstract: 3, Geometric: 2, Corduroy: 5, Other: 4 },
  Abstract: { Solid: 7, Stripes: 3, Checks: 3, Plaid: 2, 'Polka Dots': 3, Floral: 3, Abstract: 3, Geometric: 3, Corduroy: 5, Other: 4 },
  Geometric: { Solid: 8, Stripes: 6, Checks: 5, Plaid: 4, 'Polka Dots': 4, Floral: 2, Abstract: 3, Geometric: 4, Corduroy: 5, Other: 5 },
  Corduroy: { Solid: 7, Stripes: 6, Checks: 6, Plaid: 6, 'Polka Dots': 6, Floral: 5, Abstract: 5, Geometric: 5, Corduroy: 6, Other: 6 },
  Other: { Solid: 7, Stripes: 5, Checks: 5, Plaid: 5, 'Polka Dots': 5, Floral: 4, Abstract: 4, Geometric: 5, Corduroy: 6, Other: 5 },
};

// Enhanced type compatibility matrix (0-10 scale) - ALL 47 TYPES
// Comprehensive matrix covering all clothing types with modern styling rules
const typeCompatibility: Record<string, Record<string, number>> = {
  "T-shirt":{"T-shirt":2,"Shirt":6,"Sweater":8,"Hoodie":8,"Tank Top":5,"Polo":6,"Blouse":4,"Tunic":5,"Crop Top":3,"Long Sleeve":7,"Pants":7,"Jeans":8,"Shorts":7,"Skirt":5,"Leggings":6,"Sweatpants":8,"Chinos":7,"Cargo Pants":7,"Dress":2,"Sneakers":8,"Boots":6,"Sandals":7,"Slippers":6,"Loafers":4,"Heels":2,"Flats":3,"Running Shoes":6,"Jacket":8,"Coat":6,"Blazer":4,"Vest":6,"Cardigan":7,"Windbreaker":7,"Parka":5,"Bomber":7,"Trench Coat":3,"Hat":8,"Socks":9,"Underwear":10,"Belt":8,"Tie":2,"Watch":8,"Scarf":7,"Gloves":7,"Bag":8,"Wallet":8,"Jewelry":7},
  "Shirt":{"T-shirt":6,"Shirt":2,"Sweater":8,"Hoodie":4,"Tank Top":4,"Polo":6,"Blouse":6,"Tunic":6,"Crop Top":3,"Long Sleeve":7,"Pants":10,"Jeans":7,"Shorts":6,"Skirt":6,"Leggings":4,"Sweatpants":3,"Chinos":10,"Cargo Pants":5,"Dress":2,"Sneakers":6,"Boots":7,"Sandals":4,"Slippers":2,"Loafers":9,"Heels":5,"Flats":6,"Running Shoes":2,"Jacket":7,"Coat":7,"Blazer":9,"Vest":7,"Cardigan":7,"Windbreaker":5,"Parka":5,"Bomber":5,"Trench Coat":8,"Hat":6,"Socks":9,"Underwear":10,"Belt":9,"Tie":8,"Watch":8,"Scarf":7,"Gloves":7,"Bag":8,"Wallet":8,"Jewelry":8},
  "Sweater":{"T-shirt":8,"Shirt":8,"Sweater":2,"Hoodie":4,"Tank Top":5,"Polo":7,"Blouse":6,"Tunic":7,"Crop Top":4,"Long Sleeve":6,"Pants":8,"Jeans":7,"Shorts":4,"Skirt":6,"Leggings":7,"Sweatpants":6,"Chinos":8,"Cargo Pants":6,"Dress":6,"Sneakers":6,"Boots":8,"Sandals":2,"Slippers":6,"Loafers":6,"Heels":5,"Flats":6,"Running Shoes":3,"Jacket":6,"Coat":7,"Blazer":6,"Vest":7,"Cardigan":5,"Windbreaker":4,"Parka":7,"Bomber":5,"Trench Coat":6,"Hat":7,"Socks":9,"Underwear":10,"Belt":8,"Tie":5,"Watch":8,"Scarf":9,"Gloves":9,"Bag":8,"Wallet":8,"Jewelry":7},
  "Hoodie":{"T-shirt":8,"Shirt":4,"Sweater":4,"Hoodie":2,"Tank Top":5,"Polo":4,"Blouse":2,"Tunic":3,"Crop Top":5,"Long Sleeve":7,"Pants":6,"Jeans":8,"Shorts":7,"Skirt":2,"Leggings":7,"Sweatpants":9,"Chinos":4,"Cargo Pants":7,"Dress":1,"Sneakers":9,"Boots":5,"Sandals":3,"Slippers":8,"Loafers":2,"Heels":1,"Flats":2,"Running Shoes":8,"Jacket":6,"Coat":3,"Blazer":2,"Vest":4,"Cardigan":4,"Windbreaker":8,"Parka":6,"Bomber":8,"Trench Coat":1,"Hat":8,"Socks":9,"Underwear":10,"Belt":7,"Tie":1,"Watch":7,"Scarf":6,"Gloves":6,"Bag":8,"Wallet":8,"Jewelry":5},
  "Tank Top":{"T-shirt":5,"Shirt":4,"Sweater":5,"Hoodie":5,"Tank Top":2,"Polo":4,"Blouse":4,"Tunic":5,"Crop Top":6,"Long Sleeve":4,"Pants":5,"Jeans":7,"Shorts":7,"Skirt":6,"Leggings":6,"Sweatpants":5,"Chinos":5,"Cargo Pants":6,"Dress":2,"Sneakers":7,"Boots":3,"Sandals":8,"Slippers":7,"Loafers":3,"Heels":2,"Flats":3,"Running Shoes":6,"Jacket":6,"Coat":2,"Blazer":3,"Vest":6,"Cardigan":6,"Windbreaker":6,"Parka":3,"Bomber":5,"Trench Coat":1,"Hat":8,"Socks":8,"Underwear":10,"Belt":7,"Tie":1,"Watch":7,"Scarf":5,"Gloves":4,"Bag":7,"Wallet":8,"Jewelry":7},
  "Polo":{"T-shirt":6,"Shirt":6,"Sweater":7,"Hoodie":4,"Tank Top":4,"Polo":2,"Blouse":5,"Tunic":5,"Crop Top":3,"Long Sleeve":6,"Pants":8,"Jeans":7,"Shorts":7,"Skirt":5,"Leggings":3,"Sweatpants":2,"Chinos":9,"Cargo Pants":5,"Dress":2,"Sneakers":5,"Boots":6,"Sandals":4,"Slippers":2,"Loafers":8,"Heels":3,"Flats":5,"Running Shoes":2,"Jacket":6,"Coat":6,"Blazer":8,"Vest":7,"Cardigan":6,"Windbreaker":5,"Parka":5,"Bomber":5,"Trench Coat":7,"Hat":6,"Socks":9,"Underwear":10,"Belt":9,"Tie":7,"Watch":8,"Scarf":7,"Gloves":7,"Bag":8,"Wallet":8,"Jewelry":7},
  "Blouse":{"T-shirt":4,"Shirt":6,"Sweater":6,"Hoodie":2,"Tank Top":4,"Polo":5,"Blouse":2,"Tunic":7,"Crop Top":5,"Long Sleeve":7,"Pants":8,"Jeans":6,"Shorts":5,"Skirt":8,"Leggings":4,"Sweatpants":2,"Chinos":8,"Cargo Pants":2,"Dress":6,"Sneakers":4,"Boots":6,"Sandals":5,"Slippers":2,"Loafers":7,"Heels":9,"Flats":8,"Running Shoes":2,"Jacket":6,"Coat":7,"Blazer":9,"Vest":6,"Cardigan":7,"Windbreaker":3,"Parka":4,"Bomber":3,"Trench Coat":8,"Hat":6,"Socks":8,"Underwear":10,"Belt":8,"Tie":4,"Watch":8,"Scarf":8,"Gloves":7,"Bag":9,"Wallet":8,"Jewelry":9},
  "Tunic":{"T-shirt":5,"Shirt":6,"Sweater":7,"Hoodie":3,"Tank Top":5,"Polo":5,"Blouse":7,"Tunic":2,"Crop Top":2,"Long Sleeve":8,"Pants":7,"Jeans":6,"Shorts":5,"Skirt":6,"Leggings":9,"Sweatpants":4,"Chinos":7,"Cargo Pants":3,"Dress":7,"Sneakers":5,"Boots":6,"Sandals":5,"Slippers":4,"Loafers":6,"Heels":7,"Flats":8,"Running Shoes":3,"Jacket":6,"Coat":7,"Blazer":6,"Vest":6,"Cardigan":8,"Windbreaker":4,"Parka":5,"Bomber":4,"Trench Coat":7,"Hat":6,"Socks":8,"Underwear":10,"Belt":8,"Tie":2,"Watch":8,"Scarf":8,"Gloves":7,"Bag":8,"Wallet":8,"Jewelry":8},
  "Crop Top":{"T-shirt":3,"Shirt":3,"Sweater":4,"Hoodie":5,"Tank Top":6,"Polo":3,"Blouse":5,"Tunic":2,"Crop Top":2,"Long Sleeve":5,"Pants":6,"Jeans":8,"Shorts":8,"Skirt":8,"Leggings":9,"Sweatpants":6,"Chinos":5,"Cargo Pants":6,"Dress":3,"Sneakers":7,"Boots":5,"Sandals":8,"Slippers":6,"Loafers":3,"Heels":7,"Flats":6,"Running Shoes":6,"Jacket":6,"Coat":3,"Blazer":4,"Vest":6,"Cardigan":6,"Windbreaker":6,"Parka":4,"Bomber":6,"Trench Coat":2,"Hat":8,"Socks":7,"Underwear":10,"Belt":7,"Tie":1,"Watch":7,"Scarf":6,"Gloves":6,"Bag":7,"Wallet":8,"Jewelry":8},
  "Long Sleeve":{"T-shirt":7,"Shirt":7,"Sweater":6,"Hoodie":7,"Tank Top":4,"Polo":6,"Blouse":7,"Tunic":8,"Crop Top":5,"Long Sleeve":2,"Pants":7,"Jeans":7,"Shorts":4,"Skirt":6,"Leggings":7,"Sweatpants":5,"Chinos":7,"Cargo Pants":6,"Dress":5,"Sneakers":5,"Boots":7,"Sandals":2,"Slippers":3,"Loafers":6,"Heels":5,"Flats":6,"Running Shoes":3,"Jacket":7,"Coat":7,"Blazer":7,"Vest":7,"Cardigan":8,"Windbreaker":6,"Parka":7,"Bomber":6,"Trench Coat":6,"Hat":7,"Socks":9,"Underwear":10,"Belt":8,"Tie":7,"Watch":8,"Scarf":8,"Gloves":8,"Bag":8,"Wallet":8,"Jewelry":7},
  "Pants":{"T-shirt":7,"Shirt":10,"Sweater":8,"Hoodie":6,"Tank Top":5,"Polo":8,"Blouse":8,"Tunic":7,"Crop Top":6,"Long Sleeve":7,"Pants":2,"Jeans":3,"Shorts":2,"Skirt":2,"Leggings":2,"Sweatpants":3,"Chinos":7,"Cargo Pants":5,"Dress":2,"Sneakers":6,"Boots":7,"Sandals":3,"Slippers":2,"Loafers":8,"Heels":6,"Flats":7,"Running Shoes":2,"Jacket":7,"Coat":7,"Blazer":9,"Vest":6,"Cardigan":7,"Windbreaker":5,"Parka":6,"Bomber":5,"Trench Coat":8,"Hat":6,"Socks":9,"Underwear":10,"Belt":10,"Tie":7,"Watch":8,"Scarf":7,"Gloves":7,"Bag":8,"Wallet":8,"Jewelry":7},
  "Jeans":{"T-shirt":8,"Shirt":7,"Sweater":7,"Hoodie":8,"Tank Top":7,"Polo":7,"Blouse":6,"Tunic":6,"Crop Top":8,"Long Sleeve":7,"Pants":3,"Jeans":2,"Shorts":2,"Skirt":2,"Leggings":2,"Sweatpants":3,"Chinos":3,"Cargo Pants":5,"Dress":2,"Sneakers":8,"Boots":7,"Sandals":4,"Slippers":4,"Loafers":5,"Heels":4,"Flats":4,"Running Shoes":4,"Jacket":8,"Coat":5,"Blazer":6,"Vest":5,"Cardigan":6,"Windbreaker":6,"Parka":5,"Bomber":7,"Trench Coat":4,"Hat":7,"Socks":9,"Underwear":10,"Belt":9,"Tie":3,"Watch":8,"Scarf":6,"Gloves":6,"Bag":8,"Wallet":8,"Jewelry":6},
  "Shorts":{"T-shirt":7,"Shirt":6,"Sweater":4,"Hoodie":7,"Tank Top":7,"Polo":7,"Blouse":5,"Tunic":5,"Crop Top":8,"Long Sleeve":4,"Pants":2,"Jeans":2,"Shorts":2,"Skirt":2,"Leggings":2,"Sweatpants":2,"Chinos":2,"Cargo Pants":5,"Dress":2,"Sneakers":7,"Boots":2,"Sandals":8,"Slippers":7,"Loafers":3,"Heels":3,"Flats":5,"Running Shoes":6,"Jacket":4,"Coat":1,"Blazer":3,"Vest":6,"Cardigan":3,"Windbreaker":5,"Parka":1,"Bomber":4,"Trench Coat":1,"Hat":8,"Socks":6,"Underwear":10,"Belt":7,"Tie":1,"Watch":7,"Scarf":4,"Gloves":3,"Bag":7,"Wallet":8,"Jewelry":6},
  "Skirt":{"T-shirt":5,"Shirt":6,"Sweater":6,"Hoodie":2,"Tank Top":6,"Polo":5,"Blouse":8,"Tunic":6,"Crop Top":8,"Long Sleeve":6,"Pants":2,"Jeans":2,"Shorts":2,"Skirt":2,"Leggings":3,"Sweatpants":2,"Chinos":2,"Cargo Pants":2,"Dress":6,"Sneakers":4,"Boots":7,"Sandals":6,"Slippers":3,"Loafers":6,"Heels":10,"Flats":9,"Running Shoes":2,"Jacket":6,"Coat":6,"Blazer":7,"Vest":5,"Cardigan":6,"Windbreaker":3,"Parka":4,"Bomber":3,"Trench Coat":7,"Hat":6,"Socks":6,"Underwear":10,"Belt":8,"Tie":2,"Watch":7,"Scarf":7,"Gloves":7,"Bag":9,"Wallet":8,"Jewelry":9},
  "Leggings":{"T-shirt":6,"Shirt":4,"Sweater":7,"Hoodie":7,"Tank Top":6,"Polo":3,"Blouse":4,"Tunic":9,"Crop Top":9,"Long Sleeve":7,"Pants":2,"Jeans":2,"Shorts":2,"Skirt":3,"Leggings":2,"Sweatpants":3,"Chinos":2,"Cargo Pants":2,"Dress":4,"Sneakers":7,"Boots":6,"Sandals":4,"Slippers":5,"Loafers":3,"Heels":3,"Flats":4,"Running Shoes":7,"Jacket":5,"Coat":4,"Blazer":3,"Vest":5,"Cardigan":6,"Windbreaker":7,"Parka":5,"Bomber":6,"Trench Coat":3,"Hat":7,"Socks":8,"Underwear":10,"Belt":5,"Tie":1,"Watch":7,"Scarf":6,"Gloves":6,"Bag":7,"Wallet":8,"Jewelry":5},
  "Sweatpants":{"T-shirt":8,"Shirt":3,"Sweater":6,"Hoodie":9,"Tank Top":5,"Polo":2,"Blouse":2,"Tunic":4,"Crop Top":6,"Long Sleeve":5,"Pants":3,"Jeans":3,"Shorts":2,"Skirt":2,"Leggings":3,"Sweatpants":2,"Chinos":2,"Cargo Pants":3,"Dress":1,"Sneakers":9,"Boots":2,"Sandals":3,"Slippers":9,"Loafers":1,"Heels":1,"Flats":1,"Running Shoes":9,"Jacket":5,"Coat":1,"Blazer":1,"Vest":3,"Cardigan":4,"Windbreaker":8,"Parka":4,"Bomber":5,"Trench Coat":1,"Hat":8,"Socks":9,"Underwear":10,"Belt":5,"Tie":1,"Watch":6,"Scarf":5,"Gloves":5,"Bag":7,"Wallet":8,"Jewelry":3},
  "Chinos":{"T-shirt":7,"Shirt":10,"Sweater":8,"Hoodie":4,"Tank Top":5,"Polo":9,"Blouse":8,"Tunic":7,"Crop Top":5,"Long Sleeve":7,"Pants":7,"Jeans":3,"Shorts":2,"Skirt":2,"Leggings":2,"Sweatpants":2,"Chinos":2,"Cargo Pants":4,"Dress":2,"Sneakers":5,"Boots":7,"Sandals":3,"Slippers":2,"Loafers":9,"Heels":5,"Flats":6,"Running Shoes":2,"Jacket":7,"Coat":7,"Blazer":9,"Vest":6,"Cardigan":7,"Windbreaker":5,"Parka":6,"Bomber":5,"Trench Coat":8,"Hat":6,"Socks":9,"Underwear":10,"Belt":10,"Tie":8,"Watch":8,"Scarf":7,"Gloves":7,"Bag":8,"Wallet":8,"Jewelry":7},
  "Cargo Pants":{"T-shirt":7,"Shirt":5,"Sweater":6,"Hoodie":7,"Tank Top":6,"Polo":5,"Blouse":2,"Tunic":3,"Crop Top":6,"Long Sleeve":6,"Pants":5,"Jeans":5,"Shorts":5,"Skirt":2,"Leggings":2,"Sweatpants":3,"Chinos":4,"Cargo Pants":2,"Dress":1,"Sneakers":7,"Boots":6,"Sandals":4,"Slippers":4,"Loafers":3,"Heels":1,"Flats":2,"Running Shoes":4,"Jacket":7,"Coat":3,"Blazer":3,"Vest":6,"Cardigan":4,"Windbreaker":8,"Parka":5,"Bomber":7,"Trench Coat":2,"Hat":7,"Socks":8,"Underwear":10,"Belt":9,"Tie":1,"Watch":7,"Scarf":6,"Gloves":7,"Bag":7,"Wallet":8,"Jewelry":4},
  "Dress":{"T-shirt":2,"Shirt":2,"Sweater":6,"Hoodie":1,"Tank Top":2,"Polo":2,"Blouse":6,"Tunic":7,"Crop Top":3,"Long Sleeve":5,"Pants":2,"Jeans":2,"Shorts":2,"Skirt":6,"Leggings":4,"Sweatpants":1,"Chinos":2,"Cargo Pants":1,"Dress":2,"Sneakers":4,"Boots":7,"Sandals":8,"Slippers":2,"Loafers":6,"Heels":10,"Flats":9,"Running Shoes":1,"Jacket":7,"Coat":7,"Blazer":7,"Vest":5,"Cardigan":8,"Windbreaker":3,"Parka":4,"Bomber":4,"Trench Coat":8,"Hat":6,"Socks":3,"Underwear":10,"Belt":8,"Tie":1,"Watch":8,"Scarf":8,"Gloves":8,"Bag":9,"Wallet":8,"Jewelry":10},
  "Sneakers":{"T-shirt":8,"Shirt":6,"Sweater":6,"Hoodie":9,"Tank Top":7,"Polo":5,"Blouse":4,"Tunic":5,"Crop Top":7,"Long Sleeve":5,"Pants":6,"Jeans":8,"Shorts":7,"Skirt":4,"Leggings":7,"Sweatpants":9,"Chinos":5,"Cargo Pants":7,"Dress":4,"Sneakers":2,"Boots":2,"Sandals":2,"Slippers":2,"Loafers":2,"Heels":1,"Flats":1,"Running Shoes":5,"Jacket":7,"Coat":3,"Blazer":4,"Vest":6,"Cardigan":6,"Windbreaker":8,"Parka":5,"Bomber":7,"Trench Coat":2,"Hat":7,"Socks":9,"Underwear":10,"Belt":8,"Tie":2,"Watch":7,"Scarf":6,"Gloves":6,"Bag":7,"Wallet":8,"Jewelry":5},
  "Boots":{"T-shirt":6,"Shirt":7,"Sweater":8,"Hoodie":5,"Tank Top":3,"Polo":6,"Blouse":6,"Tunic":6,"Crop Top":5,"Long Sleeve":7,"Pants":7,"Jeans":7,"Shorts":2,"Skirt":7,"Leggings":6,"Sweatpants":2,"Chinos":7,"Cargo Pants":6,"Dress":7,"Sneakers":2,"Boots":2,"Sandals":1,"Slippers":1,"Loafers":5,"Heels":5,"Flats":6,"Running Shoes":1,"Jacket":7,"Coat":8,"Blazer":7,"Vest":6,"Cardigan":7,"Windbreaker":6,"Parka":8,"Bomber":7,"Trench Coat":8,"Hat":6,"Socks":9,"Underwear":10,"Belt":8,"Tie":6,"Watch":8,"Scarf":8,"Gloves":8,"Bag":8,"Wallet":8,"Jewelry":7},
  "Sandals":{"T-shirt":7,"Shirt":4,"Sweater":2,"Hoodie":3,"Tank Top":8,"Polo":4,"Blouse":5,"Tunic":5,"Crop Top":8,"Long Sleeve":2,"Pants":3,"Jeans":4,"Shorts":8,"Skirt":6,"Leggings":4,"Sweatpants":3,"Chinos":3,"Cargo Pants":4,"Dress":8,"Sneakers":2,"Boots":1,"Sandals":2,"Slippers":6,"Loafers":3,"Heels":3,"Flats":4,"Running Shoes":1,"Jacket":2,"Coat":1,"Blazer":3,"Vest":6,"Cardigan":2,"Windbreaker":3,"Parka":1,"Bomber":2,"Trench Coat":1,"Hat":8,"Socks":2,"Underwear":10,"Belt":7,"Tie":1,"Watch":7,"Scarf":4,"Gloves":3,"Bag":7,"Wallet":8,"Jewelry":7},
  "Slippers":{"T-shirt":6,"Shirt":2,"Sweater":6,"Hoodie":8,"Tank Top":7,"Polo":2,"Blouse":2,"Tunic":4,"Crop Top":6,"Long Sleeve":3,"Pants":2,"Jeans":4,"Shorts":7,"Skirt":3,"Leggings":5,"Sweatpants":9,"Chinos":2,"Cargo Pants":4,"Dress":2,"Sneakers":2,"Boots":1,"Sandals":6,"Slippers":2,"Loafers":1,"Heels":1,"Flats":1,"Running Shoes":1,"Jacket":1,"Coat":1,"Blazer":1,"Vest":2,"Cardigan":5,"Windbreaker":1,"Parka":1,"Bomber":1,"Trench Coat":1,"Hat":4,"Socks":8,"Underwear":10,"Belt":6,"Tie":1,"Watch":6,"Scarf":5,"Gloves":5,"Bag":6,"Wallet":7,"Jewelry":4},
  "Loafers":{"T-shirt":4,"Shirt":9,"Sweater":6,"Hoodie":2,"Tank Top":3,"Polo":8,"Blouse":7,"Tunic":6,"Crop Top":3,"Long Sleeve":6,"Pants":8,"Jeans":5,"Shorts":3,"Skirt":6,"Leggings":3,"Sweatpants":1,"Chinos":9,"Cargo Pants":3,"Dress":6,"Sneakers":2,"Boots":5,"Sandals":3,"Slippers":1,"Loafers":2,"Heels":4,"Flats":6,"Running Shoes":1,"Jacket":5,"Coat":7,"Blazer":9,"Vest":6,"Cardigan":6,"Windbreaker":3,"Parka":4,"Bomber":3,"Trench Coat":8,"Hat":5,"Socks":9,"Underwear":10,"Belt":10,"Tie":8,"Watch":8,"Scarf":7,"Gloves":7,"Bag":8,"Wallet":8,"Jewelry":7},
  "Heels":{"T-shirt":2,"Shirt":5,"Sweater":5,"Hoodie":1,"Tank Top":2,"Polo":3,"Blouse":9,"Tunic":7,"Crop Top":7,"Long Sleeve":5,"Pants":6,"Jeans":4,"Shorts":3,"Skirt":10,"Leggings":3,"Sweatpants":1,"Chinos":5,"Cargo Pants":1,"Dress":10,"Sneakers":1,"Boots":5,"Sandals":3,"Slippers":1,"Loafers":4,"Heels":2,"Flats":6,"Running Shoes":1,"Jacket":5,"Coat":7,"Blazer":8,"Vest":4,"Cardigan":6,"Windbreaker":1,"Parka":2,"Bomber":1,"Trench Coat":8,"Hat":5,"Socks":2,"Underwear":10,"Belt":8,"Tie":3,"Watch":8,"Scarf":7,"Gloves":8,"Bag":9,"Wallet":8,"Jewelry":10},
  "Flats":{"T-shirt":3,"Shirt":6,"Sweater":6,"Hoodie":2,"Tank Top":3,"Polo":5,"Blouse":8,"Tunic":8,"Crop Top":6,"Long Sleeve":6,"Pants":7,"Jeans":4,"Shorts":5,"Skirt":9,"Leggings":4,"Sweatpants":1,"Chinos":6,"Cargo Pants":2,"Dress":9,"Sneakers":1,"Boots":6,"Sandals":4,"Slippers":1,"Loafers":6,"Heels":6,"Flats":2,"Running Shoes":1,"Jacket":5,"Coat":6,"Blazer":7,"Vest":5,"Cardigan":7,"Windbreaker":2,"Parka":3,"Bomber":2,"Trench Coat":7,"Hat":5,"Socks":4,"Underwear":10,"Belt":8,"Tie":3,"Watch":8,"Scarf":7,"Gloves":7,"Bag":8,"Wallet":8,"Jewelry":9},
  "Running Shoes":{"T-shirt":6,"Shirt":2,"Sweater":3,"Hoodie":8,"Tank Top":6,"Polo":2,"Blouse":2,"Tunic":3,"Crop Top":6,"Long Sleeve":3,"Pants":2,"Jeans":4,"Shorts":6,"Skirt":2,"Leggings":7,"Sweatpants":9,"Chinos":2,"Cargo Pants":4,"Dress":1,"Sneakers":5,"Boots":1,"Sandals":1,"Slippers":1,"Loafers":1,"Heels":1,"Flats":1,"Running Shoes":2,"Jacket":3,"Coat":1,"Blazer":1,"Vest":3,"Cardigan":2,"Windbreaker":8,"Parka":2,"Bomber":3,"Trench Coat":1,"Hat":6,"Socks":9,"Underwear":10,"Belt":6,"Tie":1,"Watch":7,"Scarf":5,"Gloves":5,"Bag":6,"Wallet":7,"Jewelry":3},
  "Jacket":{"T-shirt":8,"Shirt":7,"Sweater":6,"Hoodie":6,"Tank Top":6,"Polo":6,"Blouse":6,"Tunic":6,"Crop Top":6,"Long Sleeve":7,"Pants":7,"Jeans":8,"Shorts":4,"Skirt":6,"Leggings":5,"Sweatpants":5,"Chinos":7,"Cargo Pants":7,"Dress":7,"Sneakers":7,"Boots":7,"Sandals":2,"Slippers":1,"Loafers":5,"Heels":5,"Flats":5,"Running Shoes":3,"Jacket":2,"Coat":3,"Blazer":4,"Vest":6,"Cardigan":5,"Windbreaker":6,"Parka":5,"Bomber":7,"Trench Coat":4,"Hat":7,"Socks":7,"Underwear":10,"Belt":8,"Tie":4,"Watch":7,"Scarf":7,"Gloves":7,"Bag":8,"Wallet":8,"Jewelry":6},
  "Coat":{"T-shirt":6,"Shirt":7,"Sweater":7,"Hoodie":3,"Tank Top":2,"Polo":6,"Blouse":7,"Tunic":7,"Crop Top":3,"Long Sleeve":7,"Pants":7,"Jeans":5,"Shorts":1,"Skirt":6,"Leggings":4,"Sweatpants":1,"Chinos":7,"Cargo Pants":3,"Dress":7,"Sneakers":3,"Boots":8,"Sandals":1,"Slippers":1,"Loafers":7,"Heels":7,"Flats":6,"Running Shoes":1,"Jacket":3,"Coat":2,"Blazer":3,"Vest":6,"Cardigan":6,"Windbreaker":2,"Parka":6,"Bomber":2,"Trench Coat":6,"Hat":6,"Socks":7,"Underwear":10,"Belt":8,"Tie":6,"Watch":7,"Scarf":9,"Gloves":9,"Bag":8,"Wallet":8,"Jewelry":7},
  "Blazer":{"T-shirt":4,"Shirt":9,"Sweater":6,"Hoodie":2,"Tank Top":3,"Polo":8,"Blouse":9,"Tunic":6,"Crop Top":4,"Long Sleeve":7,"Pants":9,"Jeans":6,"Shorts":3,"Skirt":7,"Leggings":3,"Sweatpants":1,"Chinos":9,"Cargo Pants":3,"Dress":7,"Sneakers":4,"Boots":7,"Sandals":3,"Slippers":1,"Loafers":9,"Heels":8,"Flats":7,"Running Shoes":1,"Jacket":4,"Coat":3,"Blazer":2,"Vest":7,"Cardigan":5,"Windbreaker":2,"Parka":2,"Bomber":2,"Trench Coat":5,"Hat":5,"Socks":8,"Underwear":10,"Belt":10,"Tie":10,"Watch":9,"Scarf":7,"Gloves":7,"Bag":9,"Wallet":8,"Jewelry":8},
  "Vest":{"T-shirt":6,"Shirt":7,"Sweater":7,"Hoodie":4,"Tank Top":6,"Polo":7,"Blouse":6,"Tunic":6,"Crop Top":6,"Long Sleeve":7,"Pants":6,"Jeans":5,"Shorts":6,"Skirt":5,"Leggings":5,"Sweatpants":3,"Chinos":6,"Cargo Pants":6,"Dress":5,"Sneakers":6,"Boots":6,"Sandals":5,"Slippers":2,"Loafers":6,"Heels":4,"Flats":5,"Running Shoes":3,"Jacket":6,"Coat":6,"Blazer":7,"Vest":2,"Cardigan":5,"Windbreaker":5,"Parka":5,"Bomber":5,"Trench Coat":5,"Hat":6,"Socks":7,"Underwear":10,"Belt":8,"Tie":7,"Watch":7,"Scarf":6,"Gloves":6,"Bag":7,"Wallet":8,"Jewelry":6},
  "Cardigan":{"T-shirt":7,"Shirt":7,"Sweater":5,"Hoodie":4,"Tank Top":6,"Polo":6,"Blouse":7,"Tunic":8,"Crop Top":6,"Long Sleeve":8,"Pants":7,"Jeans":6,"Shorts":3,"Skirt":6,"Leggings":6,"Sweatpants":4,"Chinos":7,"Cargo Pants":4,"Dress":8,"Sneakers":6,"Boots":7,"Sandals":2,"Slippers":5,"Loafers":6,"Heels":6,"Flats":7,"Running Shoes":2,"Jacket":5,"Coat":6,"Blazer":5,"Vest":5,"Cardigan":2,"Windbreaker":3,"Parka":5,"Bomber":3,"Trench Coat":6,"Hat":6,"Socks":8,"Underwear":10,"Belt":8,"Tie":4,"Watch":7,"Scarf":8,"Gloves":7,"Bag":8,"Wallet":8,"Jewelry":7},
  "Windbreaker":{"T-shirt":7,"Shirt":5,"Sweater":4,"Hoodie":8,"Tank Top":6,"Polo":5,"Blouse":3,"Tunic":4,"Crop Top":6,"Long Sleeve":6,"Pants":5,"Jeans":6,"Shorts":5,"Skirt":3,"Leggings":7,"Sweatpants":8,"Chinos":5,"Cargo Pants":8,"Dress":3,"Sneakers":8,"Boots":6,"Sandals":3,"Slippers":1,"Loafers":3,"Heels":1,"Flats":2,"Running Shoes":8,"Jacket":6,"Coat":2,"Blazer":2,"Vest":5,"Cardigan":3,"Windbreaker":2,"Parka":4,"Bomber":6,"Trench Coat":2,"Hat":7,"Socks":8,"Underwear":10,"Belt":7,"Tie":1,"Watch":7,"Scarf":6,"Gloves":7,"Bag":7,"Wallet":8,"Jewelry":4},
  "Parka":{"T-shirt":5,"Shirt":5,"Sweater":7,"Hoodie":6,"Tank Top":3,"Polo":5,"Blouse":4,"Tunic":5,"Crop Top":4,"Long Sleeve":7,"Pants":6,"Jeans":5,"Shorts":1,"Skirt":4,"Leggings":5,"Sweatpants":4,"Chinos":6,"Cargo Pants":5,"Dress":4,"Sneakers":5,"Boots":8,"Sandals":1,"Slippers":1,"Loafers":4,"Heels":2,"Flats":3,"Running Shoes":2,"Jacket":5,"Coat":6,"Blazer":2,"Vest":5,"Cardigan":5,"Windbreaker":4,"Parka":2,"Bomber":5,"Trench Coat":4,"Hat":7,"Socks":8,"Underwear":10,"Belt":7,"Tie":2,"Watch":7,"Scarf":8,"Gloves":9,"Bag":8,"Wallet":8,"Jewelry":5},
  "Bomber":{"T-shirt":7,"Shirt":5,"Sweater":5,"Hoodie":8,"Tank Top":5,"Polo":5,"Blouse":3,"Tunic":4,"Crop Top":6,"Long Sleeve":6,"Pants":5,"Jeans":7,"Shorts":4,"Skirt":3,"Leggings":6,"Sweatpants":5,"Chinos":5,"Cargo Pants":7,"Dress":4,"Sneakers":7,"Boots":7,"Sandals":2,"Slippers":1,"Loafers":3,"Heels":1,"Flats":2,"Running Shoes":3,"Jacket":7,"Coat":2,"Blazer":2,"Vest":5,"Cardigan":3,"Windbreaker":6,"Parka":5,"Bomber":2,"Trench Coat":2,"Hat":7,"Socks":7,"Underwear":10,"Belt":7,"Tie":2,"Watch":7,"Scarf":6,"Gloves":7,"Bag":7,"Wallet":8,"Jewelry":4},
  "Trench Coat":{"T-shirt":3,"Shirt":8,"Sweater":6,"Hoodie":1,"Tank Top":1,"Polo":7,"Blouse":8,"Tunic":7,"Crop Top":2,"Long Sleeve":6,"Pants":8,"Jeans":4,"Shorts":1,"Skirt":7,"Leggings":3,"Sweatpants":1,"Chinos":8,"Cargo Pants":2,"Dress":8,"Sneakers":2,"Boots":8,"Sandals":1,"Slippers":1,"Loafers":8,"Heels":8,"Flats":7,"Running Shoes":1,"Jacket":4,"Coat":6,"Blazer":5,"Vest":5,"Cardigan":6,"Windbreaker":2,"Parka":4,"Bomber":2,"Trench Coat":2,"Hat":6,"Socks":7,"Underwear":10,"Belt":9,"Tie":7,"Watch":8,"Scarf":8,"Gloves":8,"Bag":9,"Wallet":8,"Jewelry":8},
  "Hat":{"T-shirt":8,"Shirt":6,"Sweater":7,"Hoodie":8,"Tank Top":8,"Polo":6,"Blouse":6,"Tunic":6,"Crop Top":8,"Long Sleeve":7,"Pants":6,"Jeans":7,"Shorts":8,"Skirt":6,"Leggings":7,"Sweatpants":8,"Chinos":6,"Cargo Pants":7,"Dress":6,"Sneakers":7,"Boots":6,"Sandals":8,"Slippers":4,"Loafers":5,"Heels":5,"Flats":5,"Running Shoes":6,"Jacket":7,"Coat":6,"Blazer":5,"Vest":6,"Cardigan":6,"Windbreaker":7,"Parka":7,"Bomber":7,"Trench Coat":6,"Hat":3,"Socks":4,"Underwear":10,"Belt":7,"Tie":4,"Watch":7,"Scarf":7,"Gloves":7,"Bag":7,"Wallet":7,"Jewelry":7},
  "Socks":{"T-shirt":9,"Shirt":9,"Sweater":9,"Hoodie":9,"Tank Top":8,"Polo":9,"Blouse":8,"Tunic":8,"Crop Top":7,"Long Sleeve":9,"Pants":9,"Jeans":9,"Shorts":6,"Skirt":6,"Leggings":8,"Sweatpants":9,"Chinos":9,"Cargo Pants":8,"Dress":3,"Sneakers":9,"Boots":9,"Sandals":2,"Slippers":8,"Loafers":9,"Heels":2,"Flats":4,"Running Shoes":9,"Jacket":7,"Coat":7,"Blazer":8,"Vest":7,"Cardigan":8,"Windbreaker":8,"Parka":8,"Bomber":7,"Trench Coat":7,"Hat":4,"Socks":3,"Underwear":10,"Belt":7,"Tie":2,"Watch":7,"Scarf":7,"Gloves":7,"Bag":7,"Wallet":7,"Jewelry":6},
  "Underwear":{"T-shirt":10,"Shirt":10,"Sweater":10,"Hoodie":10,"Tank Top":10,"Polo":10,"Blouse":10,"Tunic":10,"Crop Top":10,"Long Sleeve":10,"Pants":10,"Jeans":10,"Shorts":10,"Skirt":10,"Leggings":10,"Sweatpants":10,"Chinos":10,"Cargo Pants":10,"Dress":10,"Sneakers":10,"Boots":10,"Sandals":10,"Slippers":10,"Loafers":10,"Heels":10,"Flats":10,"Running Shoes":10,"Jacket":10,"Coat":10,"Blazer":10,"Vest":10,"Cardigan":10,"Windbreaker":10,"Parka":10,"Bomber":10,"Trench Coat":10,"Hat":10,"Socks":10,"Underwear":10,"Belt":10,"Tie":10,"Watch":10,"Scarf":10,"Gloves":10,"Bag":10,"Wallet":10,"Jewelry":10},
  "Belt":{"T-shirt":8,"Shirt":9,"Sweater":8,"Hoodie":7,"Tank Top":7,"Polo":9,"Blouse":8,"Tunic":8,"Crop Top":7,"Long Sleeve":8,"Pants":10,"Jeans":9,"Shorts":7,"Skirt":8,"Leggings":5,"Sweatpants":5,"Chinos":10,"Cargo Pants":9,"Dress":8,"Sneakers":8,"Boots":8,"Sandals":7,"Slippers":6,"Loafers":10,"Heels":8,"Flats":8,"Running Shoes":6,"Jacket":8,"Coat":8,"Blazer":10,"Vest":8,"Cardigan":8,"Windbreaker":7,"Parka":7,"Bomber":7,"Trench Coat":9,"Hat":7,"Socks":7,"Underwear":10,"Belt":3,"Tie":8,"Watch":7,"Scarf":7,"Gloves":7,"Bag":7,"Wallet":7,"Jewelry":7},
  "Tie":{"T-shirt":2,"Shirt":8,"Sweater":5,"Hoodie":1,"Tank Top":1,"Polo":7,"Blouse":4,"Tunic":2,"Crop Top":1,"Long Sleeve":7,"Pants":7,"Jeans":3,"Shorts":1,"Skirt":2,"Leggings":1,"Sweatpants":1,"Chinos":8,"Cargo Pants":1,"Dress":1,"Sneakers":2,"Boots":6,"Sandals":1,"Slippers":1,"Loafers":8,"Heels":3,"Flats":3,"Running Shoes":1,"Jacket":4,"Coat":6,"Blazer":10,"Vest":7,"Cardigan":4,"Windbreaker":1,"Parka":2,"Bomber":2,"Trench Coat":7,"Hat":4,"Socks":2,"Underwear":10,"Belt":8,"Tie":3,"Watch":7,"Scarf":3,"Gloves":3,"Bag":5,"Wallet":7,"Jewelry":4},
  "Watch":{"T-shirt":8,"Shirt":8,"Sweater":8,"Hoodie":7,"Tank Top":7,"Polo":8,"Blouse":8,"Tunic":8,"Crop Top":7,"Long Sleeve":8,"Pants":8,"Jeans":8,"Shorts":7,"Skirt":7,"Leggings":7,"Sweatpants":6,"Chinos":8,"Cargo Pants":7,"Dress":8,"Sneakers":7,"Boots":8,"Sandals":7,"Slippers":6,"Loafers":8,"Heels":8,"Flats":8,"Running Shoes":7,"Jacket":7,"Coat":7,"Blazer":9,"Vest":7,"Cardigan":7,"Windbreaker":7,"Parka":7,"Bomber":7,"Trench Coat":8,"Hat":7,"Socks":7,"Underwear":10,"Belt":7,"Tie":7,"Watch":3,"Scarf":7,"Gloves":7,"Bag":7,"Wallet":7,"Jewelry":7},
  "Scarf":{"T-shirt":7,"Shirt":7,"Sweater":9,"Hoodie":6,"Tank Top":5,"Polo":7,"Blouse":8,"Tunic":8,"Crop Top":6,"Long Sleeve":8,"Pants":7,"Jeans":6,"Shorts":4,"Skirt":7,"Leggings":6,"Sweatpants":5,"Chinos":7,"Cargo Pants":6,"Dress":8,"Sneakers":6,"Boots":8,"Sandals":4,"Slippers":5,"Loafers":7,"Heels":7,"Flats":7,"Running Shoes":5,"Jacket":7,"Coat":9,"Blazer":7,"Vest":6,"Cardigan":8,"Windbreaker":6,"Parka":8,"Bomber":6,"Trench Coat":8,"Hat":7,"Socks":7,"Underwear":10,"Belt":7,"Tie":3,"Watch":7,"Scarf":3,"Gloves":8,"Bag":7,"Wallet":7,"Jewelry":7},
  "Gloves":{"T-shirt":7,"Shirt":7,"Sweater":9,"Hoodie":6,"Tank Top":4,"Polo":7,"Blouse":7,"Tunic":7,"Crop Top":6,"Long Sleeve":8,"Pants":7,"Jeans":6,"Shorts":3,"Skirt":7,"Leggings":6,"Sweatpants":5,"Chinos":7,"Cargo Pants":7,"Dress":8,"Sneakers":6,"Boots":8,"Sandals":3,"Slippers":5,"Loafers":7,"Heels":8,"Flats":7,"Running Shoes":5,"Jacket":7,"Coat":9,"Blazer":7,"Vest":6,"Cardigan":7,"Windbreaker":7,"Parka":9,"Bomber":7,"Trench Coat":8,"Hat":7,"Socks":7,"Underwear":10,"Belt":7,"Tie":3,"Watch":7,"Scarf":8,"Gloves":3,"Bag":7,"Wallet":7,"Jewelry":7},
  "Bag":{"T-shirt":8,"Shirt":8,"Sweater":8,"Hoodie":8,"Tank Top":7,"Polo":8,"Blouse":9,"Tunic":8,"Crop Top":7,"Long Sleeve":8,"Pants":8,"Jeans":8,"Shorts":7,"Skirt":9,"Leggings":7,"Sweatpants":7,"Chinos":8,"Cargo Pants":7,"Dress":9,"Sneakers":7,"Boots":8,"Sandals":7,"Slippers":6,"Loafers":8,"Heels":9,"Flats":8,"Running Shoes":6,"Jacket":8,"Coat":8,"Blazer":9,"Vest":7,"Cardigan":8,"Windbreaker":7,"Parka":8,"Bomber":7,"Trench Coat":9,"Hat":7,"Socks":7,"Underwear":10,"Belt":7,"Tie":5,"Watch":7,"Scarf":7,"Gloves":7,"Bag":3,"Wallet":7,"Jewelry":7},
  "Wallet":{"T-shirt":8,"Shirt":8,"Sweater":8,"Hoodie":8,"Tank Top":8,"Polo":8,"Blouse":8,"Tunic":8,"Crop Top":8,"Long Sleeve":8,"Pants":8,"Jeans":8,"Shorts":8,"Skirt":8,"Leggings":8,"Sweatpants":8,"Chinos":8,"Cargo Pants":8,"Dress":8,"Sneakers":8,"Boots":8,"Sandals":8,"Slippers":7,"Loafers":8,"Heels":8,"Flats":8,"Running Shoes":7,"Jacket":8,"Coat":8,"Blazer":8,"Vest":8,"Cardigan":8,"Windbreaker":8,"Parka":8,"Bomber":8,"Trench Coat":8,"Hat":7,"Socks":7,"Underwear":10,"Belt":7,"Tie":7,"Watch":7,"Scarf":7,"Gloves":7,"Bag":7,"Wallet":3,"Jewelry":7},
  "Jewelry":{"T-shirt":7,"Shirt":8,"Sweater":7,"Hoodie":5,"Tank Top":7,"Polo":7,"Blouse":9,"Tunic":8,"Crop Top":8,"Long Sleeve":7,"Pants":7,"Jeans":6,"Shorts":6,"Skirt":9,"Leggings":5,"Sweatpants":3,"Chinos":7,"Cargo Pants":4,"Dress":10,"Sneakers":5,"Boots":7,"Sandals":7,"Slippers":4,"Loafers":7,"Heels":10,"Flats":9,"Running Shoes":3,"Jacket":6,"Coat":7,"Blazer":8,"Vest":6,"Cardigan":7,"Windbreaker":4,"Parka":5,"Bomber":4,"Trench Coat":8,"Hat":7,"Socks":6,"Underwear":10,"Belt":7,"Tie":4,"Watch":7,"Scarf":7,"Gloves":7,"Bag":7,"Wallet":7,"Jewelry":3},
};

export const OUTFIT_COMPATIBILITY: CompatibilityMatrix = {
  colorCompatibility,
  patternCompatibility,
  typeCompatibility,
  styleRules: {
    formalityLevels: {
      'T-shirt': 'casual',
      'Shirt': 'versatile',
      'Jacket': 'versatile',
      'Coat': 'formal',
      'Sweater': 'versatile',
      'Hoodie': 'casual',
      'Pants': 'versatile',
      'Jeans': 'casual',
      'Shorts': 'casual',
      'Skirt': 'versatile',
      'Dress': 'versatile',
      'Shoes': 'versatile',
      'Sneakers': 'casual',
      'Boots': 'versatile',
      'Sandals': 'casual',
      'Hat': 'casual',
      'Socks': 'casual',
      'Underwear': 'casual',
      'Accessories': 'versatile',
      'Other': 'versatile',
    },
    typeCategories: {
      tops: CLOTHING_TYPES_BY_CATEGORY.Tops,
      bottoms: CLOTHING_TYPES_BY_CATEGORY.Bottoms,
      outerwear: CLOTHING_TYPES_BY_CATEGORY.Outerwear,
      footwear: CLOTHING_TYPES_BY_CATEGORY.Footwear,
      accessories: CLOTHING_TYPES_BY_CATEGORY.Accessories,
    },
    compatibilityRules: [
      { rule: 'matching_formality', description: 'Items with matching formality levels score +2', score: 2 },
      { rule: 'complementary_colors', description: 'Complementary color pairs score +3', score: 3 },
      { rule: 'neutral_base', description: 'Neutral colors (black, white, gray, beige) work with everything', score: 1 },
    ],
  },
};

// Helper function to get color compatibility score
// Enhanced to handle multiple colors: calculates average compatibility across all color combinations
export function getColorCompatibility(
  color1: ClothingColor,
  color2: ClothingColor,
  colors1?: ClothingColor[],
  colors2?: ClothingColor[]
): number {
  // If items have multiple colors, calculate compatibility for all combinations
  const colors1List = colors1 && colors1.length > 0 ? [color1, ...colors1] : [color1];
  const colors2List = colors2 && colors2.length > 0 ? [color2, ...colors2] : [color2];
  
  // Calculate average compatibility across all color combinations
  let totalScore = 0;
  let combinations = 0;
  
  for (const c1 of colors1List) {
    for (const c2 of colors2List) {
      const score = OUTFIT_COMPATIBILITY.colorCompatibility[c1]?.[c2] ?? 5;
      totalScore += score;
      combinations++;
    }
  }
  
  return combinations > 0 ? Math.round((totalScore / combinations) * 10) / 10 : 5;
}

// Helper function to get pattern compatibility score
export function getPatternCompatibility(pattern1: ClothingPattern, pattern2: ClothingPattern): number {
  return OUTFIT_COMPATIBILITY.patternCompatibility[pattern1]?.[pattern2] ?? 5;
}

// Helper function to get type compatibility score
// Works with string types (both old and new type names)
export function getTypeCompatibility(type1: string, type2: string): number {
  return OUTFIT_COMPATIBILITY.typeCompatibility[type1]?.[type2] ?? 5;
}

// Helper function to get formality level (deprecated - using user-defined formality levels)
export function getFormalityLevel(type: string): 'formal' | 'casual' | 'sporty' | 'versatile' {
  return OUTFIT_COMPATIBILITY.styleRules.formalityLevels?.[type] ?? 'versatile';
}

