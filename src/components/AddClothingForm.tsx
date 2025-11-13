import { useState, useEffect } from 'react';
import { PhotoCapture } from './PhotoCapture';
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
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [type, setType] = useState<ClothingType | ''>('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState<ClothingSize | ''>('');
  const [color, setColor] = useState<ClothingColor | ''>('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine which sizes to show based on clothing type
  const showingShoeSizes = type && isFootwear(type);
  const availableSizes = showingShoeSizes ? SHOE_SIZES : REGULAR_SIZES;

  // Reset size when switching between footwear and regular clothing
  useEffect(() => {
    if (type && size) {
      const isSizeValid = availableSizes.includes(size as any);
      if (!isSizeValid) {
        setSize('');
      }
    }
  }, [type]);

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
      alert('Failed to add item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Capture */}
      <div>
        <Label className="text-base mb-2 block">Photo *</Label>
        <PhotoCapture onPhotoCapture={setImageBlob} />
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
          {showingShoeSizes ? 'Size (European) *' : 'Size *'}
        </Label>
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
    </form>
  );
}
