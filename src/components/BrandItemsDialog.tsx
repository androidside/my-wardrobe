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

interface BrandItemsDialogProps {
  items: ClothingItem[];
  brand: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemClick?: (item: ClothingItem) => void;
}

export function BrandItemsDialog({
  items,
  brand,
  open,
  onOpenChange,
  onItemClick,
}: BrandItemsDialogProps) {
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

  // Group by type (top 5)
  const typeCounts: Record<string, number> = {};
  items.forEach(item => {
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  });
  const topTypes = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {brand} ({items.length} items)
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-gray-600">
            Total spent: {formatCurrency(totalValue)} | Average: {formatCurrency(avgValue)} per item
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

            {/* Statistics */}
            <div className="border-t pt-4 mt-4 space-y-4">
              {/* Category Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">By Category:</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700"
                      >
                        {category} ({count})
                      </span>
                    ))}
                </div>
              </div>

              {/* Top Types */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Most Common Items:</h3>
                <div className="flex flex-wrap gap-2">
                  {topTypes.map(([type, count]) => (
                    <span
                      key={type}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      {type} ({count})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Brand Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-purple-900">
                <span className="font-semibold">💡 Brand Insight:</span>{' '}
                You've invested {formatCurrency(totalValue)} in {brand}. 
                {avgValue > 100 
                  ? ` This is a premium brand with an average item cost of ${formatCurrency(avgValue)}.`
                  : avgValue > 50
                  ? ` This is a mid-range brand with good value for money.`
                  : ` This is a budget-friendly brand.`}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
