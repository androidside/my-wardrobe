import { useEffect, useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ClothingCard } from './ClothingCard';
import { ClothingItem, ClothingCategory, ClothingColor, ClothingTag, CLOTHING_TYPES_BY_CATEGORY, getCategoryForType } from '@/types/clothing';
import { wardrobeStorageService } from '@/services/wardrobeStorage';

// Emoji mapping for clothing types (used as fallback)
const TYPE_EMOJIS: Record<string, string> = {
  'T-shirt': '👕',
  'Shirt': '👔',
  'Jacket': '🧥',
  'Coat': '🧥',
  'Sweater': '🧶',
  'Hoodie': '👕',
  'Pants': '👖',
  'Jeans': '👖',
  'Shorts': '🩳',
  'Skirt': '👗',
  'Dress': '👗',
  'Shoes': '👞',
  'Sneakers': '👟',
  'Boots': '🥾',
  'Sandals': '🩴',
  'Hat': '🧢',
  'Socks': '🧦',
  'Underwear': '🩲',
  'Accessories': '🧤',
  'Other': '👕',
};

// Helper function to get icon path for clothing type
const getTypeIconPath = (type: string): string => {
  // Map clothing type to file name (handle special cases)
  const fileNameMap: Record<string, string> = {
    'T-shirt': 'tshirt',
    'Shirt': 'shirt',
    'Jacket': 'jacket',
    'Coat': 'coat',
    'Sweater': 'sweater',
    'Hoodie': 'hoodie',
    'Pants': 'pants',
    'Jeans': 'jeans',
    'Shorts': 'shorts',
    'Skirt': 'skirt',
    'Dress': 'dress',
    'Shoes': 'shoes',
    'Sneakers': 'sneakers',
    'Boots': 'boots',
    'Sandals': 'sandals',
    'Hat': 'hat',
    'Socks': 'socks',
    'Underwear': 'underwear',
    'Accessories': 'accessories',
    'Other': 'other',
  };
  
  return `/icons/clothing/${fileNameMap[type]}.png`;
};

// Color mapping for filter pills
const COLOR_HEX_MAP: Record<ClothingColor, string> = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Gray': '#808080',
  'Navy': '#000080',
  'Blue': '#0000FF',
  'Red': '#FF0000',
  'Green': '#008000',
  'Yellow': '#FFFF00',
  'Orange': '#FFA500',
  'Pink': '#FFC0CB',
  'Purple': '#800080',
  'Brown': '#8B4513',
  'Beige': '#F5F5DC',
  'Multicolor': 'linear-gradient(135deg, #FF0000 0%, #FFFF00 25%, #00FF00 50%, #0000FF 75%, #FF00FF 100%)',
  'Other': '#CCCCCC',
};

// Helper function to determine text color based on background color
const getContrastColor = (hexColor: string): string => {
  // Handle multicolor gradient
  if (hexColor.startsWith('linear-gradient')) {
    return '#FFFFFF'; // White text for multicolor
  }
  
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

interface WardrobeGalleryProps {
  items: ClothingItem[];
  allItems: ClothingItem[]; // All items for category view
  selectedType: string | null; // Currently selected type (null = show categories, string = show items of that type)
  selectedCategory: ClothingCategory | null; // Currently selected category (controlled from parent)
  selectedBrand: string | null; // Currently selected brand for filtering
  selectedTag: ClothingTag | null; // Currently selected tag for filtering
  viewMode: 'all-items' | 'brands' | 'tags' | null; // View mode for overview navigation
  onTypeSelect: (type: string | null) => void; // Callback when type is selected
  onCategorySelect: (category: ClothingCategory | null) => void; // Callback when category is selected
  onBrandSelect: (brand: string | null) => void; // Callback when brand is selected
  onTagSelect: (tag: ClothingTag | null) => void; // Callback when tag is selected
  onViewModeChange: (mode: 'all-items' | 'brands' | 'tags' | null) => void; // Callback for view mode changes
  onEdit: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  onView?: (item: ClothingItem) => void;
}

export function WardrobeGallery({ 
  items, 
  allItems, 
  selectedType, 
  selectedCategory, 
  selectedBrand,
  selectedTag,
  viewMode,
  onTypeSelect, 
  onCategorySelect, 
  onBrandSelect,
  onTagSelect,
  onViewModeChange,
  onEdit, 
  onDelete, 
  onView 
}: WardrobeGalleryProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<ClothingColor | null>(null);
  
  // When a type is selected, remember its category for navigation
  // This ensures we can go back to the types view when clicking back from items view
  useEffect(() => {
    if (selectedType) {
      // Find the category for the selected type
      const typeCategory = items.find(i => i.type === selectedType)?.category || getCategoryForType(selectedType);
      // Always set the category to match the selected type
      // This ensures proper navigation when going back from items view
      onCategorySelect(typeCategory);
    }
  }, [selectedType, items, onCategorySelect]);

  // Load image URLs for all items
  useEffect(() => {
    const loadImages = async () => {
      const urls: Record<string, string | null> = {};

      const itemsToLoad = selectedType ? items : allItems;
      for (const item of itemsToLoad) {
        // For Firebase Storage, imageId contains the URL directly
        const url = await wardrobeStorageService.getImageUrl(item.imageId);
        urls[item.id] = url;
      }

      setImageUrls(urls);
    };

    if (allItems.length > 0) {
      loadImages();
    }
  }, [items, allItems, selectedType]);

  // Group items by category, then by type
  const itemsByCategory = allItems.reduce((acc, item) => {
    // Get category (use item.category if available, otherwise infer from type)
    const category = item.category || getCategoryForType(item.type);
    
    if (!acc[category]) {
      acc[category] = {};
    }
    
    if (!acc[category][item.type]) {
      acc[category][item.type] = [];
    }
    
    acc[category][item.type].push(item);
    return acc;
  }, {} as Record<ClothingCategory, Record<string, ClothingItem[]>>);

  // Get all categories that have items
  const categories = Object.keys(itemsByCategory).sort() as ClothingCategory[];

  // Show empty state
  if (allItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">👕</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wardrobe is empty</h3>
          <p className="text-gray-600">Add your first clothing item to get started!</p>
        </div>
      </div>
    );
  }

  // Show category view when no type is selected and no category is selected
  if (selectedType === null && selectedCategory === null && viewMode === null && selectedBrand === null && selectedTag === null) {
    // Calculate stats
    const totalItems = allItems.length;
    const uniqueBrands = Array.from(new Set(allItems.map(item => item.brand))).length;
    const uniqueTags = Array.from(new Set(allItems.flatMap(item => item.tags || []))).length;

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar - Clickable Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => onViewModeChange('all-items')}
            className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <div className="text-3xl font-bold text-indigo-600">{totalItems}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </button>
          <button
            onClick={() => onViewModeChange('brands')}
            className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <div className="text-3xl font-bold text-indigo-600">{uniqueBrands}</div>
            <div className="text-sm text-gray-600">Brands</div>
          </button>
          <button
            onClick={() => onViewModeChange('tags')}
            className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <div className="text-3xl font-bold text-indigo-600">{uniqueTags}</div>
            <div className="text-sm text-gray-600">Styles</div>
          </button>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            // Get all items in this category
            const categoryItems = Object.values(itemsByCategory[category]).flat();
            const totalItems = categoryItems.length;
            
            // Get icon path for category (use first type in category as representative)
            const categoryTypes = CLOTHING_TYPES_BY_CATEGORY[category];
            const representativeType = categoryTypes[0] || 'Other';
            
            return (
              <button
                key={category}
                onClick={() => onCategorySelect(category)}
                className="group bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col aspect-square"
              >
                {/* Icon area with subtle gradient background */}
                <div className="flex-1 relative bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden flex items-center justify-center">
                  <img
                    src={getTypeIconPath(representativeType)}
                    alt={category}
                    className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      // If image fails to load, replace with emoji
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const emojiSpan = target.nextElementSibling as HTMLElement;
                      if (emojiSpan) {
                        emojiSpan.style.display = 'flex';
                      }
                    }}
                  />
                  <span 
                    className="absolute inset-0 hidden items-center justify-center text-5xl"
                    style={{ display: 'none' }}
                  >
                    {TYPE_EMOJIS[representativeType] || '👕'}
                  </span>
                </div>
                {/* Text area with border separator */}
                <div className="p-4 text-center bg-white border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{category}</h3>
                  <p className="text-sm text-gray-600">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Show types within selected category
  if (selectedCategory !== null && selectedType === null) {
    const categoryTypes = Object.keys(itemsByCategory[selectedCategory]).sort();
    const totalItems = categoryTypes.reduce((sum, type) => sum + itemsByCategory[selectedCategory][type].length, 0);
    
    return (
      <div className="pb-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => onCategorySelect(null)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">{selectedCategory}</span>
              </button>
              <span className="text-sm text-gray-500">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>

        {/* Types Grid */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categoryTypes.map((type) => {
              const typeItems = itemsByCategory[selectedCategory][type];
              
              return (
                <button
                  key={type}
                  onClick={() => onTypeSelect(type)}
                  className="group bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col aspect-square"
                >
                  {/* Icon area with subtle gradient background */}
                  <div className="flex-1 relative bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden flex items-center justify-center">
                    <img
                      src={getTypeIconPath(type)}
                      alt={type}
                      className="w-full h-full object-contain p-5 group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const emojiSpan = target.nextElementSibling as HTMLElement;
                        if (emojiSpan) {
                          emojiSpan.style.display = 'flex';
                        }
                      }}
                    />
                    <span 
                      className="absolute inset-0 hidden items-center justify-center text-4xl"
                      style={{ display: 'none' }}
                    >
                      {TYPE_EMOJIS[type] || '👕'}
                    </span>
                  </div>
                  {/* Text area with border separator */}
                  <div className="p-3 text-center bg-white border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{type}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {typeItems.length} {typeItems.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show items of selected type
  const selectedItemCategory = selectedType ? (items.find(i => i.type === selectedType)?.category || getCategoryForType(selectedType)) : null;

  // ========================================
  // NEW VIEW MODES
  // ========================================

  // ALL ITEMS VIEW - Show all items with search and filters
  if (viewMode === 'all-items') {
    // Filter all items based on search and color
    const filteredAllItems = allItems.filter(item => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.type.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.color.toLowerCase().includes(query) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)));
        if (!matchesSearch) return false;
      }
      
      // Color filter
      if (selectedColor && item.color !== selectedColor) {
        return false;
      }
      
      return true;
    });

    // Get available colors for filter pills
    const allColors = Array.from(new Set(allItems.map(item => item.color))) as ClothingColor[];
    const sortedAllColors = allColors.sort();

    return (
      <div className="pb-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => {
                  onViewModeChange(null);
                  setSearchQuery('');
                  setSelectedColor(null);
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">All Items</span>
              </button>
              <span className="text-sm text-gray-500">
                {filteredAllItems.length} {filteredAllItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Color Filter Pills */}
          {sortedAllColors.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-xs text-gray-500 whitespace-nowrap">Colors:</span>
                {sortedAllColors.map((color) => {
                  const isSelected = selectedColor === color;
                  const hexColor = COLOR_HEX_MAP[color];
                  const isMulticolor = color === 'Multicolor';
                  
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(isSelected ? null : color)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 ${
                          isSelected ? 'border-white' : 'border-gray-300'
                        } ${color === 'White' ? 'shadow-sm' : ''}`}
                        style={{
                          background: isMulticolor ? hexColor : hexColor,
                        }}
                      />
                      <span>{color}</span>
                    </button>
                  );
                })}
                {selectedColor && (
                  <button
                    onClick={() => setSelectedColor(null)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Items Grid */}
          {filteredAllItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAllItems.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  imageUrl={imageUrls[item.id!] || null}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // BRANDS LIST VIEW - Show all brands
  if (viewMode === 'brands') {
    // Calculate brands with counts
    const brandCounts = allItems.reduce((acc, item) => {
      acc[item.brand] = (acc[item.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort brands by item count (descending)
    const brands = Object.keys(brandCounts).sort((a, b) => brandCounts[b] - brandCounts[a]);

    return (
      <div className="pb-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => onViewModeChange(null)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Brands</span>
              </button>
              <span className="text-sm text-gray-500">
                {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
              </span>
            </div>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {brands.map((brand) => {
              const itemCount = brandCounts[brand];
              
              return (
                <button
                  key={brand}
                  onClick={() => {
                    onBrandSelect(brand);
                    onViewModeChange(null);
                  }}
                  className="group bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col aspect-square"
                >
                  {/* Gradient area with icon */}
                  <div className="flex-1 relative bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-4xl">🏷️</span>
                  </div>
                  {/* Text area */}
                  <div className="p-4 text-center bg-white border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">{brand}</h3>
                    <p className="text-sm text-gray-600">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // TAGS/STYLES LIST VIEW - Show all tags
  if (viewMode === 'tags') {
    // Calculate tags with counts
    const tagCounts = allItems.reduce((acc, item) => {
      if (item.tags) {
        item.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    // Sort tags by item count (descending)
    const tags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]) as ClothingTag[];

    return (
      <div className="pb-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => onViewModeChange(null)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Styles</span>
              </button>
              <span className="text-sm text-gray-500">
                {tags.length} {tags.length === 1 ? 'style' : 'styles'}
              </span>
            </div>
          </div>
        </div>

        {/* Tags Grid */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {tags.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏷️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No styles tagged yet</h3>
              <p className="text-gray-600">Add tags to your items to organize them by style!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tags.map((tag) => {
                const itemCount = tagCounts[tag];
                
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      onTagSelect(tag);
                      onViewModeChange(null);
                    }}
                    className="group bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col aspect-square"
                  >
                    {/* Gradient area with icon */}
                    <div className="flex-1 relative bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                      <span className="text-4xl">✨</span>
                    </div>
                    {/* Text area */}
                    <div className="p-4 text-center bg-white border-t border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">{tag}</h3>
                      <p className="text-sm text-gray-600">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ITEMS BY BRAND VIEW - Show items filtered by selected brand
  if (selectedBrand !== null) {
    // Filter items by brand, search, and color
    const brandItems = allItems.filter(item => {
      // Filter by brand
      if (item.brand !== selectedBrand) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.type.toLowerCase().includes(query) ||
          item.color.toLowerCase().includes(query) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)));
        if (!matchesSearch) return false;
      }
      
      // Color filter
      if (selectedColor && item.color !== selectedColor) {
        return false;
      }
      
      return true;
    });

    // Get available colors for this brand
    const brandColors = Array.from(new Set(allItems.filter(i => i.brand === selectedBrand).map(i => i.color))) as ClothingColor[];
    const sortedBrandColors = brandColors.sort();

    return (
      <div className="pb-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => {
                  onBrandSelect(null);
                  onViewModeChange('brands');
                  setSearchQuery('');
                  setSelectedColor(null);
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">{selectedBrand}</span>
              </button>
              <span className="text-sm text-gray-500">
                {brandItems.length} {brandItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Color Filter Pills */}
          {sortedBrandColors.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-xs text-gray-500 whitespace-nowrap">Colors:</span>
                {sortedBrandColors.map((color) => {
                  const isSelected = selectedColor === color;
                  const hexColor = COLOR_HEX_MAP[color];
                  const isMulticolor = color === 'Multicolor';
                  
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(isSelected ? null : color)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 ${
                          isSelected ? 'border-white' : 'border-gray-300'
                        } ${color === 'White' ? 'shadow-sm' : ''}`}
                        style={{
                          background: isMulticolor ? hexColor : hexColor,
                        }}
                      />
                      <span>{color}</span>
                    </button>
                  );
                })}
                {selectedColor && (
                  <button
                    onClick={() => setSelectedColor(null)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Items Grid */}
          {brandItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {brandItems.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  imageUrl={imageUrls[item.id!] || null}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ITEMS BY TAG VIEW - Show items filtered by selected tag
  if (selectedTag !== null) {
    // Filter items by tag, search, and color
    const tagItems = allItems.filter(item => {
      // Filter by tag
      if (!item.tags || !item.tags.includes(selectedTag)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.type.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.color.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Color filter
      if (selectedColor && item.color !== selectedColor) {
        return false;
      }
      
      return true;
    });

    // Get available colors for this tag
    const tagColors = Array.from(new Set(allItems.filter(i => i.tags?.includes(selectedTag)).map(i => i.color))) as ClothingColor[];
    const sortedTagColors = tagColors.sort();

    return (
      <div className="pb-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => {
                  onTagSelect(null);
                  onViewModeChange('tags');
                  setSearchQuery('');
                  setSelectedColor(null);
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">{selectedTag}</span>
              </button>
              <span className="text-sm text-gray-500">
                {tagItems.length} {tagItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Color Filter Pills */}
          {sortedTagColors.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-xs text-gray-500 whitespace-nowrap">Colors:</span>
                {sortedTagColors.map((color) => {
                  const isSelected = selectedColor === color;
                  const hexColor = COLOR_HEX_MAP[color];
                  const isMulticolor = color === 'Multicolor';
                  
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(isSelected ? null : color)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 ${
                          isSelected ? 'border-white' : 'border-gray-300'
                        } ${color === 'White' ? 'shadow-sm' : ''}`}
                        style={{
                          background: isMulticolor ? hexColor : hexColor,
                        }}
                      />
                      <span>{color}</span>
                    </button>
                  );
                })}
                {selectedColor && (
                  <button
                    onClick={() => setSelectedColor(null)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Items Grid */}
          {tagItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tagItems.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  imageUrl={imageUrls[item.id!] || null}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // EXISTING TYPE VIEW (when selectedType is set)
  // ========================================
  
  // Handle back navigation from items view to types view
  const handleBackFromItems = () => {
    // Clear filters when going back
    setSearchQuery('');
    setSelectedColor(null);
    
    // Ensure category is set before clearing the type
    // This will show the types view for that category
    if (selectedItemCategory) {
      onCategorySelect(selectedItemCategory);
    }
    // Clear the type selection - this will trigger the types view if category is set
    onTypeSelect(null);
  };
  
  // Filter items based on type, search, and color
  const filteredItems = items.filter(item => {
    // First filter by selected type (most important!)
    if (selectedType && item.type !== selectedType) {
      return false;
    }
    
    // Search filter (search in brand, color, tags)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.brand.toLowerCase().includes(query) ||
        item.color.toLowerCase().includes(query) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)));
      
      if (!matchesSearch) return false;
    }
    
    // Color filter
    if (selectedColor && item.color !== selectedColor) {
      return false;
    }
    
    return true;
  });
  
  // Get unique colors from current items for filter pills
  const availableColors = Array.from(new Set(items.map(item => item.color))) as ClothingColor[];
  const sortedColors = availableColors.sort();
  
  return (
    <div className="pb-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Bar */}
          <div className="flex items-center justify-between h-14">
            <button
              onClick={handleBackFromItems}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">{selectedType}</span>
            </button>
            <span className="text-sm text-gray-500">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          {/* Search and Filters */}
          <div className="py-3 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by brand, color, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Color Filter Pills */}
            {sortedColors.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-xs text-gray-500 whitespace-nowrap">Colors:</span>
                {sortedColors.map((color) => {
                  const isSelected = selectedColor === color;
                  const hexColor = COLOR_HEX_MAP[color];
                  const isMulticolor = color === 'Multicolor';
                  
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(isSelected ? null : color)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 ${
                          isSelected ? 'border-white' : 'border-gray-300'
                        } ${color === 'White' ? 'shadow-sm' : ''}`}
                        style={{
                          background: isMulticolor ? hexColor : hexColor,
                        }}
                      />
                      <span>{color}</span>
                    </button>
                  );
                })}
                {selectedColor && (
                  <button
                    onClick={() => setSelectedColor(null)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {filteredItems.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedColor 
                  ? 'Try adjusting your search or filters' 
                  : 'No items in this category'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-1.5 sm:gap-2">
            {filteredItems.map((item) => (
              <ClothingCard
                key={item.id}
                item={item}
                imageUrl={imageUrls[item.id] || null}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
