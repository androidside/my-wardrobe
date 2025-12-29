// Compatibility matrix for outfit combinations
// This is a basic version - can be enhanced by running: npm run generate:compatibility

import { ClothingType, ClothingColor } from '../types/clothing';

export interface CompatibilityMatrix {
  colorCompatibility: Record<ClothingColor, Record<ClothingColor, number>>;
  typeCompatibility: Record<ClothingType, Record<ClothingType, number>>;
  styleRules: {
    formalityLevels?: Record<ClothingType, 'formal' | 'casual' | 'sporty' | 'versatile'>; // Deprecated - using user-defined formality levels
    typeCategories: {
      tops: ClothingType[];
      bottoms: ClothingType[];
      outerwear: ClothingType[];
      footwear: ClothingType[];
      accessories: ClothingType[];
    };
    compatibilityRules: Array<{
      rule: string;
      description: string;
      score: number;
    }>;
  };
}

// Basic color compatibility matrix (0-10 scale)
const colorCompatibility: Record<ClothingColor, Record<ClothingColor, number>> = {
  Black: { Black: 4, White: 10, Gray: 9, Navy: 8, Blue: 7, Red: 8, Green: 6, Yellow: 5, Orange: 5, Pink: 6, Purple: 7, Brown: 7, Beige: 8, Multicolor: 6, Other: 5 },
  White: { Black: 10, White: 4, Gray: 8, Navy: 9, Blue: 8, Red: 8, Green: 7, Yellow: 7, Orange: 6, Pink: 7, Purple: 7, Brown: 7, Beige: 8, Multicolor: 7, Other: 5 },
  Gray: { Black: 9, White: 8, Gray: 5, Navy: 8, Blue: 7, Red: 7, Green: 6, Yellow: 5, Orange: 5, Pink: 6, Purple: 6, Brown: 7, Beige: 7, Multicolor: 6, Other: 5 },
  Navy: { Black: 8, White: 9, Gray: 8, Navy: 4, Blue: 6, Red: 8, Green: 7, Yellow: 6, Orange: 6, Pink: 6, Purple: 7, Brown: 7, Beige: 9, Multicolor: 6, Other: 5 },
  Blue: { Black: 7, White: 8, Gray: 7, Navy: 6, Blue: 4, Red: 8, Green: 6, Yellow: 6, Orange: 6, Pink: 6, Purple: 7, Brown: 6, Beige: 7, Multicolor: 7, Other: 5 },
  Red: { Black: 8, White: 8, Gray: 7, Navy: 8, Blue: 8, Red: 3, Green: 5, Yellow: 6, Orange: 7, Pink: 7, Purple: 6, Brown: 7, Beige: 7, Multicolor: 6, Other: 5 },
  Green: { Black: 6, White: 7, Gray: 6, Navy: 7, Blue: 6, Red: 5, Green: 3, Yellow: 6, Orange: 6, Pink: 5, Purple: 6, Brown: 7, Beige: 6, Multicolor: 7, Other: 5 },
  Yellow: { Black: 5, White: 7, Gray: 5, Navy: 6, Blue: 6, Red: 6, Green: 6, Yellow: 3, Orange: 7, Pink: 6, Purple: 5, Brown: 6, Beige: 7, Multicolor: 7, Other: 5 },
  Orange: { Black: 5, White: 6, Gray: 5, Navy: 6, Blue: 6, Red: 7, Green: 6, Yellow: 7, Orange: 3, Pink: 6, Purple: 5, Brown: 7, Beige: 6, Multicolor: 7, Other: 5 },
  Pink: { Black: 6, White: 7, Gray: 6, Navy: 6, Blue: 6, Red: 7, Green: 5, Yellow: 6, Orange: 6, Pink: 3, Purple: 7, Brown: 6, Beige: 7, Multicolor: 7, Other: 5 },
  Purple: { Black: 7, White: 7, Gray: 6, Navy: 7, Blue: 7, Red: 6, Green: 6, Yellow: 5, Orange: 5, Pink: 7, Purple: 3, Brown: 6, Beige: 6, Multicolor: 7, Other: 5 },
  Brown: { Black: 7, White: 7, Gray: 7, Navy: 7, Blue: 6, Red: 7, Green: 7, Yellow: 6, Orange: 7, Pink: 6, Purple: 6, Brown: 4, Beige: 9, Multicolor: 6, Other: 5 },
  Beige: { Black: 8, White: 8, Gray: 7, Navy: 9, Blue: 7, Red: 7, Green: 6, Yellow: 7, Orange: 6, Pink: 7, Purple: 6, Brown: 9, Beige: 4, Multicolor: 6, Other: 5 },
  Multicolor: { Black: 6, White: 7, Gray: 6, Navy: 6, Blue: 7, Red: 6, Green: 7, Yellow: 7, Orange: 7, Pink: 7, Purple: 7, Brown: 6, Beige: 6, Multicolor: 5, Other: 5 },
  Other: { Black: 5, White: 5, Gray: 5, Navy: 5, Blue: 5, Red: 5, Green: 5, Yellow: 5, Orange: 5, Pink: 5, Purple: 5, Brown: 5, Beige: 5, Multicolor: 5, Other: 5 },
};

// Basic type compatibility matrix (0-10 scale)
const typeCompatibility: Record<ClothingType, Record<ClothingType, number>> = {
  'T-shirt': { 'T-shirt': 2, 'Shirt': 3, 'Jacket': 9, 'Coat': 8, 'Sweater': 3, 'Hoodie': 3, 'Pants': 10, 'Jeans': 10, 'Shorts': 9, 'Skirt': 8, 'Dress': 2, 'Shoes': 8, 'Sneakers': 10, 'Boots': 7, 'Sandals': 8, 'Hat': 9, 'Socks': 8, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Shirt': { 'T-shirt': 3, 'Shirt': 2, 'Jacket': 10, 'Coat': 9, 'Sweater': 4, 'Hoodie': 3, 'Pants': 10, 'Jeans': 9, 'Shorts': 7, 'Skirt': 9, 'Dress': 2, 'Shoes': 10, 'Sneakers': 7, 'Boots': 8, 'Sandals': 6, 'Hat': 8, 'Socks': 8, 'Underwear': 2, 'Accessories': 9, 'Other': 5 },
  'Jacket': { 'T-shirt': 9, 'Shirt': 10, 'Jacket': 2, 'Coat': 3, 'Sweater': 9, 'Hoodie': 8, 'Pants': 9, 'Jeans': 9, 'Shorts': 6, 'Skirt': 8, 'Dress': 7, 'Shoes': 9, 'Sneakers': 8, 'Boots': 9, 'Sandals': 4, 'Hat': 8, 'Socks': 8, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Coat': { 'T-shirt': 8, 'Shirt': 9, 'Jacket': 3, 'Coat': 2, 'Sweater': 9, 'Hoodie': 7, 'Pants': 9, 'Jeans': 8, 'Shorts': 4, 'Skirt': 8, 'Dress': 8, 'Shoes': 9, 'Sneakers': 6, 'Boots': 10, 'Sandals': 3, 'Hat': 8, 'Socks': 8, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Sweater': { 'T-shirt': 3, 'Shirt': 4, 'Jacket': 9, 'Coat': 9, 'Sweater': 2, 'Hoodie': 3, 'Pants': 9, 'Jeans': 9, 'Shorts': 5, 'Skirt': 8, 'Dress': 3, 'Shoes': 8, 'Sneakers': 7, 'Boots': 8, 'Sandals': 5, 'Hat': 8, 'Socks': 8, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Hoodie': { 'T-shirt': 3, 'Shirt': 3, 'Jacket': 8, 'Coat': 7, 'Sweater': 3, 'Hoodie': 2, 'Pants': 9, 'Jeans': 10, 'Shorts': 8, 'Skirt': 6, 'Dress': 2, 'Shoes': 7, 'Sneakers': 10, 'Boots': 7, 'Sandals': 6, 'Hat': 7, 'Socks': 8, 'Underwear': 2, 'Accessories': 7, 'Other': 5 },
  'Pants': { 'T-shirt': 10, 'Shirt': 10, 'Jacket': 9, 'Coat': 9, 'Sweater': 9, 'Hoodie': 9, 'Pants': 2, 'Jeans': 3, 'Shorts': 2, 'Skirt': 2, 'Dress': 2, 'Shoes': 9, 'Sneakers': 8, 'Boots': 9, 'Sandals': 5, 'Hat': 8, 'Socks': 9, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Jeans': { 'T-shirt': 10, 'Shirt': 9, 'Jacket': 9, 'Coat': 8, 'Sweater': 9, 'Hoodie': 10, 'Pants': 3, 'Jeans': 2, 'Shorts': 2, 'Skirt': 2, 'Dress': 2, 'Shoes': 9, 'Sneakers': 10, 'Boots': 8, 'Sandals': 6, 'Hat': 9, 'Socks': 9, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Shorts': { 'T-shirt': 9, 'Shirt': 7, 'Jacket': 6, 'Coat': 4, 'Sweater': 5, 'Hoodie': 8, 'Pants': 2, 'Jeans': 2, 'Shorts': 2, 'Skirt': 2, 'Dress': 2, 'Shoes': 7, 'Sneakers': 9, 'Boots': 5, 'Sandals': 10, 'Hat': 8, 'Socks': 8, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Skirt': { 'T-shirt': 8, 'Shirt': 9, 'Jacket': 8, 'Coat': 8, 'Sweater': 8, 'Hoodie': 6, 'Pants': 2, 'Jeans': 2, 'Shorts': 2, 'Skirt': 2, 'Dress': 3, 'Shoes': 9, 'Sneakers': 6, 'Boots': 7, 'Sandals': 8, 'Hat': 7, 'Socks': 8, 'Underwear': 2, 'Accessories': 9, 'Other': 5 },
  'Dress': { 'T-shirt': 2, 'Shirt': 2, 'Jacket': 7, 'Coat': 8, 'Sweater': 3, 'Hoodie': 2, 'Pants': 2, 'Jeans': 2, 'Shorts': 2, 'Skirt': 3, 'Dress': 1, 'Shoes': 9, 'Sneakers': 5, 'Boots': 6, 'Sandals': 8, 'Hat': 7, 'Socks': 8, 'Underwear': 2, 'Accessories': 9, 'Other': 5 },
  'Shoes': { 'T-shirt': 8, 'Shirt': 10, 'Jacket': 9, 'Coat': 9, 'Sweater': 8, 'Hoodie': 7, 'Pants': 9, 'Jeans': 9, 'Shorts': 7, 'Skirt': 9, 'Dress': 9, 'Shoes': 2, 'Sneakers': 3, 'Boots': 3, 'Sandals': 3, 'Hat': 7, 'Socks': 10, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Sneakers': { 'T-shirt': 10, 'Shirt': 7, 'Jacket': 8, 'Coat': 6, 'Sweater': 7, 'Hoodie': 10, 'Pants': 8, 'Jeans': 10, 'Shorts': 9, 'Skirt': 6, 'Dress': 5, 'Shoes': 3, 'Sneakers': 2, 'Boots': 3, 'Sandals': 3, 'Hat': 8, 'Socks': 10, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Boots': { 'T-shirt': 7, 'Shirt': 8, 'Jacket': 9, 'Coat': 10, 'Sweater': 8, 'Hoodie': 7, 'Pants': 9, 'Jeans': 8, 'Shorts': 5, 'Skirt': 7, 'Dress': 6, 'Shoes': 3, 'Sneakers': 3, 'Boots': 2, 'Sandals': 2, 'Hat': 8, 'Socks': 9, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Sandals': { 'T-shirt': 8, 'Shirt': 6, 'Jacket': 4, 'Coat': 3, 'Sweater': 5, 'Hoodie': 6, 'Pants': 5, 'Jeans': 6, 'Shorts': 10, 'Skirt': 8, 'Dress': 8, 'Shoes': 3, 'Sneakers': 3, 'Boots': 2, 'Sandals': 2, 'Hat': 7, 'Socks': 7, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Hat': { 'T-shirt': 9, 'Shirt': 8, 'Jacket': 8, 'Coat': 8, 'Sweater': 8, 'Hoodie': 7, 'Pants': 8, 'Jeans': 9, 'Shorts': 8, 'Skirt': 7, 'Dress': 7, 'Shoes': 7, 'Sneakers': 8, 'Boots': 8, 'Sandals': 7, 'Hat': 2, 'Socks': 7, 'Underwear': 2, 'Accessories': 7, 'Other': 5 },
  'Socks': { 'T-shirt': 8, 'Shirt': 8, 'Jacket': 8, 'Coat': 8, 'Sweater': 8, 'Hoodie': 8, 'Pants': 9, 'Jeans': 9, 'Shorts': 8, 'Skirt': 8, 'Dress': 8, 'Shoes': 10, 'Sneakers': 10, 'Boots': 9, 'Sandals': 7, 'Hat': 7, 'Socks': 2, 'Underwear': 2, 'Accessories': 8, 'Other': 5 },
  'Underwear': { 'T-shirt': 2, 'Shirt': 2, 'Jacket': 2, 'Coat': 2, 'Sweater': 2, 'Hoodie': 2, 'Pants': 2, 'Jeans': 2, 'Shorts': 2, 'Skirt': 2, 'Dress': 2, 'Shoes': 2, 'Sneakers': 2, 'Boots': 2, 'Sandals': 2, 'Hat': 2, 'Socks': 2, 'Underwear': 2, 'Accessories': 2, 'Other': 2 },
  'Accessories': { 'T-shirt': 8, 'Shirt': 9, 'Jacket': 8, 'Coat': 8, 'Sweater': 8, 'Hoodie': 7, 'Pants': 8, 'Jeans': 8, 'Shorts': 8, 'Skirt': 9, 'Dress': 9, 'Shoes': 8, 'Sneakers': 8, 'Boots': 8, 'Sandals': 8, 'Hat': 7, 'Socks': 8, 'Underwear': 2, 'Accessories': 5, 'Other': 5 },
  'Other': { 'T-shirt': 5, 'Shirt': 5, 'Jacket': 5, 'Coat': 5, 'Sweater': 5, 'Hoodie': 5, 'Pants': 5, 'Jeans': 5, 'Shorts': 5, 'Skirt': 5, 'Dress': 5, 'Shoes': 5, 'Sneakers': 5, 'Boots': 5, 'Sandals': 5, 'Hat': 5, 'Socks': 5, 'Underwear': 5, 'Accessories': 5, 'Other': 5 },
};

export const OUTFIT_COMPATIBILITY: CompatibilityMatrix = {
  colorCompatibility,
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
      tops: ['T-shirt', 'Shirt', 'Sweater', 'Hoodie'],
      bottoms: ['Pants', 'Jeans', 'Shorts', 'Skirt','Underwear'],
      outerwear: ['Jacket', 'Coat'],
      footwear: ['Shoes', 'Sneakers', 'Boots', 'Sandals'],
      accessories: ['Hat', 'Socks', 'Accessories'],
    },
    compatibilityRules: [
      { rule: 'matching_formality', description: 'Items with matching formality levels score +2', score: 2 },
      { rule: 'complementary_colors', description: 'Complementary color pairs score +3', score: 3 },
      { rule: 'neutral_base', description: 'Neutral colors (black, white, gray, beige) work with everything', score: 1 },
    ],
  },
};

// Helper function to get color compatibility score
export function getColorCompatibility(color1: ClothingColor, color2: ClothingColor): number {
  return OUTFIT_COMPATIBILITY.colorCompatibility[color1]?.[color2] ?? 5;
}

// Helper function to get type compatibility score
export function getTypeCompatibility(type1: ClothingType, type2: ClothingType): number {
  return OUTFIT_COMPATIBILITY.typeCompatibility[type1]?.[type2] ?? 5;
}

// Helper function to get formality level (deprecated - using user-defined formality levels)
export function getFormalityLevel(type: ClothingType): 'formal' | 'casual' | 'sporty' | 'versatile' {
  return OUTFIT_COMPATIBILITY.styleRules.formalityLevels?.[type] ?? 'versatile';
}

