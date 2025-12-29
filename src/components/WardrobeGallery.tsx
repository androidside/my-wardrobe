import { useEffect, useState } from 'react';
import { ClothingCard } from './ClothingCard';
import { ClothingItem, ClothingType } from '@/types/clothing';
import { wardrobeStorageService } from '@/services/wardrobeStorage';

// Emoji mapping for clothing types (used as fallback)
const TYPE_EMOJIS: Record<ClothingType, string> = {
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
const getTypeIconPath = (type: ClothingType): string => {
  // Map clothing type to file name (handle special cases)
  const fileNameMap: Record<ClothingType, string> = {
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
  selectedType: ClothingType | null; // Currently selected type category
  onTypeSelect: (type: ClothingType | null) => void; // Callback when type is selected
  onEdit: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  onView?: (item: ClothingItem) => void;
}

export function WardrobeGallery({ items, allItems, selectedType, onTypeSelect, onEdit, onDelete, onView }: WardrobeGalleryProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});

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

  // Group items by type for category view
  const itemsByType = allItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<ClothingType, ClothingItem[]>);

  const types = Object.keys(itemsByType).sort() as ClothingType[];

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

  // Show category view when no type is selected
  if (selectedType === null) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
          {types.map((type) => {
            const typeItems = itemsByType[type];
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
    );
  }

  // Show items of selected type
  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => onTypeSelect(null)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <span className="text-xl">←</span>
        <span className="font-medium">Back to Categories</span>
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
