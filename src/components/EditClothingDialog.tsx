import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PhotoCapture } from './PhotoCapture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClothingItem,
  ClothingItemInput,
  ClothingCategory,
  ClothingTag,
  ClothingSize,
  ClothingColor,
  ClothingPattern,
  FormalityLevel,
  REGULAR_SIZES,
  SHOE_SIZES,
  isFootwearType,
  formatShoeSize,
  CLOTHING_TYPES_BY_CATEGORY,
  getCategoryForType,
} from '@/types/clothing';
import { storageService } from '@/utils/storage';
import { BRAND_LIST } from '@/data/brands';
import { useWardrobeContext } from '@/contexts/WardrobeContext';

// Available tags - comprehensive list
const AVAILABLE_TAGS: ClothingTag[] = [
  // Occasion-based
  'Work/Office',
  'Formal Event',
  'Party/Night Out',
  'Vacation',
  'Travel',
  'Home/Lounge',
  'Business Casual',
  'Family Event',
  'Date Night',
  // Activity-based
  'Sport/Active',
  'Gym/Training',
  'Yoga/Stretch',
  'Outdoor',
  'Swim/Beach',
  'Winter Sports',
  'Running',
  'Cycling',
  // Season/Weather
  'Summer',
  'Winter',
  'Spring/Fall',
  'Rainy Day',
  'Hot Weather',
  'Cold Weather',
  // Style/Vibe
  'Trendy',
  'Streetwear',
  'Minimalist',
  'Bold/Statement',
  'Classic',
  'Edgy',
  'Romantic',
  'Vintage',
  'Casual',
  // Comfort/Fit
  'Cozy/Comfort',
  'Stretchy',
  'Lightweight',
  'Warm',
  'Breathable',
  'Relaxed Fit',
];

const COLORS: ClothingColor[] = [
  'Black',
  'White',
  'Gray',
  'Navy',
  'Blue',
  'Red',
  'Green',
  'Yellow',
  'Orange',
  'Pink',
  'Purple',
  'Brown',
  'Beige',
  'Multicolor',
  'Other',
];

interface EditClothingDialogProps {
  item: ClothingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<ClothingItemInput>, wardrobeId?: string) => Promise<any>;
  existingItems?: Array<{ brand: string }>; // Optional: existing wardrobe items for brand suggestions
}

export function EditClothingDialog({
  item,
  open,
  onOpenChange,
  onUpdate,
  existingItems = [],
}: EditClothingDialogProps) {
  const { wardrobes } = useWardrobeContext();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState<ClothingCategory | ''>('');
  const [type, setType] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<ClothingTag[]>([]);
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState<ClothingSize>('M');
  const [color, setColor] = useState<ClothingColor>('Black');
  const [selectedColors, setSelectedColors] = useState<ClothingColor[]>([]);
  const [pattern, setPattern] = useState<ClothingPattern>('Solid');
  const [cost, setCost] = useState('');
  const [formalityLevel, setFormalityLevel] = useState<FormalityLevel>(3);
  const [notes, setNotes] = useState('');
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Brand autocomplete state
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter brands based on input - combine BRAND_LIST with user's existing brands
  useEffect(() => {
    if (brand.trim().length > 0) {
      // Get unique brands from existing items
      const existingBrands = Array.from(new Set(
        existingItems.map((item: { brand: string }) => item.brand).filter((b: string | undefined): b is string => Boolean(b))
      ));
      
      // Combine with BRAND_LIST and remove duplicates
      const allBrands: string[] = Array.from(new Set([...BRAND_LIST, ...existingBrands]));
      
      // Filter and sort: exact matches first, then partial matches
      const lowerInput = brand.toLowerCase();
      const filtered: string[] = allBrands
        .filter((b: string) => b.toLowerCase().includes(lowerInput))
        .sort((a: string, b: string) => {
          const aLower = a.toLowerCase();
          const bLower = b.toLowerCase();
          const aStarts = aLower.startsWith(lowerInput);
          const bStarts = bLower.startsWith(lowerInput);
          
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return aLower.localeCompare(bLower);
        })
        .slice(0, 8); // Limit to 8 suggestions
      
      setBrandSuggestions(filtered);
      setShowBrandSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setBrandSuggestions([]);
      setShowBrandSuggestions(false);
    }
  }, [brand, existingItems]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        brandInputRef.current &&
        !brandInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowBrandSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation in suggestions
  const handleBrandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showBrandSuggestions || brandSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < brandSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      setBrand(brandSuggestions[selectedSuggestionIndex]);
      setShowBrandSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowBrandSuggestions(false);
    }
  };

  const handleBrandSelect = (selectedBrand: string) => {
    setBrand(selectedBrand);
    setShowBrandSuggestions(false);
    brandInputRef.current?.focus();
  };

  // Get available types for selected category
  const availableTypes = category ? CLOTHING_TYPES_BY_CATEGORY[category] : [];
  
  // Determine which sizes to show based on clothing type
  const showingShoeSizes = type && isFootwearType(type);
  const isPantsOrJeans = type === 'Pants' || type === 'Jeans';
  const availableSizes = showingShoeSizes ? SHOE_SIZES : REGULAR_SIZES;

  // Reset type when category changes
  useEffect(() => {
    if (category && type) {
      // If current type is not in the new category, reset it
      if (!availableTypes.includes(type)) {
        setType('');
      }
    }
  }, [category]);

  // Reset size when switching between footwear and regular clothing
  useEffect(() => {
    if (type && size) {
      // Don't validate or reset size for pants/jeans (they use text input)
      if (isPantsOrJeans) {
        return;
      }
      
      const isSizeValid = availableSizes.some((s) => s === (size as any));
      if (!isSizeValid) {
        // Set default size based on type
        setSize(showingShoeSizes ? '40' : 'M');
      }
    }
  }, [type, size, showingShoeSizes, availableSizes, isPantsOrJeans]);

  // Load item data when dialog opens
  useEffect(() => {
    if (item && open) {
      // Load category and type (migrated items will have category, old items won't)
      // If no category, infer it from type
      const itemCategory = item.category || (item.type ? getCategoryForType(item.type) : '');
      setCategory(itemCategory);
      setType(item.type || '');
      setSelectedTags(item.tags || []);
      setBrand(item.brand);
      setSize(item.size);
      setColor(item.color);
      setSelectedColors(item.colors || []);
      setPattern(item.pattern || 'Solid');
      setCost(item.cost.toString());
      setFormalityLevel(item.formalityLevel || 3);
      setNotes(item.notes || '');
      setSelectedWardrobeId(item.wardrobeId || '');

      // Load image preview
      storageService.getImageUrl(item.imageId).then((url) => {
        setImagePreview(url);
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    // Validation
    if (!category || !type || !brand || !cost) {
      alert('Please fill in all required fields');
      return;
    }

    const costNumber = parseFloat(cost);
    if (isNaN(costNumber) || costNumber < 0) {
      alert('Please enter a valid cost');
      return;
    }

    try {
      setIsSubmitting(true);

      const updates: Partial<ClothingItemInput> = {
        category: category as ClothingCategory,
        type,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        brand,
        size,
        color,
        colors: selectedColors.length > 0 ? selectedColors : undefined,
        pattern: pattern !== 'Solid' ? pattern : undefined,
        cost: costNumber,
        formalityLevel,
        notes: notes || undefined,
      };

      // Only include image if a new one was selected
      if (imageBlob) {
        updates.imageBlob = imageBlob;
      }

      // Pass the selected wardrobeId (only if it changed from the original)
      const newWardrobeId = selectedWardrobeId !== item.wardrobeId ? selectedWardrobeId : undefined;
      await onUpdate(item.id, updates, newWardrobeId);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Clothing Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Photo Capture */}
          <div>
            <Label className="text-base mb-2 block">Photo</Label>
            <PhotoCapture onPhotoCapture={setImageBlob} initialPreview={imagePreview} />
            <p className="text-xs text-gray-500 mt-1">
              Leave as is to keep current photo, or upload a new one
            </p>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="edit-category" className="text-base">
              Category *
            </Label>
            <Select 
              value={category} 
              onValueChange={(value) => setCategory(value as ClothingCategory)}
            >
              <SelectTrigger id="edit-category" className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CLOTHING_TYPES_BY_CATEGORY).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type (filtered by category) */}
          <div>
            <Label htmlFor="edit-type" className="text-base">
              Type *
            </Label>
            <Select 
              value={type} 
              onValueChange={(value) => setType(value)}
              disabled={!category}
            >
              <SelectTrigger id="edit-type" className="mt-1">
                <SelectValue placeholder={category ? "Select type" : "Select category first"} />
              </SelectTrigger>
              <SelectContent>
                {category ? (
                  availableTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    Please select a category first
                  </div>
                )}
              </SelectContent>
            </Select>
            {!category && (
              <p className="text-xs text-gray-500 mt-1">Please select a category first</p>
            )}
          </div>

          {/* Tags (multi-select) */}
          <div>
            <Label className="text-base mb-2 block">Tags (Optional)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand */}
          <div className="relative">
            <Label htmlFor="edit-brand" className="text-base">
              Brand *
            </Label>
            <Input
              ref={brandInputRef}
              id="edit-brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onFocus={() => {
                if (brandSuggestions.length > 0) {
                  setShowBrandSuggestions(true);
                }
              }}
              onKeyDown={handleBrandKeyDown}
              required
              className="mt-1"
              autoComplete="off"
            />
            {showBrandSuggestions && brandSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                {brandSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleBrandSelect(suggestion)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                      index === selectedSuggestionIndex ? 'bg-gray-100' : ''
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Size */}
          <div>
            <Label htmlFor="edit-size" className="text-base">
              {showingShoeSizes 
                ? 'Size (European) *' 
                : isPantsOrJeans 
                ? 'Pants Size (US) *' 
                : 'Size *'}
            </Label>
            {isPantsOrJeans ? (
              <Input
                id="edit-size"
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value as ClothingSize)}
                placeholder="e.g., 32, 34, 36, M, L"
                required
                className="mt-1"
              />
            ) : (
              <Select value={size} onValueChange={(value) => setSize(value as ClothingSize)}>
                <SelectTrigger id="edit-size" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSizes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {showingShoeSizes ? formatShoeSize(s as any) : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Primary Color */}
          <div>
            <Label htmlFor="edit-color" className="text-base">
              Primary Color *
            </Label>
            <Select value={color} onValueChange={(value) => setColor(value as ClothingColor)}>
              <SelectTrigger id="edit-color" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Colors (Multi-select) */}
          <div>
            <Label className="text-base mb-2 block">Additional Colors (Optional)</Label>
            {selectedColors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedColors.map((col, index) => (
                  <div key={index} className="flex items-center gap-1 px-3 py-1 bg-indigo-100 rounded-full">
                    <span className="text-sm font-medium text-indigo-900">{col}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedColors(selectedColors.filter((_, i) => i !== index))}
                      className="text-indigo-600 hover:text-indigo-800 ml-1 text-lg leading-none"
                      aria-label={`Remove ${col}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !selectedColors.includes(value as ClothingColor) && value !== color) {
                  setSelectedColors([...selectedColors, value as ClothingColor]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add another color" />
              </SelectTrigger>
              <SelectContent>
                {COLORS.filter((c) => c !== color && !selectedColors.includes(c)).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                {COLORS.filter((c) => c !== color && !selectedColors.includes(c)).length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-gray-500">All colors added</div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Add additional colors for multicolor items</p>
          </div>

          {/* Pattern Selection */}
          <div>
            <Label htmlFor="edit-pattern" className="text-base">
              Pattern (Optional)
            </Label>
            <Select value={pattern} onValueChange={(value) => setPattern(value as ClothingPattern)}>
              <SelectTrigger id="edit-pattern" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Solid">Solid</SelectItem>
                <SelectItem value="Stripes">Stripes</SelectItem>
                <SelectItem value="Checks">Checks</SelectItem>
                <SelectItem value="Plaid">Plaid</SelectItem>
                <SelectItem value="Polka Dots">Polka Dots</SelectItem>
                <SelectItem value="Floral">Floral</SelectItem>
                <SelectItem value="Abstract">Abstract</SelectItem>
                <SelectItem value="Geometric">Geometric</SelectItem>
                <SelectItem value="Corduroy">Corduroy</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cost */}
          <div>
            <Label htmlFor="edit-cost" className="text-base">
              Cost ($) *
            </Label>
            <Input
              id="edit-cost"
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {/* Formality Level */}
          <div>
            <Label className="text-base block mb-2">
              Formality Level *
            </Label>
            <div className="space-y-2">
              <Slider
                value={[formalityLevel]}
                onValueChange={(value: number[]) => setFormalityLevel(value[0] as FormalityLevel)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>🩴 Very Informal</span>
                <span className="font-medium text-gray-700 text-base">
                  {formalityLevel === 1 && '🩴 Very Informal'}
                  {formalityLevel === 2 && '👕 Informal'}
                  {formalityLevel === 3 && '👔 Casual'}
                  {formalityLevel === 4 && '🎩 Formal'}
                  {formalityLevel === 5 && '🤵 Very Formal'}
                </span>
                <span>🤵 Very Formal</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="edit-notes" className="text-base">
              Notes (Optional)
            </Label>
            <Input
              id="edit-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              className="mt-1"
            />
          </div>

          {/* Wardrobe Selection */}
          {wardrobes.length > 1 && (
            <div>
              <Label htmlFor="edit-wardrobe" className="text-base">
                Wardrobe
              </Label>
              <Select
                value={selectedWardrobeId || ''}
                onValueChange={(value) => setSelectedWardrobeId(value)}
              >
                <SelectTrigger id="edit-wardrobe" className="mt-1">
                  <SelectValue placeholder="Select wardrobe" />
                </SelectTrigger>
                <SelectContent>
                  {wardrobes.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Updating...' : 'Update Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
