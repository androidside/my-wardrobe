import { useState } from 'react';
import { Trash2, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClothingItem } from '@/types/clothing';

interface ClothingCardProps {
  item: ClothingItem;
  imageUrl: string | null;
  onEdit: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  onView?: (item: ClothingItem) => void;
}

export function ClothingCard({ item, imageUrl, onEdit, onDelete, onView }: ClothingCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onView ? onView(item) : setShowActions(!showActions)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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

        {/* Quick actions overlay */}
        {showActions && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this item?')) {
                  onDelete(item.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Item Details */}
      <CardContent className="p-2 sm:p-3">
        <h3 className="font-semibold text-xs mb-0.5 truncate">{item.brand}</h3>
        <p className="text-xs text-gray-600 mb-1 truncate">{item.type}</p>
        <div className="flex items-center justify-between text-xs gap-1">
          <span className="text-gray-500 truncate">{item.size}</span>
          <span className="text-gray-500 truncate">{item.color}</span>
        </div>
      </CardContent>
    </Card>
  );
}
