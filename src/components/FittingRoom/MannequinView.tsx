import { ClothingItem } from '@/types/clothing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowUp, ArrowDown } from 'lucide-react';

interface LayeredOutfit {
  base: ClothingItem[];
  mid: ClothingItem[];
  outer: ClothingItem[];
  bottoms: ClothingItem[];
  footwear?: ClothingItem;
  accessories: ClothingItem[];
}

interface MannequinViewProps {
  outfit: LayeredOutfit;
  imageUrls: Record<string, string | null>;
  onRemove: (category: keyof LayeredOutfit, itemId: string) => void;
  onReorder: (category: keyof LayeredOutfit, itemId: string, direction: 'up' | 'down') => void;
}

export function MannequinView({ outfit, imageUrls, onRemove, onReorder }: MannequinViewProps) {
  const renderLayerStack = (items: ClothingItem[], category: keyof LayeredOutfit, label: string) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-600 text-center">{label}</p>
        <div className="flex flex-col-reverse gap-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="relative group"
              style={{
                zIndex: index,
                marginTop: index > 0 ? '-40px' : '0',
              }}
            >
              <Card className="w-32 h-32 overflow-hidden border-2 border-gray-300 bg-white hover:border-blue-400 transition-all">
                {imageUrls[item.id] ? (
                  <img
                    src={imageUrls[item.id]!}
                    alt={item.brand}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-4xl">
                    📷
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <p className="text-white text-xs font-semibold text-center px-2 truncate w-full">
                    {item.brand}
                  </p>
                  <p className="text-white text-xs text-center px-2 truncate w-full">
                    {item.type}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {index > 0 && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6"
                        onClick={() => onReorder(category, item.id, 'up')}
                        title="Move closer to skin"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                    )}
                    {index < items.length - 1 && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6"
                        onClick={() => onReorder(category, item.id, 'down')}
                        title="Move to outer layer"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-6 w-6"
                      onClick={() => onRemove(category, item.id)}
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSingleItem = (item: ClothingItem | undefined, category: keyof LayeredOutfit, label: string) => {
    if (!item) return null;

    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-600 text-center">{label}</p>
        <div className="relative group">
          <Card className="w-32 h-32 overflow-hidden border-2 border-gray-300 bg-white hover:border-blue-400 transition-all">
            {imageUrls[item.id] ? (
              <img
                src={imageUrls[item.id]!}
                alt={item.brand}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-4xl">
                📷
              </div>
            )}
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <p className="text-white text-xs font-semibold text-center px-2 truncate w-full">
                {item.brand}
              </p>
              <p className="text-white text-xs text-center px-2 truncate w-full">
                {item.type}
              </p>
              <Button
                size="icon"
                variant="destructive"
                className="h-6 w-6 mt-1"
                onClick={() => onRemove(category, item.id)}
                title="Remove"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderAccessories = () => {
    if (outfit.accessories.length === 0) return null;

    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600 text-center">Accessories</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {outfit.accessories.map((item) => (
            <div key={item.id} className="relative group">
              <Card className="w-16 h-16 overflow-hidden border-2 border-gray-300 bg-white hover:border-blue-400 transition-all">
                {imageUrls[item.id] ? (
                  <img
                    src={imageUrls[item.id]!}
                    alt={item.brand}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-2xl">
                    📷
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6"
                    onClick={() => onRemove('accessories', item.id)}
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hasUpperBody = outfit.base.length > 0 || outfit.mid.length > 0 || outfit.outer.length > 0;
  const hasBottoms = outfit.bottoms.length > 0;
  const hasFootwear = !!outfit.footwear;
  const hasAccessories = outfit.accessories.length > 0;

  if (!hasUpperBody && !hasBottoms && !hasFootwear && !hasAccessories) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="w-32 h-48 border-4 border-dashed border-gray-300 rounded-full mb-4 flex items-center justify-center">
          <span className="text-6xl">👤</span>
        </div>
        <p className="text-sm">Add items to see your outfit</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      {/* Upper Body Layers */}
      {hasUpperBody && (
        <div className="flex flex-col items-center">
          {[
            { items: outfit.base, label: 'Base Layer', key: 'base' as keyof LayeredOutfit },
            { items: outfit.mid, label: 'Mid Layer', key: 'mid' as keyof LayeredOutfit },
            { items: outfit.outer, label: 'Outer Layer', key: 'outer' as keyof LayeredOutfit },
          ].map(({ items, label, key }) => 
            items.length > 0 && renderLayerStack(items, key, label)
          )}
        </div>
      )}

      {/* Bottoms */}
      {hasBottoms && renderLayerStack(outfit.bottoms, 'bottoms', 'Bottoms')}

      {/* Footwear */}
      {hasFootwear && renderSingleItem(outfit.footwear, 'footwear', 'Footwear')}

      {/* Accessories */}
      {hasAccessories && renderAccessories()}
    </div>
  );
}
