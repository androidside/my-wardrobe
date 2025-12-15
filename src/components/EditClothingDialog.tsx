import { useState, useEffect } from 'react';
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
  ClothingType,
  ClothingSize,
  ClothingColor,
  REGULAR_SIZES,
  SHOE_SIZES,
  isFootwear,
  formatShoeSize,
} from '@/types/clothing';
import { storageService } from '@/utils/storage';


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

interface EditClothingDialogProps {
  item: ClothingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<ClothingItemInput>) => Promise<any>;
}

export function EditClothingDialog({
  item,
  open,
  onOpenChange,
  onUpdate,
}: EditClothingDialogProps) {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [type, setType] = useState<ClothingType>('T-shirt');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState<ClothingSize>('M');
  const [color, setColor] = useState<ClothingColor>('Black');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine which sizes to show based on clothing type
  const showingShoeSizes = type && isFootwear(type);
  const availableSizes = showingShoeSizes ? SHOE_SIZES : REGULAR_SIZES;

  // Reset size when switching between footwear and regular clothing
  useEffect(() => {
    if (type && size) {
      const isSizeValid = availableSizes.some((s) => s === (size as any));
      if (!isSizeValid) {
        // Set default size based on type
        setSize(showingShoeSizes ? '40' : 'M');
      }
    }
  }, [type]);

  // Load item data when dialog opens
  useEffect(() => {
    if (item && open) {
      setType(item.type);
      setBrand(item.brand);
      setSize(item.size);
      setColor(item.color);
      setCost(item.cost.toString());
      setNotes(item.notes || '');

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
    if (!brand || !cost) {
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
        type,
        brand,
        size,
        color,
        cost: costNumber,
        notes: notes || undefined,
      };

      // Only include image if a new one was selected
      if (imageBlob) {
        updates.imageBlob = imageBlob;
      }

      await onUpdate(item.id, updates);
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

          {/* Clothing Type */}
          <div>
            <Label htmlFor="edit-type" className="text-base">
              Type *
            </Label>
            <Select value={type} onValueChange={(value) => setType(value as ClothingType)}>
              <SelectTrigger id="edit-type" className="mt-1">
                <SelectValue />
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
            <Label htmlFor="edit-brand" className="text-base">
              Brand *
            </Label>
            <Input
              id="edit-brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {/* Size */}
          <div>
            <Label htmlFor="edit-size" className="text-base">
              {showingShoeSizes ? 'Size (European) *' : 'Size *'}
            </Label>
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
          </div>

          {/* Color */}
          <div>
            <Label htmlFor="edit-color" className="text-base">
              Color *
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
