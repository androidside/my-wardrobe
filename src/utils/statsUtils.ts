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
  level: 'Casual' | 'Smart Casual' | 'Formal' | 'Unassigned';
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

// New interfaces for Phase 1
export interface GapItem {
  type: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface RedundancyItem {
  type: string;
  color: string;
  count: number;
  items: ClothingItem[];
  recommendation: string;
}

export interface WardrobeHealthScore {
  overallScore: number; // 0-100
  gaps: GapItem[];
  redundancies: RedundancyItem[];
  strengths: string[];
}

export interface CategoryCostStat {
  category: string;
  totalCost: number;
  itemCount: number;
  averageCost: number;
  percentage: number;
  topItems: { name: string; brand: string; cost: number }[];
}

export interface InvestmentRatio {
  premium: { count: number; total: number; threshold: string };
  midRange: { count: number; total: number; threshold: string };
  budget: { count: number; total: number; threshold: string };
}

// New interfaces for Phase 2
export interface DuplicateGroup {
  type: string;
  color: string;
  items: ClothingItem[];
  recommendation: string;
  potentialValue: number;
}

export interface ColorGroup {
  category: 'neutrals' | 'accents' | 'statements';
  colors: { color: string; count: number; hexCode: string }[];
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
  const itemsWithFormality = items.filter(item => item.formalityLevel !== undefined);
  const itemsWithoutFormality = items.filter(item => item.formalityLevel === undefined);
  
  const casual = itemsWithFormality.filter(item => item.formalityLevel! <= 2).length;
  const smartCasual = itemsWithFormality.filter(item => item.formalityLevel === 3).length;
  const formal = itemsWithFormality.filter(item => item.formalityLevel! >= 4).length;
  
  const total = items.length;

  const distribution: FormalityDistribution[] = [
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

  // Add unassigned category if there are items without formality
  if (itemsWithoutFormality.length > 0) {
    distribution.push({
      level: 'Unassigned',
      range: 'N/A',
      count: itemsWithoutFormality.length,
      percentage: total > 0 ? (itemsWithoutFormality.length / total) * 100 : 0,
      fill: '#9CA3AF',
    });
  }

  return distribution;
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

// ===== PHASE 1: Health Dashboard & Cost Intelligence =====

// Calculate wardrobe health score
export function calculateWardrobeHealth(items: ClothingItem[]): WardrobeHealthScore {
  const gaps: GapItem[] = [];
  const redundancies: RedundancyItem[] = [];
  const strengths: string[] = [];
  let score = 100;

  // Define essential items
  const essentials = [
    { type: 'Shirt', category: 'Tops', color: 'White', priority: 'high' as const, reason: 'Versatile foundation piece' },
    { type: 'Pants', category: 'Bottoms', color: 'Black', priority: 'high' as const, reason: 'Essential for formal looks' },
    { type: 'Jeans', category: 'Bottoms', color: 'Navy', priority: 'high' as const, reason: 'Casual wardrobe staple' },
    { type: 'Sneakers', category: 'Footwear', color: 'White', priority: 'medium' as const, reason: 'Casual footwear essential' },
    { type: 'Blazer', category: 'Outerwear', color: 'Navy', priority: 'medium' as const, reason: 'Smart-casual versatility' },
  ];

  // Check for missing essentials
  essentials.forEach(essential => {
    const hasItem = items.some(item => 
      item.type === essential.type && 
      (item.color === essential.color || item.colors?.includes(essential.color as ClothingColor))
    );
    
    if (!hasItem) {
      gaps.push({
        type: `${essential.color} ${essential.type}`,
        category: essential.category,
        priority: essential.priority,
        reason: essential.reason,
      });
      score -= essential.priority === 'high' ? 10 : 5;
    }
  });

  // Check for redundancies (same type + color, quantity >= 5)
  const typeColorGroups: Record<string, ClothingItem[]> = {};
  
  items.forEach(item => {
    const key = `${item.type}|||${item.color}`;
    if (!typeColorGroups[key]) {
      typeColorGroups[key] = [];
    }
    typeColorGroups[key].push(item);
  });

  Object.entries(typeColorGroups).forEach(([key, groupItems]) => {
    const [type, color] = key.split('|||');
    
    if (groupItems.length >= 5) {
      const avgCost = groupItems.reduce((sum, item) => sum + (item.cost || 0), 0) / groupItems.length;
      
      redundancies.push({
        type,
        color,
        count: groupItems.length,
        items: groupItems,
        recommendation: avgCost < 30 
          ? `Keep 2-3, consider donating ${groupItems.length - 3}`
          : `Very similar items - consolidate collection`,
      });
      score -= 5;
    }
  });

  // Check category balance
  const categoryDist = calculateCategoryDistribution(items);
  const hasGoodBalance = categoryDist.every(cat => cat.percentage >= 10 && cat.percentage <= 40);
  if (hasGoodBalance) {
    strengths.push('Well-balanced across categories');
    score += 5;
  }

  // Check formality spread
  const formalityItems = items.filter(item => item.formalityLevel !== undefined);
  if (formalityItems.length > 0) {
    const casualCount = formalityItems.filter(item => item.formalityLevel! <= 2).length;
    const formalCount = formalityItems.filter(item => item.formalityLevel! >= 4).length;
    const casualRatio = casualCount / formalityItems.length;
    const formalRatio = formalCount / formalityItems.length;
    
    if (casualRatio >= 0.4 && casualRatio <= 0.7 && formalRatio >= 0.2 && formalRatio <= 0.4) {
      strengths.push('Great casual/formal mix');
      score += 5;
    }
  }

  // Check color diversity
  const uniqueColors = new Set(items.map(item => item.color)).size;
  if (uniqueColors >= 8) {
    strengths.push('Excellent color variety');
    score += 5;
  } else if (uniqueColors <= 3) {
    score -= 10;
  }

  return {
    overallScore: Math.max(0, Math.min(100, score)),
    gaps,
    redundancies,
    strengths,
  };
}

// Calculate cost by category with averages
export function calculateCategoryCosts(items: ClothingItem[]): CategoryCostStat[] {
  const categoryCosts: Record<string, { total: number; count: number; items: ClothingItem[] }> = {};
  
  items.forEach(item => {
    const category = item.category || 'Other';
    if (!categoryCosts[category]) {
      categoryCosts[category] = { total: 0, count: 0, items: [] };
    }
    categoryCosts[category].total += item.cost || 0;
    categoryCosts[category].count++;
    categoryCosts[category].items.push(item);
  });

  const totalValue = items.reduce((sum, item) => sum + (item.cost || 0), 0);

  // Get all top items across all categories
  const allItemsWithCost = items
    .filter(item => item.cost && item.cost > 0)
    .sort((a, b) => (b.cost || 0) - (a.cost || 0));

  return Object.entries(categoryCosts)
    .map(([category, data]) => ({
      category,
      totalCost: data.total,
      itemCount: data.count,
      averageCost: data.count > 0 ? data.total / data.count : 0,
      percentage: totalValue > 0 ? (data.total / totalValue) * 100 : 0,
      topItems: allItemsWithCost.slice(0, 3).map(item => ({
        name: item.type,
        brand: item.brand,
        cost: item.cost || 0,
      })),
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

// Calculate investment ratio
export function calculateInvestmentRatio(items: ClothingItem[]): InvestmentRatio {
  const premium = items.filter(item => (item.cost || 0) > 100);
  const midRange = items.filter(item => (item.cost || 0) >= 30 && (item.cost || 0) <= 100);
  const budget = items.filter(item => (item.cost || 0) < 30);

  const premiumTotal = premium.reduce((sum, item) => sum + (item.cost || 0), 0);
  const midRangeTotal = midRange.reduce((sum, item) => sum + (item.cost || 0), 0);
  const budgetTotal = budget.reduce((sum, item) => sum + (item.cost || 0), 0);

  return {
    premium: { count: premium.length, total: premiumTotal, threshold: '>€100' },
    midRange: { count: midRange.length, total: midRangeTotal, threshold: '€30-100' },
    budget: { count: budget.length, total: budgetTotal, threshold: '<€30' },
  };
}

// ===== PHASE 2: Duplicate Detector & Color Strategy =====

// Detect duplicate/redundant items
export function detectDuplicates(items: ClothingItem[]): DuplicateGroup[] {
  const typeColorGroups: Record<string, ClothingItem[]> = {};
  
  items.forEach(item => {
    const key = `${item.type}|||${item.color}`;
    if (!typeColorGroups[key]) {
      typeColorGroups[key] = [];
    }
    typeColorGroups[key].push(item);
  });

  const duplicates: DuplicateGroup[] = [];

  Object.entries(typeColorGroups).forEach(([key, groupItems]) => {
    const [type, color] = key.split('|||');
    const avgCost = groupItems.reduce((sum, item) => sum + (item.cost || 0), 0) / groupItems.length;
    
    // Flag cheap items with 5+ duplicates
    if (groupItems.length >= 5 && avgCost < 30) {
      const potentialValue = groupItems.slice(2).reduce((sum, item) => sum + (item.cost || 0), 0);
      
      duplicates.push({
        type,
        color,
        items: groupItems,
        recommendation: `Keep 2-3, consider donating ${groupItems.length - 3}`,
        potentialValue,
      });
    }
    
    // Flag expensive items with 3+ similar duplicates
    else if (groupItems.length >= 3) {
      // Check if they have overlapping tags (similar purpose)
      const tagOverlap = groupItems.some((item1, i) => 
        groupItems.some((item2, j) => 
          i !== j && item1.tags?.some(tag => item2.tags?.includes(tag))
        )
      );
      
      if (tagOverlap) {
        const potentialValue = groupItems.slice(1).reduce((sum, item) => sum + (item.cost || 0), 0) * 0.5;
        
        duplicates.push({
          type,
          color,
          items: groupItems,
          recommendation: `${groupItems.length} similar items - keep favorite, sell others`,
          potentialValue,
        });
      }
    }
  });

  return duplicates.sort((a, b) => b.items.length - a.items.length);
}

// Calculate color strategy with gaps and recommendations
export function calculateColorStrategy(items: ClothingItem[]): {
  groups: ColorGroup[];
  gaps: string[];
  recommendations: string[];
} {
  const colorCounts: Record<string, number> = {};
  
  // Count colors
  items.forEach(item => {
    colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
    if (item.colors && item.colors.length > 0) {
      item.colors.forEach(color => {
        colorCounts[color] = (colorCounts[color] || 0) + 0.5;
      });
    }
  });

  // Categorize colors
  const neutralColors = ['Black', 'White', 'Gray', 'Navy', 'Beige', 'Brown'];
  const accentColors = ['Blue', 'Red', 'Green'];
  const statementColors = ['Yellow', 'Orange', 'Pink', 'Purple'];

  const neutrals: ColorGroup['colors'] = [];
  const accents: ColorGroup['colors'] = [];
  const statements: ColorGroup['colors'] = [];

  Object.entries(colorCounts).forEach(([color, count]) => {
    const colorData = {
      color,
      count: Math.round(count),
      hexCode: COLOR_HEX_MAP[color as ClothingColor] || '#9CA3AF',
    };

    if (neutralColors.includes(color)) {
      neutrals.push(colorData);
    } else if (accentColors.includes(color)) {
      accents.push(colorData);
    } else if (statementColors.includes(color)) {
      statements.push(colorData);
    }
  });

  const groups: ColorGroup[] = [
    { category: 'neutrals', colors: neutrals.sort((a, b) => b.count - a.count) },
    { category: 'accents', colors: accents.sort((a, b) => b.count - a.count) },
    { category: 'statements', colors: statements.sort((a, b) => b.count - a.count) },
  ];

  // Detect gaps
  const gaps: string[] = [];
  const missingNeutrals = neutralColors.filter(c => !colorCounts[c]);
  const missingAccents = accentColors.filter(c => !colorCounts[c] || colorCounts[c] < 2);

  if (missingNeutrals.length > 0) {
    gaps.push(`Missing neutrals: ${missingNeutrals.join(', ')}`);
  }
  if (!colorCounts['Beige'] && !colorCounts['Brown']) {
    gaps.push('Missing warm neutrals (beige/brown) - limits autumn outfits');
  }
  if (missingAccents.length > 0) {
    gaps.push(`Limited accent colors: ${missingAccents.join(', ')}`);
  }

  // Generate recommendations
  const recommendations: string[] = [];
  const totalItems = items.length;
  const neutralCount = neutrals.reduce((sum, c) => sum + c.count, 0);
  const neutralRatio = neutralCount / totalItems;

  if (neutralRatio < 0.5) {
    recommendations.push('Add more neutral pieces (black, white, navy, gray) for better outfit versatility');
  } else if (neutralRatio > 0.8) {
    recommendations.push('Consider adding accent colors to break monotony and add personality');
  } else {
    recommendations.push('Good neutral/accent balance - wardrobe is versatile');
  }

  if (missingNeutrals.includes('White') || missingNeutrals.includes('Black')) {
    recommendations.push('Add black and white basics - they multiply outfit combinations');
  }

  return {
    groups,
    gaps,
    recommendations,
  };
}
