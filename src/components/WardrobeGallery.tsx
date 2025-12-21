import { useEffect, useState } from 'react';
import { ClothingCard } from './ClothingCard';
import { ClothingItem } from '@/types/clothing';
import { wardrobeStorageService } from '@/services/wardrobeStorage';

interface WardrobeGalleryProps {
  items: ClothingItem[];
  onEdit: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  onView?: (item: ClothingItem) => void;
}

export function WardrobeGallery({ items, onEdit, onDelete, onView }: WardrobeGalleryProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});

  // Load image URLs for all items
  useEffect(() => {
    const loadImages = async () => {
      const urls: Record<string, string | null> = {};

      for (const item of items) {
        // For Firebase Storage, imageId contains the URL directly
        const url = await wardrobeStorageService.getImageUrl(item.imageId);
        urls[item.id] = url;
      }

      setImageUrls(urls);
    };

    if (items.length > 0) {
      loadImages();
    }
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">👕</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Your wardrobe is empty</h3>
        <p className="text-gray-500">Add your first clothing item to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
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
  );
}
