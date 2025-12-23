import { useState, useEffect } from 'react';
import { PhotoCapture } from './PhotoCapture';
import { AnalysisResultDialog } from './AnalysisResultDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClothingItemInput,
  ClothingType,
  ClothingSize,
  ClothingColor,
  REGULAR_SIZES,
  SHOE_SIZES,
  isFootwear,
  formatShoeSize,
} from '@/types/clothing';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/services/firestore';
import { UserProfile } from '@/types/profile';
import { ClothingAnalysis } from '@/services/imageAnalysis';

const CLOTHING_TYPES: ClothingType[] = [
  'T-shirt',
  'Shirt',
  'Jacket',
  'Coat',
  'Sweater',
  'Hoodie',
  'Pants',
  'Jeans',
  'Shorts',
  'Skirt',
  'Dress',
  'Shoes',
  'Sneakers',
  'Boots',
  'Sandals',
  'Accessories',
  'Other',
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
  onSubmit: (item: ClothingItemInput) => Promise<void>;
  onCancel?: () => void;
}

export function AddClothingForm({ onSubmit, onCancel }: AddClothingFormProps) {
  const { user } = useAuth();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [type, setType] = useState<ClothingType | ''>('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState<ClothingSize | ''>('');
  const [color, setColor] = useState<ClothingColor | ''>('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ClothingAnalysis | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

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

  // Determine which sizes to show based on clothing type
  const showingShoeSizes = type && isFootwear(type);
  const isPantsOrJeans = type === 'Pants' || type === 'Jeans';
  const availableSizes = showingShoeSizes ? SHOE_SIZES : REGULAR_SIZES;

  // Pre-populate size based on user profile when type changes
  useEffect(() => {
    if (type && userProfile) {
      const isFootwearType = isFootwear(type);
      const isPantsType = type === 'Pants' || type === 'Jeans';
      
      // Only pre-populate if size field is empty
      if (!size) {
        if (isFootwearType) {
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
        const isFootwearType = isFootwear(type);
        const isPantsType = type === 'Pants' || type === 'Jeans';
        
        if (isFootwearType && !SHOE_SIZES.includes(size as any)) {
          // Size is invalid for footwear, clear it
          setSize('');
        } else if (!isFootwearType && !isPantsType && !REGULAR_SIZES.includes(size as any)) {
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
      const isFootwearType = isFootwear(type);
      const isPantsType = type === 'Pants' || type === 'Jeans';
      
      if (isFootwearType) {
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

  // Helper function to match detected type to ClothingType enum
  const matchClothingType = (detectedType: string): ClothingType | null => {
    const typeMap: Record<string, ClothingType> = {
      'T-shirt': 'T-shirt',
      'Shirt': 'Shirt',
      'Jacket': 'Jacket',
      'Coat': 'Coat',
      'Sweater': 'Sweater',
      'Hoodie': 'Hoodie',
      'Pants': 'Pants',
      'Jeans': 'Jeans',
      'Shorts': 'Shorts',
      'Skirt': 'Skirt',
      'Dress': 'Dress',
      'Shoes': 'Shoes',
      'Sneakers': 'Sneakers',
      'Boots': 'Boots',
      'Sandals': 'Sandals',
      'Accessories': 'Accessories',
      'Other': 'Other',
    };
    return typeMap[detectedType] || null;
  };

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

    // Auto-fill type if detected and field is empty (type doesn't have options, so auto-fill it)
    if (analysis.type && !type) {
      console.log('[AddClothingForm] Attempting to match type:', analysis.type);
      const matchedType = matchClothingType(analysis.type);
      console.log('[AddClothingForm] Matched type:', matchedType);
      if (matchedType) {
        console.log('[AddClothingForm] Setting type to:', matchedType);
        setType(matchedType);
      }
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
    if (!type || !brand || !size || !color || !cost) {
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
        type,
        brand,
        size,
        color,
        cost: costNumber,
        imageBlob,
        notes: notes || undefined,
      };

      await onSubmit(item);

      // Reset form
      setImageBlob(null);
      setType('');
      setBrand('');
      setSize('');
      setColor('');
      setCost('');
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

      {/* Clothing Type */}
      <div>
        <Label htmlFor="type" className="text-base">
          Type *
        </Label>
        <Select value={type} onValueChange={(value) => setType(value as ClothingType)}>
          <SelectTrigger id="type" className="mt-1">
            <SelectValue placeholder="Select clothing type" />
          </SelectTrigger>
          <SelectContent>
            {CLOTHING_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand */}
      <div>
        <Label htmlFor="brand" className="text-base">
          Brand *
        </Label>
        <Input
          id="brand"
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="e.g., Nike, Zara, H&M"
          required
          className="mt-1"
        />
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

      {/* Color */}
      <div>
        <Label htmlFor="color" className="text-base">
          Color *
        </Label>
        <Select value={color} onValueChange={(value) => setColor(value as ClothingColor)}>
          <SelectTrigger id="color" className="mt-1">
            <SelectValue placeholder="Select color" />
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
