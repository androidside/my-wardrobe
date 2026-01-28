import { useState, useEffect } from 'react';
import { ClothingItem, ClothingCategory, ClothingColor } from '@/types/clothing';
import { Wardrobe } from '@/types/wardrobe';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  calculateOverviewStats,
  calculateCategoryDistribution,
  calculateBrandStats,
  calculateWardrobeHealth,
  calculateCategoryCosts,
  calculateInvestmentRatio,
  detectDuplicates,
  calculateColorStrategy,
  getAllItemsForUser,
  formatCurrency,
  type CategoryDistribution,
  type BrandStat,
  type WardrobeHealthScore,
  type CategoryCostStat,
  type InvestmentRatio,
  type DuplicateGroup,
} from '@/utils/statsUtils';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { DuplicateItemsDialog } from '@/components/DuplicateItemsDialog';
import { ColorItemsDialog } from '@/components/ColorItemsDialog';
import { BrandItemsDialog } from '@/components/BrandItemsDialog';
import { ClothingDetailsDialog } from '@/components/ClothingDetailsDialog';

interface StatisticsViewProps {
  currentWardrobeItems: ClothingItem[];
  currentWardrobeId: string | null;
  currentWardrobeName?: string;
  wardrobes: Wardrobe[];
  userId: string;
  onFilterCategory?: (category: ClothingCategory) => void;
  onFilterColor?: (color: ClothingColor) => void;
  onNavigateToWardrobe: () => void;
}

export function StatisticsView({
  currentWardrobeId,
  wardrobes,
  userId,
  onFilterCategory,
  onNavigateToWardrobe,
}: StatisticsViewProps) {
  // Selected wardrobe ID or 'all' for all wardrobes
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>(currentWardrobeId || 'all');
  const [wardrobeItemsCache, setWardrobeItemsCache] = useState<Record<string, ClothingItem[]>>({});
  const [loading, setLoading] = useState(false);

  // Fetch items when wardrobe selection changes
  useEffect(() => {
    const loadItems = async () => {
      // If "all" is selected, fetch all items
      if (selectedWardrobeId === 'all') {
        // Always refresh "all" to ensure it's up to date
        setLoading(true);
        try {
          console.log('[Stats] Fetching all items from wardrobes:', wardrobes.map(w => w.name));
          const items = await getAllItemsForUser(userId, wardrobes);
          console.log('[Stats] Fetched total items for all wardrobes:', items.length);
          setWardrobeItemsCache(prev => ({ ...prev, all: items }));
        } catch (error) {
          console.error('Error loading all items:', error);
        } finally {
          setLoading(false);
        }
      } 
      // If specific wardrobe is selected
      else if (selectedWardrobeId) {
        // Always refresh to get latest data
        setLoading(true);
        try {
          console.log('[Stats] Fetching items for wardrobe:', selectedWardrobeId);
          const items = await wardrobeStorageService.getAllItems(userId, selectedWardrobeId);
          console.log('[Stats] Fetched items count (after migration):', items.length);
          setWardrobeItemsCache(prev => ({ ...prev, [selectedWardrobeId]: items }));
        } catch (error) {
          console.error('Error loading wardrobe items:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadItems();
  }, [selectedWardrobeId, userId, wardrobes]);

  // Determine which items to display based on selection
  const displayItems = wardrobeItemsCache[selectedWardrobeId] || [];

  // Calculate all statistics
  const overviewStats = calculateOverviewStats(displayItems);
  const categoryDistribution = calculateCategoryDistribution(displayItems);
  const brandStats = calculateBrandStats(displayItems);
  
  // NEW: Phase 1 & 2 statistics
  const wardrobeHealth = calculateWardrobeHealth(displayItems);
  const categoryCosts = calculateCategoryCosts(displayItems);
  const investmentRatio = calculateInvestmentRatio(displayItems);
  const duplicates = detectDuplicates(displayItems);
  const colorStrategy = calculateColorStrategy(displayItems);

  // Handle chart interactions
  const handleCategoryClick = (data: CategoryDistribution) => {
    if (onFilterCategory) {
      onFilterCategory(data.category as ClothingCategory);
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
        {/* Header with Wardrobe Selector */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Wardrobe Insights</h1>
          
          <div className="min-w-[200px]">
            <Select
              value={selectedWardrobeId}
              onValueChange={setSelectedWardrobeId}
            >
              <SelectTrigger className="bg-white shadow">
                <SelectValue placeholder="Select wardrobe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wardrobes</SelectItem>
                {wardrobes.map((wardrobe) => (
                  <SelectItem key={wardrobe.id} value={wardrobe.id}>
                    {wardrobe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading statistics...</p>
          </div>
        ) : (
          <>
            {/* PHASE 1: Health Dashboard */}
            <HealthDashboardSection healthScore={wardrobeHealth} />

            {/* PHASE 1: Cost Intelligence */}
            <CostIntelligenceSection
              categoryCosts={categoryCosts}
              investmentRatio={investmentRatio}
              totalValue={overviewStats.totalValue}
              totalItems={overviewStats.totalItems}
            />

            {/* PHASE 2: Duplicate Detector */}
            <DuplicateDetectorSection duplicates={duplicates} />

            {/* PHASE 2: Color Strategy (replaces old ColorSection) */}
            <ColorStrategySection colorStrategy={colorStrategy} allItems={displayItems} />

            {/* Keep existing sections */}
            <CategorySection 
              data={categoryDistribution} 
              onCategoryClick={handleCategoryClick} 
            />

            {/* Brand Analysis */}
            <BrandSection 
              data={brandStats} 
              allItems={displayItems}
            />
          </>
        )}
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
            data={data as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) => {
              const { category, percentage } = props;
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

// Brand Section Component
function BrandSection({ 
  data, 
  allItems,
}: { 
  data: BrandStat[]; 
  allItems: ClothingItem[];
}) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleBrandClick = (brand: string) => {
    setSelectedBrand(brand);
    setBrandDialogOpen(true);
  };

  const handleItemClick = (item: ClothingItem) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  // Filter items by selected brand
  const filteredItems = selectedBrand
    ? allItems.filter(item => item.brand === selectedBrand)
    : [];

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Brands</h2>
        <p className="text-sm text-gray-600 mb-4">
          Click any brand to see all items:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((brand) => (
            <button
              key={brand.brand}
              onClick={() => handleBrandClick(brand.brand)}
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

      {/* Brand Items Dialog */}
      {selectedBrand && (
        <BrandItemsDialog
          items={filteredItems}
          brand={selectedBrand}
          open={brandDialogOpen}
          onOpenChange={setBrandDialogOpen}
          onItemClick={handleItemClick}
        />
      )}

      {/* Item Details Dialog */}
      <ClothingDetailsDialog
        item={selectedItem}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </>
  );
}

// ===== PHASE 1: NEW COMPONENTS =====

// Health Dashboard Section
function HealthDashboardSection({ healthScore }: { healthScore: WardrobeHealthScore }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Wardrobe Health Score</h2>
        <div className="flex items-center gap-2">
          <div className="text-5xl font-bold text-indigo-600">{healthScore.overallScore}</div>
          <div className="text-lg text-gray-600">/100</div>
        </div>
      </div>

      {/* Alerts - Gaps */}
      {healthScore.gaps.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-2">
                Missing Basics: {healthScore.gaps.length} gap{healthScore.gaps.length > 1 ? 's' : ''} found
              </h3>
              <ul className="space-y-1">
                {healthScore.gaps.map((gap, idx) => (
                  <li key={idx} className="text-sm text-red-800">
                    • No {gap.type}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Redundancies */}
      {healthScore.redundancies.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                Redundancy: Consider decluttering
              </h3>
              <ul className="space-y-1">
                {healthScore.redundancies.map((red, idx) => (
                  <li key={idx} className="text-sm text-yellow-800">
                    • {red.count} {red.color} {red.type} ({red.recommendation})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Strengths */}
      {healthScore.strengths.length > 0 && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 mb-2">
                Well-balanced:
              </h3>
              <ul className="space-y-1">
                {healthScore.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-green-800">
                    • {strength}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Cost Intelligence Section
function CostIntelligenceSection({
  categoryCosts,
  investmentRatio,
  totalValue,
  totalItems,
}: {
  categoryCosts: CategoryCostStat[];
  investmentRatio: InvestmentRatio;
  totalValue: number;
  totalItems: number;
}) {
  const overallAvg = totalItems > 0 ? totalValue / totalItems : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Spending Analysis</h2>
      
      {/* Total Summary */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-2xl font-bold text-indigo-600">{formatCurrency(totalValue)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Items</div>
            <div className="text-2xl font-bold text-indigo-600">{totalItems}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Average</div>
            <div className="text-2xl font-bold text-indigo-600">{formatCurrency(overallAvg)}/item</div>
          </div>
        </div>
      </div>

      {/* By Category with bars */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">By Category</h3>
        <div className="space-y-3">
          {categoryCosts.map(cat => (
            <div key={cat.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{cat.category}</span>
                <span className="text-gray-600">
                  {formatCurrency(cat.totalCost)} | Avg: {formatCurrency(cat.averageCost)} ({cat.itemCount}x)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all" 
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Investment Ratio */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Investment Ratio</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Premium (&gt;€100)</div>
            <div className="text-2xl font-bold text-purple-600">{investmentRatio.premium.count}</div>
            <div className="text-sm text-gray-600 mt-1">{formatCurrency(investmentRatio.premium.total)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalValue > 0 ? Math.round((investmentRatio.premium.total / totalValue) * 100) : 0}% of budget
            </div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Mid-range (€30-100)</div>
            <div className="text-2xl font-bold text-blue-600">{investmentRatio.midRange.count}</div>
            <div className="text-sm text-gray-600 mt-1">{formatCurrency(investmentRatio.midRange.total)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalValue > 0 ? Math.round((investmentRatio.midRange.total / totalValue) * 100) : 0}% of budget
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Budget (&lt;€30)</div>
            <div className="text-2xl font-bold text-gray-600">{investmentRatio.budget.count}</div>
            <div className="text-sm text-gray-600 mt-1">{formatCurrency(investmentRatio.budget.total)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalValue > 0 ? Math.round((investmentRatio.budget.total / totalValue) * 100) : 0}% of budget
            </div>
          </div>
        </div>
      </div>

      {/* Most Expensive Items */}
      {categoryCosts[0]?.topItems && categoryCosts[0].topItems.length > 0 && (
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Most expensive items:</h3>
          <ol className="space-y-2">
            {categoryCosts[0].topItems.slice(0, 3).map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex justify-between">
                <span>
                  {i + 1}. {item.brand} {item.name}
                </span>
                <span className="font-semibold">{formatCurrency(item.cost)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ===== PHASE 2: NEW COMPONENTS =====

// Duplicate Detector Section
function DuplicateDetectorSection({ duplicates }: { duplicates: DuplicateGroup[] }) {
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleDuplicateClick = (dup: DuplicateGroup) => {
    setSelectedDuplicate(dup);
    setDialogOpen(true);
  };

  const handleItemClick = (item: ClothingItem) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  if (duplicates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Redundancy Analysis</h2>
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <p className="text-gray-600">No significant redundancies detected!</p>
          <p className="text-sm text-gray-500 mt-1">Your wardrobe is well-curated.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Redundancy Analysis</h2>
        <p className="text-sm text-gray-600 mb-4">
          Similar items detected - click any card to see details:
        </p>
        
        <div className="space-y-4">
          {duplicates.map((dup, idx) => (
            <button
              key={idx}
              onClick={() => handleDuplicateClick(dup)}
              className="w-full text-left border-l-4 border-orange-500 pl-4 py-2 bg-orange-50 rounded-r hover:bg-orange-100 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-gray-900 mb-1">
                {dup.items.length} {dup.color} {dup.type}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Brands: {dup.items.map(i => i.brand).slice(0, 5).join(', ')}
                {dup.items.length > 5 && ` +${dup.items.length - 5} more`}
              </div>
              <div className="text-sm text-orange-700 font-medium">
                💡 {dup.recommendation}
              </div>
              {dup.potentialValue > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Potential value to recover: ~{formatCurrency(dup.potentialValue)}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Duplicate Items Dialog */}
      {selectedDuplicate && (
        <DuplicateItemsDialog
          items={selectedDuplicate.items}
          type={selectedDuplicate.type}
          color={selectedDuplicate.color}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onItemClick={handleItemClick}
        />
      )}

      {/* Item Details Dialog */}
      <ClothingDetailsDialog
        item={selectedItem}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </>
  );
}

// Color Strategy Section
function ColorStrategySection({
  colorStrategy,
  allItems,
}: {
  colorStrategy: ReturnType<typeof calculateColorStrategy>;
  allItems: ClothingItem[];
}) {
  const [selectedColor, setSelectedColor] = useState<{ color: string; hexCode: string } | null>(null);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleColorClick = (color: string, hexCode: string) => {
    setSelectedColor({ color, hexCode });
    setColorDialogOpen(true);
  };

  const handleItemClick = (item: ClothingItem) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  // Filter items by selected color (including items with that color in secondary colors)
  const filteredItems = selectedColor
    ? allItems.filter(
        item =>
          item.color === selectedColor.color ||
          (item.colors && item.colors.includes(selectedColor.color as any))
      )
    : [];

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Color Strategy</h2>
        <p className="text-sm text-gray-600 mb-4">
          Click any color to see all items in that color:
        </p>

        {/* Neutrals */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">NEUTRALS (Foundation) ✅</h3>
          <div className="flex flex-wrap gap-4">
            {colorStrategy.groups.find(g => g.category === 'neutrals')?.colors.map(c => (
              <button
                key={c.color}
                onClick={() => handleColorClick(c.color, c.hexCode)}
                className="text-center transition-transform hover:scale-110"
              >
                <div
                  className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm font-bold shadow-sm hover:shadow-lg cursor-pointer"
                  style={{
                    backgroundColor: c.hexCode,
                    color: c.color === 'White' || c.color === 'Beige' ? '#000' : '#FFF',
                  }}
                >
                  {c.count}
                </div>
                <div className="text-xs text-gray-700 mt-1 font-medium">{c.color}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Colors */}
        {colorStrategy.groups.find(g => g.category === 'accents')?.colors && 
         colorStrategy.groups.find(g => g.category === 'accents')!.colors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">ACCENT COLORS</h3>
            <div className="flex flex-wrap gap-4">
              {colorStrategy.groups.find(g => g.category === 'accents')?.colors.map(c => (
                <button
                  key={c.color}
                  onClick={() => handleColorClick(c.color, c.hexCode)}
                  className="text-center transition-transform hover:scale-110"
                >
                  <div
                    className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-white shadow-sm hover:shadow-lg cursor-pointer"
                    style={{ backgroundColor: c.hexCode }}
                  >
                    {c.count}
                  </div>
                  <div className="text-xs text-gray-700 mt-1 font-medium">{c.color}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Statement Colors */}
        {colorStrategy.groups.find(g => g.category === 'statements')?.colors && 
         colorStrategy.groups.find(g => g.category === 'statements')!.colors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">STATEMENT COLORS</h3>
            <div className="flex flex-wrap gap-3">
              {colorStrategy.groups.find(g => g.category === 'statements')?.colors.map(c => (
                <button
                  key={c.color}
                  onClick={() => handleColorClick(c.color, c.hexCode)}
                  className="text-center transition-transform hover:scale-110"
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-white shadow-sm hover:shadow-lg cursor-pointer"
                    style={{ backgroundColor: c.hexCode }}
                  >
                    {c.count}
                  </div>
                  <div className="text-xs text-gray-700 mt-1 font-medium">{c.color}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gaps */}
        {colorStrategy.gaps.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Gaps Detected:</h3>
            <ul className="text-sm space-y-1 text-yellow-800">
              {colorStrategy.gaps.map((gap, idx) => (
                <li key={idx}>• {gap}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {colorStrategy.recommendations.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Recommendation:</h3>
            <p className="text-sm text-blue-800">{colorStrategy.recommendations[0]}</p>
          </div>
        )}
      </div>

      {/* Color Items Dialog */}
      {selectedColor && (
        <ColorItemsDialog
          items={filteredItems}
          color={selectedColor.color}
          hexCode={selectedColor.hexCode}
          open={colorDialogOpen}
          onOpenChange={setColorDialogOpen}
          onItemClick={handleItemClick}
        />
      )}

      {/* Item Details Dialog */}
      <ClothingDetailsDialog
        item={selectedItem}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </>
  );
}
