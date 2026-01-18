import { useState, useEffect } from 'react';
import { ClothingItem, ClothingCategory, ClothingColor } from '@/types/clothing';
import { Wardrobe } from '@/types/wardrobe';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  calculateOverviewStats,
  calculateCategoryDistribution,
  calculateColorDistribution,
  calculateBrandStats,
  calculateFormalityDistribution,
  calculateTagStats,
  getAllItemsForUser,
  formatCurrency,
  type OverviewStats,
  type CategoryDistribution,
  type ColorStat,
  type BrandStat,
  type FormalityDistribution,
  type TagStat,
} from '@/utils/statsUtils';
import { TrendingUp, DollarSign, ShoppingBag, Tag } from 'lucide-react';

interface StatisticsViewProps {
  currentWardrobeItems: ClothingItem[];
  currentWardrobeId: string | null;
  currentWardrobeName?: string;
  wardrobes: Wardrobe[];
  userId: string;
  onFilterCategory?: (category: ClothingCategory) => void;
  onFilterColor?: (color: ClothingColor) => void;
  onFilterBrand?: (brand: string) => void;
  onNavigateToWardrobe: () => void;
}

export function StatisticsView({
  currentWardrobeItems,
  currentWardrobeId,
  currentWardrobeName,
  wardrobes,
  userId,
  onFilterCategory,
  onFilterColor,
  onFilterBrand,
  onNavigateToWardrobe,
}: StatisticsViewProps) {
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current');
  const [allItems, setAllItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all items when switching to "all" mode
  useEffect(() => {
    if (viewMode === 'all' && allItems.length === 0) {
      setLoading(true);
      getAllItemsForUser(userId, wardrobes)
        .then(items => {
          setAllItems(items);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading all items:', error);
          setLoading(false);
        });
    }
  }, [viewMode, userId, wardrobes, allItems.length]);

  // Determine which items to display
  const displayItems = viewMode === 'current' ? currentWardrobeItems : allItems;

  // Calculate all statistics
  const overviewStats = calculateOverviewStats(displayItems);
  const categoryDistribution = calculateCategoryDistribution(displayItems);
  const colorStats = calculateColorDistribution(displayItems);
  const brandStats = calculateBrandStats(displayItems);
  const formalityDistribution = calculateFormalityDistribution(displayItems);
  const tagStats = calculateTagStats(displayItems);

  // Debug logging
  console.log('Stats - displayItems count:', displayItems.length);
  console.log('Stats - colorStats:', colorStats);

  // Handle chart interactions
  const handleCategoryClick = (data: CategoryDistribution) => {
    if (onFilterCategory) {
      onFilterCategory(data.category as ClothingCategory);
      onNavigateToWardrobe();
    }
  };

  const handleColorClick = (data: ColorStat) => {
    if (onFilterColor) {
      onFilterColor(data.color as ClothingColor);
      onNavigateToWardrobe();
    }
  };

  const handleBrandClick = (brand: string) => {
    if (onFilterBrand) {
      onFilterBrand(brand);
      onNavigateToWardrobe();
    }
  };

  // Empty state
  if (displayItems.length < 3 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Wardrobe Insights</h1>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Not Enough Data Yet
              </h2>
              <p className="text-gray-600 mb-4">
                Add at least 3 items to your wardrobe to see detailed insights and statistics about your collection.
              </p>
              <p className="text-sm text-gray-500">
                Once you have more items, you'll see breakdowns by category, color, brand, style, and more!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Wardrobe Insights</h1>
          
          <div className="flex items-center gap-3 bg-white rounded-lg shadow px-4 py-2">
            <Label htmlFor="view-mode" className="text-sm font-medium text-gray-700">
              {viewMode === 'current' 
                ? currentWardrobeName || 'Current' 
                : 'All Wardrobes'}
            </Label>
            <Switch
              id="view-mode"
              checked={viewMode === 'all'}
              onCheckedChange={(checked) => setViewMode(checked ? 'all' : 'current')}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading statistics...</p>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <OverviewSection stats={overviewStats} />

            {/* Category Distribution */}
            <CategorySection 
              data={categoryDistribution} 
              onCategoryClick={handleCategoryClick} 
            />

            {/* Color Palette */}
            <ColorSection 
              data={colorStats} 
              onColorClick={handleColorClick} 
            />

            {/* Brand Analysis */}
            <BrandSection 
              data={brandStats} 
              onBrandClick={handleBrandClick} 
            />

            {/* Style Analysis */}
            <StyleSection 
              formalityData={formalityDistribution} 
              tagData={tagStats} 
            />
          </>
        )}
      </div>
    </div>
  );
}

// Overview Section Component
function OverviewSection({ stats }: { stats: OverviewStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-2">
          <ShoppingBag className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="text-3xl font-bold text-indigo-600">{stats.totalItems}</div>
        <div className="text-sm text-gray-600 mt-1">Total Items</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-2">
          <DollarSign className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="text-3xl font-bold text-indigo-600">{formatCurrency(stats.totalValue)}</div>
        <div className="text-sm text-gray-600 mt-1">Total Value</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="text-3xl font-bold text-indigo-600">{formatCurrency(stats.averageCost)}</div>
        <div className="text-sm text-gray-600 mt-1">Avg Cost</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-2">
          <Tag className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="text-3xl font-bold text-indigo-600">{stats.uniqueBrands}</div>
        <div className="text-sm text-gray-600 mt-1">Brands</div>
      </div>
    </div>
  );
}

// Category Section Component
function CategorySection({ 
  data, 
  onCategoryClick 
}: { 
  data: CategoryDistribution[]; 
  onCategoryClick: (data: CategoryDistribution) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">By Category</h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ category, percentage, cx, cy, midAngle, innerRadius, outerRadius }) => {
              // Hide labels on very small screens
              if (window.innerWidth < 640) {
                return null;
              }
              // Show abbreviated labels on mobile
              if (window.innerWidth < 768) {
                return `${percentage.toFixed(0)}%`;
              }
              // Full labels on desktop
              return `${category}: ${percentage.toFixed(0)}%`;
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
            onClick={(entry) => onCategoryClick(entry)}
            style={{ cursor: 'pointer', fontSize: '12px' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} items`} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend with percentages for all screens */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
        {data.map((item) => (
          <div key={item.category} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-gray-700">
              {item.category}: {item.count} ({item.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Color Section Component
function ColorSection({ 
  data, 
  onColorClick 
}: { 
  data: ColorStat[]; 
  onColorClick: (data: ColorStat) => void;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Color Palette</h2>
        <p className="text-center text-gray-500 py-8">
          No color data available. Add items to your wardrobe to see color distribution.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Color Palette</h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="color" />
          <YAxis />
          <Tooltip 
            formatter={(value) => `${value} items`}
            labelFormatter={(label) => `Color: ${label}`}
          />
          <Bar 
            dataKey="count" 
            onClick={(entry) => onColorClick(entry)}
            style={{ cursor: 'pointer' }}
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.hexCode}
                stroke={entry.color === 'White' ? '#E5E7EB' : 'none'}
                strokeWidth={entry.color === 'White' ? 1 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Brand Section Component
function BrandSection({ 
  data, 
  onBrandClick 
}: { 
  data: BrandStat[]; 
  onBrandClick: (brand: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Brands</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((brand) => (
          <button
            key={brand.brand}
            onClick={() => onBrandClick(brand.brand)}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 text-left hover:shadow-md transition-shadow"
          >
            <div className="font-semibold text-gray-900 text-lg mb-2">{brand.brand}</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>{brand.itemCount} items</div>
              <div>{formatCurrency(brand.totalSpent)} total</div>
              <div className="text-xs text-gray-500">
                Avg: {formatCurrency(brand.averageCost)}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {data.length === 0 && (
        <p className="text-center text-gray-500 py-4">No brand data available</p>
      )}
    </div>
  );
}

// Style Section Component
function StyleSection({ 
  formalityData, 
  tagData 
}: { 
  formalityData: FormalityDistribution[]; 
  tagData: TagStat[];
}) {
  // Check if there's any formality data
  const hasFormalityData = formalityData.some(item => item.count > 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Style Analysis</h2>
      
      {/* Formality Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Formality Distribution</h3>
        {hasFormalityData ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={formalityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} items`} />
              <Legend />
              <Bar dataKey="count" name="Items">
                {formalityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No formality data available. Make sure your items have formality levels set.
          </p>
        )}
      </div>
      
      {/* Tags */}
      {tagData.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Most Used Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tagData.map((tag) => (
              <div
                key={tag.tag}
                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
              >
                {tag.tag} ({tag.count})
              </div>
            ))}
          </div>
        </div>
      )}
      
      {tagData.length === 0 && (
        <p className="text-center text-gray-500 text-sm">
          No tags found. Add tags to your items to see style insights.
        </p>
      )}
    </div>
  );
}
