import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ClothingItem } from '@/types/clothing';
import { ClothingCard } from '@/components/ClothingCard';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { formatCurrency } from '@/utils/statsUtils';

interface ColorItemsDialogProps {
  items: ClothingItem[];
  color: string;
  hexCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemClick?: (item: ClothingItem) => void;
}

export function ColorItemsDialog({
  items,
  color,
  hexCode,
  open,
  onOpenChange,
  onItemClick,
}: ColorItemsDialogProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  // Load images for all items when dialog opens
  useEffect(() => {
    let mounted = true;

    const loadImages = async () => {
      if (!open || items.length === 0) return;

      setLoading(true);
      const urls: Record<string, string | null> = {};

      await Promise.all(
        items.map(async (item) => {
          try {
            const url = await wardrobeStorageService.getImageUrl(item.imageId);
            if (mounted) {
              urls[item.id] = url;
            }
          } catch (error) {
            console.error(`Error loading image for item ${item.id}:`, error);
            if (mounted) {
              urls[item.id] = null;
            }
          }
        })
      );

      if (mounted) {
        setImageUrls(urls);
        setLoading(false);
      }
    };

    loadImages();

    return () => {
      mounted = false;
    };
  }, [items, open]);

  // Calculate statistics
  const totalValue = items.reduce((sum, item) => sum + (item.cost || 0), 0);
  const avgValue = items.length > 0 ? totalValue / items.length : 0;

  // Group by category
  const categoryCounts: Record<string, number> = {};
  items.forEach(item => {
    const category = item.category || 'Other';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          {/* Color Swatch */}
          <div
            className="w-12 h-12 rounded-full border-2 border-gray-300 flex-shrink-0 shadow-sm"
            style={{ backgroundColor: hexCode }}
          />
          <div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {color} Items ({items.length})
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-gray-600">
              Total value: {formatCurrency(totalValue)} | Average: {formatCurrency(avgValue)}
            </DialogDescription>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              {items.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  imageUrl={imageUrls[item.id]}
                  onView={onItemClick}
                />
              ))}
            </div>

            {/* Category Breakdown */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">By Category:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <span
                      key={category}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      {category} ({count})
                    </span>
                  ))}
              </div>
            </div>

            {/* Color Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">💡 Styling Tip:</span>{' '}
                {color === 'Black' || color === 'White' || color === 'Navy' || color === 'Gray' || color === 'Beige'
                  ? `${color} is a versatile neutral that pairs well with almost any color. Perfect for building a capsule wardrobe.`
                  : `${color} adds personality and can be used as an accent color. Pair with neutrals for balanced outfits.`}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
