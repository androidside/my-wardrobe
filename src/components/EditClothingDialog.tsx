import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PhotoCapture } from './PhotoCapture';
import { CustomTagDialog } from './CustomTagDialog';
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
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, saveUserProfile } from '@/services/firestore';

// Organized tags by category
const TAG_CATEGORIES = {
  OCCASION: {
    label: 'Occasion',
    icon: '📅',
    tags: [
      'Work/Office',
      'Formal Event',
      'Party/Night Out',
      'Vacation',
      'Travel',
      'Home/Lounge',
      'Business Casual',
      'Family Event',
      'Date Night',
    ] as ClothingTag[],
  },
  ACTIVITY: {
    label: 'Activity',
    icon: '🏃',
    tags: [
      'Sport/Active',
      'Gym/Training',
      'Yoga/Stretch',
      'Outdoor',
      'Swim/Beach',
      'Winter Sports',
      'Running',
      'Cycling',
    ] as ClothingTag[],
  },
  SEASON: {
    label: 'Season / Weather',
    icon: '🌤️',
    tags: [
      'Summer',
      'Winter',
      'Spring/Fall',
      'Rainy Day',
      'Hot Weather',
      'Cold Weather',
    ] as ClothingTag[],
  },
  STYLE: {
    label: 'Style / Vibe',
    icon: '✨',
    tags: [
      'Trendy',
      'Streetwear',
      'Minimalist',
      'Bold/Statement',
      'Classic',
      'Edgy',
      'Romantic',
      'Vintage',
      'Casual',
    ] as ClothingTag[],
  },
  COMFORT: {
    label: 'Comfort / Fit',
    icon: '☁️',
    tags: [
      'Cozy/Comfort',
      'Stretchy',
      'Lightweight',
      'Warm',
      'Breathable',
      'Relaxed Fit',
    ] as ClothingTag[],
  },
};

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

// Color hex mapping for visual chips
const COLOR_HEX_MAP: Record<ClothingColor, string> = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Gray': '#808080',
  'Navy': '#000080',
  'Blue': '#0000FF',
  'Red': '#FF0000',
  'Green': '#008000',
  'Yellow': '#FFFF00',
  'Orange': '#FFA500',
  'Pink': '#FFC0CB',
  'Purple': '#800080',
  'Brown': '#8B4513',
  'Beige': '#F5F5DC',
  'Multicolor': 'linear-gradient(135deg, #FF0000 0%, #FF7F00 16.67%, #FFFF00 33.33%, #00FF00 50%, #0000FF 66.67%, #4B0082 83.33%, #9400D3 100%)',
  'Other': '#CCCCCC',
};

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
  const { user } = useAuth();
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
  
  // Custom tags state
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [showCustomTagDialog, setShowCustomTagDialog] = useState(false);
  const [selectedCustomTags, setSelectedCustomTags] = useState<string[]>([]);
  
  // Brand autocomplete state
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Track when we're loading item data to prevent validation effects from interfering
  const isLoadingItemData = useRef(false);

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

  // Load user profile and custom tags on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            // Load custom tags from profile
            if (profile.customTags && Array.isArray(profile.customTags)) {
              setCustomTags(profile.customTags);
            }
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };
    loadProfile();
  }, [user]);

  // Handler for creating a custom tag
  const handleCreateCustomTag = async (tagName: string) => {
    if (!user) {
      throw new Error('User must be logged in to create tags');
    }

    // Add to local state
    const newCustomTags = [...customTags, tagName];
    setCustomTags(newCustomTags);

    // Save to user profile
    try {
      await saveUserProfile(user.uid, {
        customTags: newCustomTags,
      });
      console.log('Custom tag created and saved:', tagName);
    } catch (error) {
      console.error('Error saving custom tag:', error);
      // Revert local state on error
      setCustomTags(customTags);
      throw error;
    }
  };

  // Handler for deleting a custom tag
  const handleDeleteCustomTag = async (tagName: string) => {
    if (!user) return;

    // Remove from local state
    const newCustomTags = customTags.filter(t => t !== tagName);
    setCustomTags(newCustomTags);

    // Also remove from selected tags if it was selected
    setSelectedCustomTags(selectedCustomTags.filter(t => t !== tagName));

    // Save to user profile
    try {
      await saveUserProfile(user.uid, {
        customTags: newCustomTags,
      });
      console.log('Custom tag deleted:', tagName);
    } catch (error) {
      console.error('Error deleting custom tag:', error);
      // Revert local state on error
      setCustomTags(customTags);
    }
  };

  // Get available types for selected category
  const availableTypes = category ? CLOTHING_TYPES_BY_CATEGORY[category] : [];
  
  // Determine which sizes to show based on clothing type
  const showingShoeSizes = type && isFootwearType(type);
  const isPantsOrJeans = type === 'Pants' || type === 'Jeans';
  const availableSizes = showingShoeSizes ? SHOE_SIZES : REGULAR_SIZES;

  // Reset type when category changes (but not during initial item load)
  useEffect(() => {
    // Skip validation during initial item data load
    if (isLoadingItemData.current) return;
    
    if (category && type) {
      // If current type is not in the new category, reset it
      if (!availableTypes.includes(type)) {
        setType('');
      }
    }
  }, [category, type, availableTypes]);

  // Reset size when switching between footwear and regular clothing (but not during initial item load)
  useEffect(() => {
    // Skip validation during initial item data load
    if (isLoadingItemData.current) return;
    
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
      // Set flag to prevent validation effects from running during load
      isLoadingItemData.current = true;
      
      // Load category and type (migrated items will have category, old items won't)
      // If no category, infer it from type
      const itemCategory = item.category || (item.type ? getCategoryForType(item.type) : '');
      setCategory(itemCategory);
      setType(item.type || '');
      
      // Separate standard tags from custom tags
      const allStandardTags = Object.values(TAG_CATEGORIES).flatMap(cat => cat.tags);
      const itemTags = item.tags || [];
      const standardTags = itemTags.filter((tag: ClothingTag | string) => allStandardTags.includes(tag as ClothingTag)) as ClothingTag[];
      const customTagsList = itemTags.filter((tag: ClothingTag | string) => !allStandardTags.includes(tag as ClothingTag)) as string[];
      
      setSelectedTags(standardTags);
      setSelectedCustomTags(customTagsList);
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
      
      // Clear the loading flag after a short delay to allow all state updates to complete
      setTimeout(() => {
        isLoadingItemData.current = false;
      }, 100);
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

      // Combine standard tags and custom tags
      const allTags = [...selectedTags, ...selectedCustomTags];

      const updates: Partial<ClothingItemInput> = {
        category: category as ClothingCategory,
        type,
        tags: allTags.length > 0 ? (allTags as ClothingTag[]) : undefined,
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

          {/* Tags (multi-select) - Organized by Category */}
          <div>
            <Label className="text-base mb-2 block">Tags (Optional)</Label>
            <p className="text-xs text-gray-500 mb-3">Organize your items by occasion, activity, season, style, or comfort</p>
            
            <div className="space-y-3">
              {Object.entries(TAG_CATEGORIES).map(([key, category]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <h4 className="text-sm font-medium text-gray-700">{category.label}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.tags.map((tag) => {
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
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
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
              ))}

              {/* Custom Tags Section */}
              <div className="space-y-2 pt-2 border-t border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏷️</span>
                    <h4 className="text-sm font-medium text-gray-700">Your Custom Tags</h4>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomTagDialog(true)}
                    className="text-xs"
                  >
                    + New Tag
                  </Button>
                </div>
                
                {customTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customTags.map((tag) => {
                      const isSelected = selectedCustomTags.includes(tag);
                      return (
                        <div key={tag} className="relative group">
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCustomTags(selectedCustomTags.filter(t => t !== tag));
                              } else {
                                setSelectedCustomTags([...selectedCustomTags, tag]);
                              }
                            }}
                            className={`px-3 py-1.5 pr-8 rounded-full text-xs border transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                          >
                            {tag}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete custom tag "${tag}"?`)) {
                                handleDeleteCustomTag(tag);
                              }
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete tag"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No custom tags yet. Create your first custom tag!</p>
                )}
              </div>
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

          {/* Primary Color - Visual Selector */}
          <div>
            <Label className="text-base mb-2 block">
              Primary Color *
            </Label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 mt-1">
              {COLORS.map((c) => {
                const hexColor = COLOR_HEX_MAP[c];
                const isMulticolor = c === 'Multicolor';
                const isSelected = color === c;
                
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 bg-indigo-50'
                        : 'hover:bg-gray-100'
                    }`}
                    title={c}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 ${
                        isSelected ? 'border-indigo-600' : 'border-gray-300'
                      } ${c === 'White' ? 'shadow-sm' : ''}`}
                      style={{
                        background: isMulticolor ? hexColor : hexColor,
                      }}
                    />
                    <span className="text-[10px] text-center text-gray-600 leading-tight">{c}</span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Colors - Visual Multi-selector */}
          <div>
            <Label className="text-base mb-2 block">
              Additional Colors (Optional)
            </Label>
            <p className="text-xs text-gray-500 mb-2">For items with multiple colors, select additional colors</p>
            {selectedColors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedColors.map((col) => (
                  <div key={col} className="flex items-center gap-1 px-3 py-1 bg-indigo-100 rounded-full">
                    <span className="text-sm font-medium text-indigo-900">{col}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedColors(selectedColors.filter((c) => c !== col))}
                      className="text-indigo-600 hover:text-indigo-800 ml-1 text-lg leading-none"
                      aria-label={`Remove ${col}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {COLORS.filter((c) => c !== color).map((c) => {
                const hexColor = COLOR_HEX_MAP[c];
                const isMulticolor = c === 'Multicolor';
                const isSelected = selectedColors.includes(c);
                
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedColors(selectedColors.filter(sc => sc !== c));
                      } else {
                        setSelectedColors([...selectedColors, c]);
                      }
                    }}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 bg-indigo-50'
                        : 'hover:bg-gray-100'
                    }`}
                    title={c}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 ${
                        isSelected ? 'border-indigo-600' : 'border-gray-300'
                      } ${c === 'White' ? 'shadow-sm' : ''}`}
                      style={{
                        background: isMulticolor ? hexColor : hexColor,
                      }}
                    />
                    <span className="text-[10px] text-center text-gray-600 leading-tight">{c}</span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pattern - Visual Selector */}
          <div>
            <Label className="text-base mb-2 block">
              Pattern *
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1">
              {(['Solid', 'Stripes', 'Checks', 'Plaid', 'Polka Dots', 'Floral', 'Abstract', 'Geometric', 'Corduroy', 'Other'] as ClothingPattern[]).map((p) => {
                const isSelected = pattern === p;
                const patternEmojis: Record<ClothingPattern, string> = {
                  'Solid': '⬜',
                  'Stripes': '▦',
                  'Checks': '▦',
                  'Plaid': '▦',
                  'Polka Dots': '⬤',
                  'Floral': '❀',
                  'Abstract': '◆',
                  'Geometric': '◆',
                  'Corduroy': '▥',
                  'Other': '?',
                };
                
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPattern(p)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{patternEmojis[p]}</span>
                    <span className={`text-xs text-center leading-tight ${
                      isSelected ? 'font-semibold text-indigo-900' : 'text-gray-600'
                    }`}>
                      {p}
                    </span>
                  </button>
                );
              })}
            </div>
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

      {/* Custom Tag Dialog */}
      <CustomTagDialog
        open={showCustomTagDialog}
        onOpenChange={setShowCustomTagDialog}
        onCreateTag={handleCreateCustomTag}
        existingTags={[...customTags, ...Object.values(TAG_CATEGORIES).flatMap(cat => cat.tags)]}
      />
    </Dialog>
  );
}
