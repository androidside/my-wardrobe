import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCard } from './ClothingCard';
import { ClothingItem, ClothingCategory, CLOTHING_TYPES_BY_CATEGORY, getCategoryForType } from '@/types/clothing';
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

interface WardrobeGalleryProps {
  items: ClothingItem[];
  allItems: ClothingItem[]; // All items for category view
  selectedType: string | null; // Currently selected type (null = show categories, string = show items of that type)
  selectedCategory: ClothingCategory | null; // Currently selected category (controlled from parent)
  onTypeSelect: (type: string | null) => void; // Callback when type is selected
  onCategorySelect: (category: ClothingCategory | null) => void; // Callback when category is selected
  onEdit: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  onView?: (item: ClothingItem) => void;
}

export function WardrobeGallery({ items, allItems, selectedType, selectedCategory, onTypeSelect, onCategorySelect, onEdit, onDelete, onView }: WardrobeGalleryProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});
  
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
  if (selectedType === null && selectedCategory === null) {
    // Calculate stats
    const totalItems = allItems.length;
    const totalCategories = categories.length;
    const totalTypes = categories.reduce((sum, cat) => 
      sum + Object.keys(itemsByCategory[cat]).length, 0
    );

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">{totalItems}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">{totalCategories}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">{totalTypes}</div>
            <div className="text-sm text-gray-600">Types</div>
          </div>
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
    
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCategorySelect(null)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Button>

        {/* Types Grid */}
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
    );
  }

  // Show items of selected type
  const selectedItemCategory = selectedType ? (items.find(i => i.type === selectedType)?.category || getCategoryForType(selectedType)) : null;
  
  // Handle back navigation from items view to types view
  const handleBackFromItems = () => {
    // Ensure category is set before clearing the type
    // This will show the types view for that category
    if (selectedItemCategory) {
      onCategorySelect(selectedItemCategory);
    }
    // Clear the type selection - this will trigger the types view if category is set
    onTypeSelect(null);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button - goes back to types view within the category */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBackFromItems}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Types
      </Button>

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">👕</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-1.5 sm:gap-2">
          {items.map((item) => (
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
  );
}
