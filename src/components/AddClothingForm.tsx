import { useState, useEffect, useRef } from 'react';
import { PhotoCapture } from './PhotoCapture';
import { AnalysisResultDialog } from './AnalysisResultDialog';
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
} from '@/types/clothing';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/services/firestore';
import { UserProfile } from '@/types/profile';
import { ClothingAnalysis } from '@/services/imageAnalysis';
import { BRAND_LIST } from '@/data/brands';
import { useWardrobeContext } from '@/contexts/WardrobeContext';

// Available tags
const AVAILABLE_TAGS: ClothingTag[] = [
  'Sportswear',
  'Gym',
  'Running',
  'Outdoor',
  'Formal',
  'Casual',
  'Beach',
  'Winter',
  'Summer',
  'Workout',
  'Travel',
  'Party',
  'Business',
  'Athletic',
  'Comfort',
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

interface AddClothingFormProps {
  onSubmit: (item: ClothingItemInput, wardrobeId?: string) => Promise<void>;
  onCancel?: () => void;
  existingItems?: Array<{ brand: string }>; // Optional: existing wardrobe items for brand suggestions
  defaultWardrobeId?: string; // Default wardrobe to assign item to
}

export function AddClothingForm({ onSubmit, onCancel, existingItems = [], defaultWardrobeId }: AddClothingFormProps) {
  const { user } = useAuth();
  const { wardrobes } = useWardrobeContext();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [category, setCategory] = useState<ClothingCategory | ''>('');
  const [type, setType] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<ClothingTag[]>([]);
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState<ClothingSize | ''>('');
  const [color, setColor] = useState<ClothingColor | ''>('');
  const [selectedColors, setSelectedColors] = useState<ClothingColor[]>([]);
  const [pattern, setPattern] = useState<ClothingPattern>('Solid');
  const [cost, setCost] = useState('');
  const [formalityLevel, setFormalityLevel] = useState<FormalityLevel>(3); // Default to middle (3)
  const [notes, setNotes] = useState('');
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>(defaultWardrobeId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ClothingAnalysis | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  
  // Brand autocomplete state
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Set default wardrobe when component mounts or defaultWardrobeId changes
  useEffect(() => {
    if (defaultWardrobeId && !selectedWardrobeId) {
      setSelectedWardrobeId(defaultWardrobeId);
    }
  }, [defaultWardrobeId, selectedWardrobeId]);

  // Filter brands based on input - combine BRAND_LIST with user's existing brands
  useEffect(() => {
    if (brand.trim().length > 0) {
      // Get unique brands from existing items
      const existingBrands = Array.from(new Set(
        existingItems.map(item => item.brand).filter(Boolean)
      ));
      
      // Combine with BRAND_LIST and remove duplicates
      const allBrands = Array.from(new Set([...BRAND_LIST, ...existingBrands]));
      
      // Filter and sort: exact matches first, then partial matches
      const lowerInput = brand.toLowerCase();
      const filtered = allBrands
        .filter(b => b.toLowerCase().includes(lowerInput))
        .sort((a, b) => {
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

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };
    loadProfile();
  }, [user]);

  // Get available types for selected category
  const availableTypes = category ? CLOTHING_TYPES_BY_CATEGORY[category] : [];
  
  // Determine which sizes to show based on clothing type
  const showingShoeSizes = type && isFootwearType(type);
  const isPantsOrJeans = type === 'Pants' || type === 'Jeans';
  const availableSizes = showingShoeSizes ? SHOE_SIZES : REGULAR_SIZES;
  
  // Reset type when category changes
  useEffect(() => {
    if (category) {
      setType(''); // Reset type when category changes
    }
  }, [category]);

  // Pre-populate size based on user profile when type changes
  useEffect(() => {
    if (type && userProfile) {
      const isFootwear = isFootwearType(type);
      const isPantsType = type === 'Pants' || type === 'Jeans';
      
      // Only pre-populate if size field is empty
      if (!size) {
        if (isFootwear) {
          // For footwear, use shoeSize from profile
          if (userProfile.shoeSize && SHOE_SIZES.includes(userProfile.shoeSize as any)) {
            setSize(userProfile.shoeSize as ClothingSize);
          }
        } else if (isPantsType) {
          // For pants/jeans, use pantsSizeUs from profile
          if (userProfile.pantsSizeUs) {
            setSize(userProfile.pantsSizeUs as ClothingSize);
          }
        } else {
          // For other regular clothing, use generalSize from profile
          if (userProfile.generalSize && REGULAR_SIZES.includes(userProfile.generalSize as any)) {
            setSize(userProfile.generalSize as ClothingSize);
          }
        }
      } else {
        // If size is already set, validate it for the current type
        const isFootwear2 = isFootwearType(type);
        const isPantsType2 = type === 'Pants' || type === 'Jeans';
        
        if (isFootwear2 && !SHOE_SIZES.includes(size as any)) {
          // Size is invalid for footwear, clear it
          setSize('');
        } else if (!isFootwear2 && !isPantsType2 && !REGULAR_SIZES.includes(size as any)) {
          // Size is invalid for regular clothing (not pants), clear it
          setSize('');
        }
        // For pants, any string is valid, so we don't clear it
      }
    }
  }, [type, userProfile]); // Only depend on type and userProfile

  // Reset size when switching between different size types (if size is invalid)
  useEffect(() => {
    if (type && size) {
      const isFootwearTypeCheck = isFootwearType(type);
      const isPantsType = type === 'Pants' || type === 'Jeans';
      
      if (isFootwearTypeCheck) {
        // For footwear, size must be from SHOE_SIZES
        if (!SHOE_SIZES.includes(size as any)) {
          setSize('');
        }
      } else if (!isPantsType) {
        // For regular clothing (not pants), size must be from REGULAR_SIZES
        if (!REGULAR_SIZES.includes(size as any)) {
          setSize('');
        }
      }
      // For pants, any string is valid, so we don't clear it
    }
  }, [type, size]);

  // Helper function to match detected color to ClothingColor enum
  const matchColor = (detectedColor: string): ClothingColor | null => {
    const colorMap: Record<string, ClothingColor> = {
      'Black': 'Black',
      'White': 'White',
      'Gray': 'Gray',
      'Navy': 'Navy',
      'Blue': 'Blue',
      'Red': 'Red',
      'Green': 'Green',
      'Yellow': 'Yellow',
      'Orange': 'Orange',
      'Pink': 'Pink',
      'Purple': 'Purple',
      'Brown': 'Brown',
      'Beige': 'Beige',
    };
    return colorMap[detectedColor] || null;
  };

  // Handler for analysis results
  const handleAnalysisComplete = (analysis: ClothingAnalysis) => {
    console.log('[AddClothingForm] handleAnalysisComplete called with:', analysis);
    setIsAnalyzing(false);
    
    // Store analysis result and show dialog
    setAnalysisResult(analysis);
    setShowAnalysisDialog(true);

    // Auto-fill category and type if detected and fields are empty
    // Use category and type directly from analysis (now returned by imageAnalysis service)
    if (analysis.category && !category) {
      console.log('[AddClothingForm] Setting category to:', analysis.category);
      setCategory(analysis.category);
    }
    if (analysis.type && !type) {
      console.log('[AddClothingForm] Setting type to:', analysis.type);
      setType(analysis.type);
    }
    // Auto-fill color if detected and field is empty
    if (analysis.color && !color) {
      const matchedColor = matchColor(analysis.color);
      if (matchedColor) {
        console.log('[AddClothingForm] Setting color to:', matchedColor);
        setColor(matchedColor);
      }
    }
    // Auto-fill pattern if detected and field is empty
    if (analysis.pattern && pattern === 'Solid') {
      console.log('[AddClothingForm] Setting pattern to:', analysis.pattern);
      setPattern(analysis.pattern);
    }
  };

  // Handler for when user selects options in the dialog
  const handleSelection = (selections: { brand?: string; color?: string }) => {
    console.log('[AddClothingForm] handleSelection called with:', selections);
    
    if (selections.brand && !brand) {
      console.log('[AddClothingForm] Setting brand to:', selections.brand);
      setBrand(selections.brand);
    }
    
    if (selections.color) {
      const matchedColor = matchColor(selections.color);
      if (matchedColor && !color) {
        console.log('[AddClothingForm] Setting color to:', matchedColor);
        setColor(matchedColor);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!imageBlob) {
      alert('Please add a photo');
      return;
    }
    if (!category || !type || !brand || !size || !color || !cost) {
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

      const item: ClothingItemInput = {
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
        imageBlob,
        notes: notes || undefined,
      };

      await onSubmit(item, selectedWardrobeId || undefined);

      // Reset form
      setImageBlob(null);
      setCategory('');
      setType('');
      setSelectedTags([]);
      setBrand('');
      setSize('');
      setColor('');
      setSelectedColors([]);
      setPattern('Solid');
      setCost('');
      setFormalityLevel(3);
      setNotes('');
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item. Please try again.';
      alert(`Failed to add item: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Capture */}
      <div>
        <Label className="text-base mb-2 block">Photo *</Label>
        <PhotoCapture 
          onPhotoCapture={setImageBlob}
          onAnalysisComplete={handleAnalysisComplete}
          onAnalysisStart={() => setIsAnalyzing(true)}
        />
        {isAnalyzing && (
          <div className="text-sm text-gray-500 text-center mt-2">
            🔍 Analyzing image...
          </div>
        )}
      </div>

      {/* Wardrobe Selection */}
      {wardrobes.length > 1 && (
        <div>
          <Label htmlFor="wardrobe" className="text-base">
            Wardrobe
          </Label>
          <Select 
            value={selectedWardrobeId} 
            onValueChange={setSelectedWardrobeId}
          >
            <SelectTrigger id="wardrobe" className="mt-1">
              <SelectValue placeholder="Select wardrobe" />
            </SelectTrigger>
            <SelectContent>
              {wardrobes.map((wardrobe) => (
                <SelectItem key={wardrobe.id} value={wardrobe.id}>
                  {wardrobe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Category */}
      <div>
        <Label htmlFor="category" className="text-base">
          Category *
        </Label>
        <Select 
          value={category} 
          onValueChange={(value) => setCategory(value as ClothingCategory)}
        >
          <SelectTrigger id="category" className="mt-1">
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
        <Label htmlFor="type" className="text-base">
          Type *
        </Label>
        <Select 
          value={type} 
          onValueChange={(value) => setType(value)}
          disabled={!category}
        >
          <SelectTrigger id="type" className="mt-1">
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
        <Label htmlFor="brand" className="text-base">
          Brand *
        </Label>
        <Input
          ref={brandInputRef}
          id="brand"
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          onFocus={() => {
            if (brandSuggestions.length > 0) {
              setShowBrandSuggestions(true);
            }
          }}
          onKeyDown={handleBrandKeyDown}
          placeholder="e.g., Nike, Zara, H&M"
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
        <Label htmlFor="size" className="text-base">
          {showingShoeSizes 
            ? 'Size (European) *' 
            : isPantsOrJeans 
            ? 'Pants Size (US) *' 
            : 'Size *'}
        </Label>
        {isPantsOrJeans ? (
          <Input
            id="size"
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value as ClothingSize)}
            placeholder="e.g., 32, 34, 36, M, L"
            required
            className="mt-1"
          />
        ) : (
          <Select value={size} onValueChange={(value) => setSize(value as ClothingSize)}>
            <SelectTrigger id="size" className="mt-1">
              <SelectValue placeholder={showingShoeSizes ? "Select shoe size" : "Select size"} />
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
        <Label htmlFor="color" className="text-base">
          Primary Color *
        </Label>
        <Select value={color} onValueChange={(value) => setColor(value as ClothingColor)}>
          <SelectTrigger id="color" className="mt-1">
            <SelectValue placeholder="Select primary color" />
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
        <Label htmlFor="pattern" className="text-base">
          Pattern (Optional)
        </Label>
        <Select value={pattern} onValueChange={(value) => setPattern(value as ClothingPattern)}>
          <SelectTrigger id="pattern" className="mt-1">
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
        <Label htmlFor="cost" className="text-base">
          Cost ($) *
        </Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          min="0"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="0.00"
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
            <span>Very Informal</span>
            <span className="font-medium text-gray-700">
              {formalityLevel === 1 && 'Very Informal'}
              {formalityLevel === 2 && 'Informal'}
              {formalityLevel === 3 && 'Casual'}
              {formalityLevel === 4 && 'Formal'}
              {formalityLevel === 5 && 'Very Formal'}
            </span>
            <span>Very Formal</span>
          </div>
        </div>
      </div>

      {/* Notes (Optional) */}
      <div>
        <Label htmlFor="notes" className="text-base">
          Notes (Optional)
        </Label>
        <Input
          id="notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes..."
          className="mt-1"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Adding...' : 'Add to Wardrobe'}
        </Button>
      </div>

      {/* Analysis Result Dialog */}
      <AnalysisResultDialog
        open={showAnalysisDialog}
        onOpenChange={setShowAnalysisDialog}
        analysis={analysisResult}
        onSelection={handleSelection}
      />
    </form>
  );
}
