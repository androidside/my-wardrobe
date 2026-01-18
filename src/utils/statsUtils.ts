import { ClothingItem, ClothingColor } from '@/types/clothing';
import { Wardrobe } from '@/types/wardrobe';
import { wardrobeStorageService } from '@/services/wardrobeStorage';

// Statistics Interfaces
export interface OverviewStats {
  totalItems: number;
  totalValue: number;
  averageCost: number;
  uniqueBrands: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  fill: string; // Color for chart
}

export interface ColorStat {
  color: string;
  count: number;
  hexCode: string;
}

export interface BrandStat {
  brand: string;
  itemCount: number;
  totalSpent: number;
  averageCost: number;
}

export interface FormalityDistribution {
  level: 'Casual' | 'Smart Casual' | 'Formal';
  range: string;
  count: number;
  percentage: number;
  fill: string;
}

export interface TagStat {
  tag: string;
  count: number;
}

export interface PatternStat {
  pattern: string;
  count: number;
  percentage: number;
}

// Color mapping for visualization
export const COLOR_HEX_MAP: Record<ClothingColor, string> = {
  'Black': '#1F2937',
  'White': '#F9FAFB',
  'Gray': '#6B7280',
  'Navy': '#1E3A8A',
  'Blue': '#3B82F6',
  'Red': '#EF4444',
  'Green': '#10B981',
  'Yellow': '#FBBF24',
  'Orange': '#F97316',
  'Pink': '#EC4899',
  'Purple': '#A855F7',
  'Brown': '#92400E',
  'Beige': '#D6C7A8',
  'Multicolor': '#9333EA',
  'Other': '#9CA3AF',
};

// Category colors for pie chart
const CATEGORY_COLORS: Record<string, string> = {
  'Tops': '#6366F1',
  'Bottoms': '#8B5CF6',
  'Footwear': '#A78BFA',
  'Outerwear': '#C4B5FD',
  'Accessories': '#DDD6FE',
};

// Calculate overview statistics
export function calculateOverviewStats(items: ClothingItem[]): OverviewStats {
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.cost || 0), 0);
  const averageCost = totalItems > 0 ? totalValue / totalItems : 0;
  const uniqueBrands = new Set(items.map(item => item.brand)).size;

  return {
    totalItems,
    totalValue,
    averageCost,
    uniqueBrands,
  };
}

// Calculate category distribution
export function calculateCategoryDistribution(items: ClothingItem[]): CategoryDistribution[] {
  const categoryCounts: Record<string, number> = {};
  
  items.forEach(item => {
    const category = item.category || 'Other';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const total = items.length;
  
  return Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      fill: CATEGORY_COLORS[category] || '#9CA3AF',
    }))
    .sort((a, b) => b.count - a.count);
}

// Calculate color distribution
export function calculateColorDistribution(items: ClothingItem[]): ColorStat[] {
  const colorCounts: Record<string, number> = {};
  
  items.forEach(item => {
    const primaryColor = item.color;
    colorCounts[primaryColor] = (colorCounts[primaryColor] || 0) + 1;
    
    // Count additional colors if present
    if (item.colors && item.colors.length > 0) {
      item.colors.forEach(color => {
        if (color !== primaryColor) {
          colorCounts[color] = (colorCounts[color] || 0) + 0.5; // Weight secondary colors less
        }
      });
    }
  });

  return Object.entries(colorCounts)
    .map(([color, count]) => ({
      color,
      count: Math.round(count),
      hexCode: COLOR_HEX_MAP[color as ClothingColor] || '#9CA3AF',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7); // Top 7 colors
}

// Calculate brand statistics
export function calculateBrandStats(items: ClothingItem[]): BrandStat[] {
  const brandData: Record<string, { count: number; totalSpent: number }> = {};
  
  items.forEach(item => {
    const brand = item.brand || 'Unknown';
    if (!brandData[brand]) {
      brandData[brand] = { count: 0, totalSpent: 0 };
    }
    brandData[brand].count++;
    brandData[brand].totalSpent += item.cost || 0;
  });

  return Object.entries(brandData)
    .map(([brand, data]) => ({
      brand,
      itemCount: data.count,
      totalSpent: data.totalSpent,
      averageCost: data.totalSpent / data.count,
    }))
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, 5); // Top 5 brands
}

// Calculate formality distribution
export function calculateFormalityDistribution(items: ClothingItem[]): FormalityDistribution[] {
  const casual = items.filter(item => item.formalityLevel && item.formalityLevel <= 2).length;
  const smartCasual = items.filter(item => item.formalityLevel === 3).length;
  const formal = items.filter(item => item.formalityLevel && item.formalityLevel >= 4).length;
  
  const total = items.length;

  return [
    {
      level: 'Casual',
      range: '1-2',
      count: casual,
      percentage: total > 0 ? (casual / total) * 100 : 0,
      fill: '#3B82F6',
    },
    {
      level: 'Smart Casual',
      range: '3',
      count: smartCasual,
      percentage: total > 0 ? (smartCasual / total) * 100 : 0,
      fill: '#6366F1',
    },
    {
      level: 'Formal',
      range: '4-5',
      count: formal,
      percentage: total > 0 ? (formal / total) * 100 : 0,
      fill: '#8B5CF6',
    },
  ];
}

// Calculate tag statistics
export function calculateTagStats(items: ClothingItem[]): TagStat[] {
  const tagCounts: Record<string, number> = {};
  
  items.forEach(item => {
    if (item.tags && item.tags.length > 0) {
      item.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 tags
}

// Calculate pattern distribution
export function calculatePatternDistribution(items: ClothingItem[]): PatternStat[] {
  const patternCounts: Record<string, number> = {};
  
  items.forEach(item => {
    const pattern = item.pattern || 'Solid';
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
  });

  const total = items.length;

  return Object.entries(patternCounts)
    .map(([pattern, count]) => ({
      pattern,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// Fetch all items across all wardrobes
export async function getAllItemsForUser(
  userId: string,
  wardrobes: Wardrobe[]
): Promise<ClothingItem[]> {
  try {
    const allItemsPromises = wardrobes.map(wardrobe =>
      wardrobeStorageService.getAllItems(userId, wardrobe.id)
    );
    const itemsArrays = await Promise.all(allItemsPromises);
    const allItems = itemsArrays.flat();
    console.log(`[getAllItemsForUser] Fetched ${allItems.length} total items across ${wardrobes.length} wardrobes (after migration)`);
    return allItems;
  } catch (error) {
    console.error('Error fetching all items for user:', error);
    return [];
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

// Format large numbers
export function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
