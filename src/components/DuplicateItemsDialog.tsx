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

interface DuplicateItemsDialogProps {
  items: ClothingItem[];
  type: string;
  color: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemClick?: (item: ClothingItem) => void;
}

export function DuplicateItemsDialog({
  items,
  type,
  color,
  open,
  onOpenChange,
  onItemClick,
}: DuplicateItemsDialogProps) {
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

  // Calculate total value
  const totalValue = items.reduce((sum, item) => sum + (item.cost || 0), 0);
  const avgValue = items.length > 0 ? totalValue / items.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {items.length} {color} {type}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-gray-600">
            Total value: {formatCurrency(totalValue)} | Average: {formatCurrency(avgValue)}
          </DialogDescription>
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

            {/* Summary Info */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Brands Breakdown:</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(items.map(i => i.brand))).map(brand => {
                  const count = items.filter(i => i.brand === brand).length;
                  return (
                    <span
                      key={brand}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      {brand} ({count})
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-orange-900">
                <span className="font-semibold">💡 Recommendation:</span> Consider keeping 2-3 favorites and donating or selling the rest. 
                This could free up space and potentially recover ~{formatCurrency(totalValue * 0.5)}.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
