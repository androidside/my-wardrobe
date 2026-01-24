import { Card, CardContent } from '@/components/ui/card';
import { ClothingItem } from '@/types/clothing';

interface ClothingCardProps {
  item: ClothingItem;
  imageUrl?: string | null;
  onView?: (item: ClothingItem) => void;
}

export function ClothingCard({ item, imageUrl, onView }: ClothingCardProps) {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
      onClick={() => onView && onView(item)}
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${item.brand} ${item.type}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-3xl mb-2">📷</div>
              <p className="text-sm">No image</p>
            </div>
          </div>
        )}
      </div>

      {/* Item Details */}
      <CardContent className="p-1.5 sm:p-2">
        <h3 className="font-semibold text-[10px] sm:text-xs mb-0.5 truncate">{item.brand}</h3>
        <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 truncate">{item.type}</p>
        <div className="flex items-center justify-between text-[9px] sm:text-xs gap-1">
          <span className="text-gray-500 truncate">{item.size}</span>
          <div className="text-gray-500 truncate flex items-center gap-1">
            <span>{item.color}</span>
            {item.colors && item.colors.length > 0 && (
              <span className="text-indigo-600" title={`Also: ${item.colors.join(', ')}`}>+{item.colors.length}</span>
            )}
            {item.pattern && item.pattern !== 'Solid' && (
              <span className="text-purple-600" title={`Pattern: ${item.pattern}`}>●</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
