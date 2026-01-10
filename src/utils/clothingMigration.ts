import { ClothingItem, ClothingType, ClothingCategory, ClothingPattern } from '@/types/clothing';

// Migration mapping: Old Type → { Category, Type }
const TYPE_MIGRATION_MAP: Record<ClothingType, { category: ClothingCategory; type: string }> = {
  // Tops
  'T-shirt': { category: 'Tops', type: 'T-shirt' },
  'Shirt': { category: 'Tops', type: 'Shirt' },
  'Sweater': { category: 'Tops', type: 'Sweater' },
  'Hoodie': { category: 'Tops', type: 'Hoodie' },
  
  // Bottoms
  'Pants': { category: 'Bottoms', type: 'Pants' },
  'Jeans': { category: 'Bottoms', type: 'Jeans' },
  'Shorts': { category: 'Bottoms', type: 'Shorts' },
  'Skirt': { category: 'Bottoms', type: 'Skirt' },
  'Dress': { category: 'Bottoms', type: 'Dress' },
  
  // Footwear
  'Shoes': { category: 'Footwear', type: 'Shoes' },
  'Sneakers': { category: 'Footwear', type: 'Sneakers' },
  'Boots': { category: 'Footwear', type: 'Boots' },
  'Sandals': { category: 'Footwear', type: 'Sandals' },
  
  // Outerwear
  'Jacket': { category: 'Outerwear', type: 'Jacket' },
  'Coat': { category: 'Outerwear', type: 'Coat' },
  
  // Accessories
  'Hat': { category: 'Accessories', type: 'Hat' },
  'Socks': { category: 'Accessories', type: 'Socks' },
  'Underwear': { category: 'Accessories', type: 'Underwear' },
  'Accessories': { category: 'Accessories', type: 'Other' },
  'Other': { category: 'Accessories', type: 'Other' },
};

/**
 * Migrates an old clothing item to the new category+type structure
 * This function is idempotent - safe to call multiple times
 */
export function migrateItem(item: ClothingItem): ClothingItem {
  // If already migrated and has category, return as-is
  if (item.migrated && item.category) {
    return item;
  }
  
  // Determine the old type
  let oldType: ClothingType | undefined;
  
  if (item.legacyType) {
    oldType = item.legacyType;
  } else if (!item.category && typeof item.type === 'string') {
    // Check if type matches a legacy ClothingType
    const possibleTypes: ClothingType[] = [
      'T-shirt', 'Shirt', 'Jacket', 'Coat', 'Sweater', 'Hoodie',
      'Pants', 'Jeans', 'Shorts', 'Skirt', 'Dress',
      'Shoes', 'Sneakers', 'Boots', 'Sandals',
      'Hat', 'Socks', 'Underwear', 'Accessories', 'Other'
    ];
    
    if (possibleTypes.includes(item.type as ClothingType)) {
      oldType = item.type as ClothingType;
    }
  }
  
  // If we found an old type, migrate it
  if (oldType) {
    const mapping = TYPE_MIGRATION_MAP[oldType];
    
    if (mapping) {
      const migratedItem: ClothingItem = {
        ...item,
        category: mapping.category,
        type: mapping.type,
        legacyType: oldType, // Keep for reference
        migrated: true,
        // Preserve existing tags if any
        tags: item.tags || [],
      };
      
      // Handle Multicolor items and ensure pattern is set
      if (item.color === 'Multicolor' && !item.colors && !item.pattern) {
        migratedItem.colors = []; // User can manually add colors later
        migratedItem.pattern = 'Solid'; // Default pattern
      } else if (!item.pattern) {
        migratedItem.pattern = 'Solid'; // Default pattern
      }
      
      return migratedItem;
    }
  }
  
  // If item already has category but not migrated flag, just mark it as migrated
  if (item.category) {
    const migratedItem: ClothingItem = {
      ...item,
      migrated: true,
      tags: item.tags || [],
    };
    
    // Handle Multicolor items and ensure pattern is set
    if (item.color === 'Multicolor' && !item.colors && !item.pattern) {
      migratedItem.colors = []; // User can manually add colors later
      migratedItem.pattern = 'Solid'; // Default pattern
    } else if (!item.pattern) {
      migratedItem.pattern = 'Solid'; // Default pattern
    }
    
    return migratedItem;
  }
  
  // Fallback for unmapped types - try to infer category from type string
  const inferredCategory = inferCategoryFromType(item.type);
  
  // Handle Multicolor items and ensure pattern is set
  const migratedItem: ClothingItem = {
    ...item,
    category: inferredCategory,
    type: item.type || 'Other',
    migrated: true,
    tags: item.tags || [],
  };
  
  // If item has 'Multicolor' as color but no colors array or pattern, set defaults
  if (item.color === 'Multicolor' && !item.colors && !item.pattern) {
    migratedItem.colors = []; // User can manually add colors later
    migratedItem.pattern = 'Solid'; // Default pattern
  } else if (!item.pattern) {
    // Default pattern to 'Solid' if not specified
    migratedItem.pattern = 'Solid';
  }
  
  return migratedItem;
}

/**
 * Infers category from type string (fallback for edge cases)
 */
function inferCategoryFromType(type: string): ClothingCategory {
  const lowerType = type.toLowerCase();
  
  // Check each category's types
  const categoryKeywords: Record<ClothingCategory, string[]> = {
    Tops: ['shirt', 'top', 'sweater', 'hoodie', 'blouse', 'tunic', 'polo', 'tank'],
    Bottoms: ['pants', 'jeans', 'shorts', 'skirt', 'leggings', 'dress'],
    Footwear: ['shoe', 'sneaker', 'boot', 'sandal', 'slipper', 'loafer', 'heel'],
    Outerwear: ['jacket', 'coat', 'blazer', 'vest', 'cardigan', 'windbreaker', 'parka'],
    Accessories: ['hat', 'sock', 'underwear', 'belt', 'watch', 'scarf', 'glove', 'bag'],
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerType.includes(keyword))) {
      return category as ClothingCategory;
    }
  }
  
  return 'Accessories'; // Default fallback
}

/**
 * Migrates an array of items
 */
export function migrateItems(items: ClothingItem[]): ClothingItem[] {
  return items.map(migrateItem);
}

