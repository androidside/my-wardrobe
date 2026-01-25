import { OutfitCombination, OutfitRating } from '@/services/outfitRating';
import { Sparkles } from 'lucide-react';

interface OutfitPreviewProps {
  outfit: OutfitCombination;
  rating: OutfitRating | null;
  imageUrls: Record<string, string | null>;
}

export function OutfitPreview({ outfit, rating, imageUrls }: OutfitPreviewProps) {
  const selectedItems = [
    { item: outfit.top, label: 'Top' },
    { item: outfit.bottom, label: 'Bottom' },
    { item: outfit.footwear, label: 'Footwear' },
  ];

  const accessoryCount = outfit.accessories?.length || 0;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-300';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-red-600 bg-red-50 border-red-300';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 9) return '🔥';
    if (score >= 8) return '⭐';
    if (score >= 7) return '👍';
    if (score >= 6) return '👌';
    if (score >= 5) return '🤔';
    return '😕';
  };

  // Count selected items
  const selectedCount = [outfit.top, outfit.bottom, outfit.footwear].filter(Boolean).length + accessoryCount;

  return (
    <div className="sticky top-0 z-20 backdrop-blur-lg bg-white/95 border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Outfit Items Preview */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto">
            {selectedItems.map(({ item, label }) => (
              <div key={label} className="flex flex-col items-center min-w-[80px]">
                <div
                  className={`w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden ${
                    item
                      ? 'bg-white border-2 border-blue-400 shadow-md'
                      : 'bg-gray-100 border-2 border-dashed border-gray-300'
                  }`}
                >
                  {item && imageUrls[item.id] ? (
                    <img
                      src={imageUrls[item.id]!}
                      alt={item.brand}
                      className="w-full h-full object-cover"
                    />
                  ) : item ? (
                    <span className="text-2xl">📷</span>
                  ) : (
                    <span className="text-2xl text-gray-300">?</span>
                  )}
                </div>
                <span className="text-xs text-gray-600 mt-1 font-medium">{label}</span>
              </div>
            ))}

            {/* Accessories Summary */}
            {accessoryCount > 0 && (
              <div className="flex flex-col items-center min-w-[80px]">
                <div className="w-16 h-16 rounded-lg bg-purple-100 border-2 border-purple-400 shadow-md flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl">👜</span>
                    <div className="text-xs font-bold text-purple-900">+{accessoryCount}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 mt-1 font-medium">
                  {accessoryCount === 1 ? 'Accessory' : 'Accessories'}
                </span>
              </div>
            )}

            {/* Empty State Hint */}
            {selectedCount === 0 && (
              <div className="text-center py-2 text-gray-500 text-sm italic">
                Swipe through items below to build your outfit
              </div>
            )}
          </div>

          {/* Score Badge */}
          {rating && selectedCount > 0 && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold transition-all ${getScoreColor(
                rating.score
              )}`}
            >
              <Sparkles className="h-5 w-5" />
              <div className="flex flex-col items-center">
                <span className="text-2xl leading-none">
                  {rating.score.toFixed(1)}
                </span>
                <span className="text-xs opacity-75">/10</span>
              </div>
              <span className="text-2xl">{getScoreEmoji(rating.score)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
