import { useState, useEffect } from 'react';
import { ClothingItem, getCategoryForType } from '@/types/clothing';
import { OutfitCombination, OutfitRating, calculateOutfitRating } from '@/services/outfitRating';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { LayerSection } from './LayerSection';
import { ItemPickerDialog } from './ItemPickerDialog';
import { MannequinView } from './MannequinView';
import { OutfitPreview } from './OutfitPreview';
import { RatingPanel } from './RatingPanel';
import { Button } from '@/components/ui/button';
import { Trash2, Monitor, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

interface FittingRoomProps {
  items: ClothingItem[];
}

interface LayeredOutfit {
  base: ClothingItem[];
  mid: ClothingItem[];
  outer: ClothingItem[];
  bottoms: ClothingItem[];
  footwear?: ClothingItem;
  accessories: ClothingItem[];
}

type LayerCategory = 'base' | 'mid' | 'outer' | 'bottoms' | 'footwear' | 'accessories';

// Helper to categorize items
function getItemCategory(item: ClothingItem): 'top' | 'bottom' | 'footwear' | 'accessory' {
  const category = item.category || getCategoryForType(item.type);
  
  switch (category) {
    case 'Tops':
    case 'Outerwear':
      return 'top';
    case 'Bottoms':
      return 'bottom';
    case 'Footwear':
      return 'footwear';
    case 'Accessories':
      return 'accessory';
    default:
      const typeLower = item.type.toLowerCase();
      if (typeLower.includes('shoe') || typeLower.includes('boot') || typeLower.includes('sandal') || typeLower.includes('sneaker')) {
        return 'footwear';
      }
      if (typeLower.includes('pant') || typeLower.includes('jean') || typeLower.includes('short') || typeLower.includes('skirt') || typeLower.includes('dress')) {
        return 'bottom';
      }
      return 'accessory';
  }
}

// Determine which layer a top belongs to
function getTopLayer(item: ClothingItem): 'base' | 'mid' | 'outer' {
  const type = item.type.toLowerCase();
  const category = item.category;
  
  // Base layer (closest to skin)
  if (type.includes('tank') || type.includes('t-shirt') || type.includes('undershirt') || type.includes('long sleeve')) {
    return 'base';
  }
  
  // Outer layer (jackets, coats)
  if (category === 'Outerwear' || 
      type.includes('jacket') || type.includes('coat') || type.includes('blazer') || 
      type.includes('cardigan') || type.includes('windbreaker') || type.includes('parka') || 
      type.includes('bomber') || type.includes('trench')) {
    return 'outer';
  }
  
  // Mid layer (everything else)
  return 'mid';
}

export function FittingRoom({ items }: FittingRoomProps) {
  const [layeredOutfit, setLayeredOutfit] = useState<LayeredOutfit>({
    base: [],
    mid: [],
    outer: [],
    bottoms: [],
    footwear: undefined,
    accessories: [],
  });
  
  const [rating, setRating] = useState<OutfitRating | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCategory, setPickerCategory] = useState<LayerCategory>('base');
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setViewMode(window.innerWidth >= 768 ? 'desktop' : 'mobile');
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load image URLs for selected items
  useEffect(() => {
    const loadImages = async () => {
      const selectedItems = [
        ...layeredOutfit.base,
        ...layeredOutfit.mid,
        ...layeredOutfit.outer,
        ...layeredOutfit.bottoms,
        layeredOutfit.footwear,
        ...layeredOutfit.accessories,
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
  }, [layeredOutfit]);

  // Convert layered outfit to OutfitCombination for rating
  useEffect(() => {
    const outfitForRating: OutfitCombination = {
      top: [...layeredOutfit.base, ...layeredOutfit.mid, ...layeredOutfit.outer][0],
      bottom: layeredOutfit.bottoms[0],
      footwear: layeredOutfit.footwear,
      accessories: layeredOutfit.accessories,
    };

    const newRating = calculateOutfitRating(outfitForRating);
    setRating(newRating);
  }, [layeredOutfit]);

  // Filter items by category
  const tops = items.filter(item => getItemCategory(item) === 'top');
  const bottoms = items.filter(item => getItemCategory(item) === 'bottom');
  const footwear = items.filter(item => getItemCategory(item) === 'footwear');
  const accessories = items.filter(item => getItemCategory(item) === 'accessory');

  // Get available items for picker
  const getPickerItems = (): ClothingItem[] => {
    switch (pickerCategory) {
      case 'base':
      case 'mid':
      case 'outer':
        return tops;
      case 'bottoms':
        return bottoms;
      case 'footwear':
        return footwear;
      case 'accessories':
        return accessories;
      default:
        return [];
    }
  };

  // Get excluded item IDs for picker
  const getExcludedIds = (): string[] => {
    const category = pickerCategory;
    if (category === 'footwear') {
      return layeredOutfit.footwear ? [layeredOutfit.footwear.id] : [];
    }
    return layeredOutfit[category].map(item => item.id);
  };

  // Handle opening picker
  const handleOpenPicker = (category: LayerCategory) => {
    setPickerCategory(category);
    setPickerOpen(true);
  };

  // Handle item selection
  const handleSelectItem = (item: ClothingItem) => {
    const category = pickerCategory;
    
    if (category === 'footwear') {
      setLayeredOutfit(prev => ({ ...prev, footwear: item }));
    } else if (category === 'base' || category === 'mid' || category === 'outer') {
      // For tops, determine which layer it should go to
      const targetLayer = getTopLayer(item);
      setLayeredOutfit(prev => ({
        ...prev,
        [targetLayer]: [...prev[targetLayer], item],
      }));
    } else {
      setLayeredOutfit(prev => ({
        ...prev,
        [category]: [...prev[category] as ClothingItem[], item],
      }));
    }
  };

  // Handle item removal
  const handleRemoveItem = (category: LayerCategory, itemId: string) => {
    if (category === 'footwear') {
      setLayeredOutfit(prev => ({ ...prev, footwear: undefined }));
    } else {
      setLayeredOutfit(prev => ({
        ...prev,
        [category]: (prev[category] as ClothingItem[]).filter(item => item.id !== itemId),
      }));
    }
  };

  // Handle reordering
  const handleReorder = (category: LayerCategory, itemId: string, direction: 'up' | 'down') => {
    if (category === 'footwear') return;
    
    setLayeredOutfit(prev => {
      const items = [...(prev[category] as ClothingItem[])];
      const index = items.findIndex(item => item.id === itemId);
      
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return prev;
      
      // Swap items
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      
      return {
        ...prev,
        [category]: items,
      };
    });
  };

  // Clear outfit
  const handleClearOutfit = () => {
    setLayeredOutfit({
      base: [],
      mid: [],
      outer: [],
      bottoms: [],
      footwear: undefined,
      accessories: [],
    });
  };

  // Check if outfit has any items
  const hasItems = Object.values(layeredOutfit).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined
  );

  // Convert for OutfitPreview
  const previewOutfit: OutfitCombination = {
    top: [...layeredOutfit.base, ...layeredOutfit.mid, ...layeredOutfit.outer][0],
    bottom: layeredOutfit.bottoms[0],
    footwear: layeredOutfit.footwear,
    accessories: layeredOutfit.accessories,
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Outfit Preview - Sticky at top */}
      <OutfitPreview outfit={previewOutfit} rating={rating} imageUrls={imageUrls} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🚪 Fitting Room</h2>
          <p className="text-gray-600">
            Build your outfit by layering items together
          </p>
          
          {/* View Mode Toggle (for testing) */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Smartphone className="h-4 w-4 inline mr-1" />
              Mobile View
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Monitor className="h-4 w-4 inline mr-1" />
              Desktop View
            </button>
          </div>
        </div>

        {/* Mobile View: Layer Sections */}
        {viewMode === 'mobile' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <LayerSection
              title="BASE LAYER"
              description="Items worn closest to skin"
              items={tops}
              selectedItems={layeredOutfit.base}
              imageUrls={imageUrls}
              onAdd={() => handleOpenPicker('base')}
              onRemove={(id) => handleRemoveItem('base', id)}
              onReorder={(id, dir) => handleReorder('base', id, dir)}
              allowMultiple={true}
            />

            <LayerSection
              title="MID LAYER"
              description="Shirts, sweaters, hoodies"
              items={tops}
              selectedItems={layeredOutfit.mid}
              imageUrls={imageUrls}
              onAdd={() => handleOpenPicker('mid')}
              onRemove={(id) => handleRemoveItem('mid', id)}
              onReorder={(id, dir) => handleReorder('mid', id, dir)}
              allowMultiple={true}
            />

            <LayerSection
              title="OUTER LAYER"
              description="Jackets, coats, blazers"
              items={tops}
              selectedItems={layeredOutfit.outer}
              imageUrls={imageUrls}
              onAdd={() => handleOpenPicker('outer')}
              onRemove={(id) => handleRemoveItem('outer', id)}
              onReorder={(id, dir) => handleReorder('outer', id, dir)}
              allowMultiple={true}
            />

            <LayerSection
              title="BOTTOMS"
              description="Pants, jeans, skirts"
              items={bottoms}
              selectedItems={layeredOutfit.bottoms}
              imageUrls={imageUrls}
              onAdd={() => handleOpenPicker('bottoms')}
              onRemove={(id) => handleRemoveItem('bottoms', id)}
              onReorder={(id, dir) => handleReorder('bottoms', id, dir)}
              allowMultiple={false}
            />

            <LayerSection
              title="FOOTWEAR"
              description="Shoes, boots, sneakers"
              items={footwear}
              selectedItems={layeredOutfit.footwear ? [layeredOutfit.footwear] : []}
              imageUrls={imageUrls}
              onAdd={() => handleOpenPicker('footwear')}
              onRemove={(id) => handleRemoveItem('footwear', id)}
              allowMultiple={false}
            />

            <LayerSection
              title="ACCESSORIES"
              description="Watches, belts, bags, jewelry"
              items={accessories}
              selectedItems={layeredOutfit.accessories}
              imageUrls={imageUrls}
              onAdd={() => handleOpenPicker('accessories')}
              onRemove={(id) => handleRemoveItem('accessories', id)}
              allowMultiple={true}
            />
          </div>
        )}

        {/* Desktop View: Mannequin */}
        {viewMode === 'desktop' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mannequin Display */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                Your Outfit
              </h3>
              <MannequinView
                outfit={layeredOutfit}
                imageUrls={imageUrls}
                onRemove={handleRemoveItem}
                onReorder={handleReorder}
              />
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Add Items
                </h3>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenPicker('base')}
                >
                  + Base Layer ({layeredOutfit.base.length})
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenPicker('mid')}
                >
                  + Mid Layer ({layeredOutfit.mid.length})
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenPicker('outer')}
                >
                  + Outer Layer ({layeredOutfit.outer.length})
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenPicker('bottoms')}
                >
                  + Bottoms ({layeredOutfit.bottoms.length})
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenPicker('footwear')}
                >
                  + Footwear {layeredOutfit.footwear && '✓'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenPicker('accessories')}
                >
                  + Accessories ({layeredOutfit.accessories.length})
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Rating Panel */}
        {rating && (
          <div className="mt-8 max-w-2xl mx-auto">
            <RatingPanel rating={rating} />
          </div>
        )}
      </div>

      {/* Item Picker Dialog */}
      <ItemPickerDialog
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        items={getPickerItems()}
        title={`Select ${pickerCategory.replace('_', ' ')}`}
        onSelect={handleSelectItem}
        excludeIds={getExcludedIds()}
      />

      {/* Floating Clear Button */}
      {hasItems && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-6 right-6 z-30"
        >
          <Button
            size="lg"
            variant="destructive"
            onClick={handleClearOutfit}
            className="rounded-full shadow-2xl hover:scale-110 transition-transform"
            title="Clear outfit (Esc)"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Clear All
          </Button>
        </motion.div>
      )}
    </div>
  );
}
