import { useState, useEffect, useRef } from 'react';
import { PhotoCapture } from './PhotoCapture';
import { AnalysisResultDialog } from './AnalysisResultDialog';
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
import { getUserProfile, saveUserProfile } from '@/services/firestore';
import { UserProfile } from '@/types/profile';
import { ClothingAnalysis } from '@/services/imageAnalysis';
import { BRAND_LIST } from '@/data/brands';
import { useWardrobeContext } from '@/contexts/WardrobeContext';

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

  // Load user profile and custom tags on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
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

      // Combine standard tags and custom tags
      const allTags = [...selectedTags, ...selectedCustomTags];
      
      const item: ClothingItemInput = {
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
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* Basic Details Section */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Details</h3>
        
        {/* Category + Type (2-column grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Size + Cost (2-column grid) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Size */}
          <div>
            <Label htmlFor="size" className="text-base">
              {showingShoeSizes 
                ? 'Size (EU) *' 
                : isPantsOrJeans 
                ? 'Pants Size *' 
                : 'Size *'}
            </Label>
            {isPantsOrJeans ? (
              <Input
                id="size"
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value as ClothingSize)}
                placeholder="e.g., 32, M, L"
                required
                className="mt-1"
              />
            ) : (
              <Select value={size} onValueChange={(value) => setSize(value as ClothingSize)}>
                <SelectTrigger id="size" className="mt-1">
                  <SelectValue placeholder={showingShoeSizes ? "Select size" : "Select size"} />
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
        </div>
      </div>

      {/* Appearance Section */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Appearance</h3>
        
        {/* Primary Color */}
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
                  <span className={`text-xs text-center leading-tight ${
                    isSelected ? 'font-semibold text-indigo-900' : 'text-gray-600'
                  }`}>
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
          {!color && (
            <p className="text-xs text-red-500 mt-1">Please select a primary color</p>
          )}
        </div>

        {/* Additional Colors (Multi-select) */}
        <div>
          <Label className="text-base mb-2 block">Additional Colors (Optional)</Label>
          <p className="text-xs text-gray-500 mb-2">Click to add/remove additional colors for multicolor items</p>
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
                    } ${c === 'White' ? 'shadow-sm' : ''} relative`}
                    style={{
                      background: isMulticolor ? hexColor : hexColor,
                    }}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-lg font-bold drop-shadow-md">✓</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs text-center leading-tight ${
                    isSelected ? 'font-semibold text-indigo-900' : 'text-gray-600'
                  }`}>
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedColors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-gray-600">Selected:</span>
              {selectedColors.map((col) => (
                <span key={col} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-900 rounded-full">
                  {col}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pattern Selection */}
        <div>
          <Label className="text-base mb-2 block">
            Pattern (Optional)
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
      </div>

      {/* Additional Details Section */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Details</h3>
        
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

      {/* Custom Tag Dialog */}
      <CustomTagDialog
        open={showCustomTagDialog}
        onOpenChange={setShowCustomTagDialog}
        onCreateTag={handleCreateCustomTag}
        existingTags={[...customTags, ...Object.values(TAG_CATEGORIES).flatMap(cat => cat.tags)]}
      />
    </form>
  );
}
