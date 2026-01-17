import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClothingCard } from './ClothingCard';
import { ClothingDetailsDialog } from './ClothingDetailsDialog';
import { getFriendWardrobes, getFriendClothingItems } from '@/services/social';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { Wardrobe } from '@/types/wardrobe';
import { ClothingItem } from '@/types/clothing';
import { useAuth } from '@/contexts/AuthContext';

interface FriendWardrobeViewProps {
  friendId: string;
  friendUsername: string;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Tops: '/icons/clothing/shirt.png',
  Bottoms: '/icons/clothing/pants.png',
  Footwear: '/icons/clothing/shoes.png',
  Outerwear: '/icons/clothing/jacket.png',
  Accessories: '/icons/clothing/accessories.png',
};

const CATEGORIES = [
  { value: 'all', label: 'All Items' },
  { value: 'Tops', label: 'Tops' },
  { value: 'Bottoms', label: 'Bottoms' },
  { value: 'Footwear', label: 'Footwear' },
  { value: 'Outerwear', label: 'Outerwear' },
  { value: 'Accessories', label: 'Accessories' },
];

export function FriendWardrobeView({ friendId, friendUsername, onBack }: FriendWardrobeViewProps) {
  const { user } = useAuth();
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>('');
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});

  // Load friend's wardrobes
  useEffect(() => {
    const loadWardrobes = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const friendWardrobes = await getFriendWardrobes(friendId);
        
        if (friendWardrobes.length === 0) {
          setError(`${friendUsername} hasn't shared any wardrobes yet`);
          setWardrobes([]);
          setItems([]);
        } else {
          setWardrobes(friendWardrobes);
          // Auto-select first wardrobe
          setSelectedWardrobeId(friendWardrobes[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wardrobes');
        setWardrobes([]);
      } finally {
        setLoading(false);
      }
    };

    loadWardrobes();
  }, [user, friendId, friendUsername]);

  // Load items when wardrobe changes
  useEffect(() => {
    const loadItems = async () => {
      if (!user || !selectedWardrobeId) {
        setItems([]);
        setImageUrls({});
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const friendItems = await getFriendClothingItems(friendId, selectedWardrobeId);
        setItems(friendItems);

        // Load image URLs for all items
        const urls: Record<string, string | null> = {};
        for (const item of friendItems) {
          const url = await wardrobeStorageService.getImageUrl(item.imageId);
          urls[item.id] = url;
        }
        setImageUrls(urls);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load items');
        setItems([]);
        setImageUrls({});
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [user, friendId, selectedWardrobeId]);

  // Filter items by category
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  // Group items by type when viewing a category
  const itemsByType: Record<string, ClothingItem[]> = {};
  if (selectedCategory !== 'all') {
    filteredItems.forEach(item => {
      const type = item.type || 'other';
      if (!itemsByType[type]) {
        itemsByType[type] = [];
      }
      itemsByType[type].push(item);
    });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {friendUsername}'s Wardrobe
            </h2>
            {wardrobes.length > 0 && (
              <p className="text-sm text-gray-500">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
        </div>

        {/* Wardrobe Selector (if multiple wardrobes) */}
        {wardrobes.length > 1 && (
          <Select value={selectedWardrobeId} onValueChange={setSelectedWardrobeId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select wardrobe" />
            </SelectTrigger>
            <SelectContent>
              {wardrobes.map((wardrobe) => (
                <SelectItem key={wardrobe.id} value={wardrobe.id}>
                  {wardrobe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Category Filter */}
      {wardrobes.length > 0 && items.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-gray-600 font-medium mb-2">{error}</p>
              <Button onClick={onBack} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        ) : wardrobes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-gray-600 font-medium mb-2">
                {friendUsername} hasn't shared any wardrobes yet
              </p>
              <Button onClick={onBack} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-gray-600 font-medium">
                No items in this {selectedCategory === 'all' ? 'wardrobe' : 'category'}
              </p>
            </div>
          </div>
        ) : selectedCategory === 'all' ? (
          /* Show categories as cards when "All Items" is selected */
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {CATEGORIES.filter(cat => cat.value !== 'all').map((category) => {
                const categoryItems = items.filter(item => item.category === category.value);
                if (categoryItems.length === 0) return null;

                return (
                  <div
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden aspect-square"
                  >
                    <div className="h-full flex flex-col items-center justify-center p-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3 relative">
                        <img
                          src={CATEGORY_ICONS[category.value]}
                          alt={category.label}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <h3 className="text-center font-semibold text-gray-900 text-sm sm:text-base">
                        {category.label}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Show items grouped by type when a category is selected */
          <div className="p-4">
            <div className="space-y-6">
              {Object.entries(itemsByType).map(([type, typeItems]) => (
                <div key={type}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                    {type}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {typeItems.map((item) => (
                      <ClothingCard
                        key={item.id}
                        item={item}
                        imageUrl={imageUrls[item.id] || null}
                        onView={() => setSelectedItem(item)}
                        showActions={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Item Details Dialog */}
      {selectedItem && (
        <ClothingDetailsDialog
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(open) => {
            if (!open) setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}
