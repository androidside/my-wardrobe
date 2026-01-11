import { useState, useEffect } from 'react';
import { ClothingItem, getCategoryForType } from '@/types/clothing';
import { OutfitCombination, OutfitRating, calculateOutfitRating } from '@/services/outfitRating';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Sparkles } from 'lucide-react';

interface FittingRoomProps {
  items: ClothingItem[];
}

// Helper to categorize items using the new category-based structure
function getItemCategory(item: ClothingItem): 'top' | 'bottom' | 'footwear' | 'accessory' {
  // Use item.category if available, otherwise infer from type
  const category = item.category || getCategoryForType(item.type);
  
  switch (category) {
    case 'Tops':
    case 'Outerwear': // Outerwear can be selected as top (worn over tops)
      return 'top';
    case 'Bottoms':
      return 'bottom';
    case 'Footwear':
      return 'footwear';
    case 'Accessories':
      return 'accessory';
    default:
      // Fallback: try to infer from type name
      const typeLower = item.type.toLowerCase();
      if (typeLower.includes('shoe') || typeLower.includes('boot') || typeLower.includes('sandal') || typeLower.includes('sneaker')) {
        return 'footwear';
      }
      if (typeLower.includes('pant') || typeLower.includes('jean') || typeLower.includes('short') || typeLower.includes('skirt') || typeLower.includes('dress')) {
        return 'bottom';
      }
      if (typeLower.includes('hat') || typeLower.includes('sock') || typeLower.includes('belt') || typeLower.includes('watch')) {
        return 'accessory';
      }
      return 'top';
  }
}

export function FittingRoom({ items }: FittingRoomProps) {
  const [outfit, setOutfit] = useState<OutfitCombination>({
    top: undefined,
    bottom: undefined,
    footwear: undefined,
    accessories: [],
  });
  const [rating, setRating] = useState<OutfitRating | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});

  // Load image URLs for selected items
  useEffect(() => {
    const loadImages = async () => {
      const selectedItems = [
        outfit.top,
        outfit.bottom,
        outfit.footwear,
        ...(outfit.accessories || []),
      ].filter((item): item is ClothingItem => item !== undefined);

      if (selectedItems.length === 0) {
        setImageUrls({});
        return;
      }

      const urls: Record<string, string | null> = {};

      for (const item of selectedItems) {
        try {
          const url = await wardrobeStorageService.getImageUrl(item.imageId);
          urls[item.id] = url;
        } catch (error) {
          console.error(`Failed to load image for item ${item.id}:`, error);
          urls[item.id] = null;
        }
      }

      setImageUrls(urls);
    };

    loadImages();
  }, [outfit]);

  // Calculate rating when outfit changes
  useEffect(() => {
    const newRating = calculateOutfitRating(outfit);
    setRating(newRating);
  }, [outfit]);

  // Filter items by category
  const tops = items.filter(item => getItemCategory(item) === 'top');
  const bottoms = items.filter(item => getItemCategory(item) === 'bottom');
  const footwear = items.filter(item => getItemCategory(item) === 'footwear');
  const accessories = items.filter(item => getItemCategory(item) === 'accessory');

  const handleSelectItem = (category: 'top' | 'bottom' | 'footwear', itemId: string) => {
    if (itemId === 'none') {
      setOutfit(prev => ({
        ...prev,
        [category]: undefined,
      }));
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setOutfit(prev => ({
      ...prev,
      [category]: item,
    }));
  };

  const handleSelectAccessory = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setOutfit(prev => ({
      ...prev,
      accessories: prev.accessories?.some(a => a.id === itemId)
        ? prev.accessories.filter(a => a.id !== itemId)
        : [...(prev.accessories || []), item],
    }));
  };

  const handleRemoveItem = (category: 'top' | 'bottom' | 'footwear') => {
    setOutfit(prev => ({
      ...prev,
      [category]: undefined,
    }));
  };

  const handleRemoveAccessory = (itemId: string) => {
    setOutfit(prev => ({
      ...prev,
      accessories: prev.accessories?.filter(a => a.id !== itemId) || [],
    }));
  };

  const handleClearOutfit = () => {
    setOutfit({
      top: undefined,
      bottom: undefined,
      footwear: undefined,
      accessories: [],
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-50 border-green-200';
    if (score >= 6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🚪 Fitting Room</h2>
        <p className="text-gray-600 mb-6">
          Select items from your wardrobe to create an outfit and see how well they combine.
        </p>

        {/* Outfit Builder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Top Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">Top</Label>
            <Select
              value={outfit.top?.id || 'none'}
              onValueChange={(value) => handleSelectItem('top', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a top" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tops.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.brand} - {item.type} ({item.color}{item.colors && item.colors.length > 0 ? `, ${item.colors.join(', ')}` : ''}{item.pattern && item.pattern !== 'Solid' ? `, ${item.pattern}` : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {outfit.top && (
              <div className="mt-2 relative">
                <Card className="p-2">
                  <div className="flex items-center gap-2">
                    {imageUrls[outfit.top.id] ? (
                      <img
                        src={imageUrls[outfit.top.id]!}
                        alt={outfit.top.brand}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">
                        📷
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{outfit.top.brand}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {outfit.top.type} - {outfit.top.color}
                        {outfit.top.colors && outfit.top.colors.length > 0 && `, ${outfit.top.colors.join(', ')}`}
                        {outfit.top.pattern && outfit.top.pattern !== 'Solid' && ` (${outfit.top.pattern})`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveItem('top')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Bottom Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">Bottom</Label>
            <Select
              value={outfit.bottom?.id || 'none'}
              onValueChange={(value) => handleSelectItem('bottom', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a bottom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {bottoms.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.brand} - {item.type} ({item.color}{item.colors && item.colors.length > 0 ? `, ${item.colors.join(', ')}` : ''}{item.pattern && item.pattern !== 'Solid' ? `, ${item.pattern}` : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {outfit.bottom && (
              <div className="mt-2 relative">
                <Card className="p-2">
                  <div className="flex items-center gap-2">
                    {imageUrls[outfit.bottom.id] ? (
                      <img
                        src={imageUrls[outfit.bottom.id]!}
                        alt={outfit.bottom.brand}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">
                        📷
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{outfit.bottom.brand}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {outfit.bottom.type} - {outfit.bottom.color}
                        {outfit.bottom.colors && outfit.bottom.colors.length > 0 && `, ${outfit.bottom.colors.join(', ')}`}
                        {outfit.bottom.pattern && outfit.bottom.pattern !== 'Solid' && ` (${outfit.bottom.pattern})`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveItem('bottom')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Footwear Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">Footwear</Label>
            <Select
              value={outfit.footwear?.id || 'none'}
              onValueChange={(value) => handleSelectItem('footwear', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select footwear" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {footwear.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.brand} - {item.type} ({item.color}{item.colors && item.colors.length > 0 ? `, ${item.colors.join(', ')}` : ''}{item.pattern && item.pattern !== 'Solid' ? `, ${item.pattern}` : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {outfit.footwear && (
              <div className="mt-2 relative">
                <Card className="p-2">
                  <div className="flex items-center gap-2">
                    {imageUrls[outfit.footwear.id] ? (
                      <img
                        src={imageUrls[outfit.footwear.id]!}
                        alt={outfit.footwear.brand}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">
                        📷
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{outfit.footwear.brand}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {outfit.footwear.type} - {outfit.footwear.color}
                        {outfit.footwear.colors && outfit.footwear.colors.length > 0 && `, ${outfit.footwear.colors.join(', ')}`}
                        {outfit.footwear.pattern && outfit.footwear.pattern !== 'Solid' && ` (${outfit.footwear.pattern})`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveItem('footwear')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Accessories Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">Accessories</Label>
            <Select
              value=""
              onValueChange={handleSelectAccessory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add accessories" />
              </SelectTrigger>
              <SelectContent>
                {accessories.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.brand} - {item.type} ({item.color}{item.colors && item.colors.length > 0 ? `, ${item.colors.join(', ')}` : ''}{item.pattern && item.pattern !== 'Solid' ? `, ${item.pattern}` : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {outfit.accessories && outfit.accessories.length > 0 && (
              <div className="mt-2 space-y-2">
                {outfit.accessories.map((accessory) => (
                  <Card key={accessory.id} className="p-2">
                    <div className="flex items-center gap-2">
                      {imageUrls[accessory.id] ? (
                        <img
                          src={imageUrls[accessory.id]!}
                          alt={accessory.brand}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">
                          📷
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{accessory.brand}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {accessory.type} - {accessory.color}
                          {accessory.colors && accessory.colors.length > 0 && `, ${accessory.colors.join(', ')}`}
                          {accessory.pattern && accessory.pattern !== 'Solid' && ` (${accessory.pattern})`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveAccessory(accessory.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear Button */}
        <div className="mb-6">
          <Button variant="outline" onClick={handleClearOutfit} className="w-full sm:w-auto">
            Clear Outfit
          </Button>
        </div>

        {/* Rating Display */}
        {rating && (
          <div className={`border-2 rounded-lg p-6 ${getScoreBgColor(rating.score)}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Outfit Rating</h3>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gray-600" />
                <span className={`text-3xl font-bold ${getScoreColor(rating.score)}`}>
                  {rating.score.toFixed(1)}/10
                </span>
              </div>
            </div>

            {rating.feedback.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback</h4>
                <ul className="space-y-1">
                  {rating.feedback.map((msg, idx) => (
                    <li key={idx} className="text-sm text-gray-600">• {msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {rating.strengths.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {rating.strengths.map((msg, idx) => (
                    <li key={idx} className="text-sm text-green-600">✓ {msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {rating.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-700 mb-2">Suggestions</h4>
                <ul className="space-y-1">
                  {rating.suggestions.map((msg, idx) => (
                    <li key={idx} className="text-sm text-yellow-600">💡 {msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Feedback Placeholder */}
            <div className="mt-6 pt-6 border-t border-gray-300">
              <Button
                variant="outline"
                className="w-full"
                disabled
                title="AI feedback will be available in a future update"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Feedback (Coming Soon)
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                AI-powered outfit analysis will be available soon
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

