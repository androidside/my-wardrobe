import { useEffect, useState } from 'react';
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
  onTypeSelect: (type: string | null) => void; // Callback when type is selected
  onEdit: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  onView?: (item: ClothingItem) => void;
}

export function WardrobeGallery({ items, allItems, selectedType, onTypeSelect, onEdit, onDelete, onView }: WardrobeGalleryProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | null>(null);

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
      <div className="text-center py-16">
        <div className="text-6xl mb-4">👕</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Your wardrobe is empty</h3>
        <p className="text-gray-500">Add your first clothing item to get started!</p>
      </div>
    );
  }

  // Reset selectedCategory when selectedType changes externally
  useEffect(() => {
    if (selectedType === null) {
      setSelectedCategory(null);
    }
  }, [selectedType]);

  // Show category view when no type is selected and no category is selected
  if (selectedType === null && selectedCategory === null) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((category) => {
            // Get all items in this category
            const categoryItems = Object.values(itemsByCategory[category]).flat();
            const totalItems = categoryItems.length;
            const firstItem = categoryItems[0];
            const previewImageUrl = firstItem ? (imageUrls[firstItem.id] || null) : null;
            
            // Get icon path for category (use first type in category as representative)
            const categoryTypes = CLOTHING_TYPES_BY_CATEGORY[category];
            const representativeType = categoryTypes[0] || 'Other';
            
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200"
              >
                <div className="aspect-square relative bg-white overflow-hidden">
                  {previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt={category}
                      className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                  ) : null}
                  <img
                    src={getTypeIconPath(representativeType)}
                    alt={category}
                    className="absolute inset-0 w-full h-full object-contain p-3 z-10"
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
                    className="absolute inset-0 hidden items-center justify-center text-4xl sm:text-5xl z-10 bg-white"
                    style={{ display: 'none' }}
                  >
                    {TYPE_EMOJIS[representativeType] || '👕'}
                  </span>
                  <div className="absolute inset-0 bg-transparent group-hover:bg-black/40 transition-opacity z-20 pointer-events-none" />
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{category}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Back to Categories</span>
        </button>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedCategory}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
            {categoryTypes.map((type) => {
              const typeItems = itemsByCategory[selectedCategory][type];
              const firstItem = typeItems[0];
              const previewImageUrl = imageUrls[firstItem.id] || null;
              
              return (
                <button
                  key={type}
                  onClick={() => onTypeSelect(type)}
                  className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200"
                >
                  <div className="aspect-square relative bg-white overflow-hidden">
                    {previewImageUrl ? (
                      <img
                        src={previewImageUrl}
                        alt={type}
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                      />
                    ) : null}
                    <img
                      src={getTypeIconPath(type)}
                      alt={type}
                      className="absolute inset-0 w-full h-full object-contain p-2 z-10"
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
                      className="absolute inset-0 hidden items-center justify-center text-3xl sm:text-4xl z-10 bg-white"
                      style={{ display: 'none' }}
                    >
                      {TYPE_EMOJIS[type] || '👕'}
                    </span>
                    <div className="absolute inset-0 bg-transparent group-hover:bg-black/40 transition-opacity z-20 pointer-events-none" />
                  </div>
                  <div className="p-2 text-center">
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{type}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
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
  
  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => {
          setSelectedCategory(selectedItemCategory);
          onTypeSelect(null);
        }}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <span className="text-xl">←</span>
        <span className="font-medium">Back to {selectedItemCategory || 'Categories'}</span>
      </button>

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👕</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
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
