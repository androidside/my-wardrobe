import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClothingItem } from '@/types/clothing';
import { wardrobeStorageService } from '@/services/wardrobeStorage';

interface ClothingDetailsDialogProps {
  item: ClothingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClothingDetailsDialog({ item, open, onOpenChange }: ClothingDetailsDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (item && open) {
      setImageLoading(true);
      wardrobeStorageService.getImageUrl(item.imageId).then((url) => {
        if (mounted) {
          setImageUrl(url);
          setImageLoading(false);
        }
      }).catch((error) => {
        console.error('Error loading image:', error);
        if (mounted) {
          setImageUrl(null);
          setImageLoading(false);
        }
      });
    } else {
      setImageUrl(null);
      setImageLoading(false);
    }
    return () => {
      mounted = false;
      setImageUrl(null);
      setImageLoading(false);
    };
  }, [item, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Clothing Details</DialogTitle>
        </DialogHeader>

        {item ? (
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-gray-100 rounded overflow-hidden flex items-center justify-center relative">
              {imageLoading ? (
                <div className="text-gray-400">Loading image...</div>
              ) : imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={`${item.brand} ${item.type}`} 
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.error('Failed to load image:', imageUrl);
                    setImageUrl(null);
                  }}
                />
              ) : (
                <div className="text-gray-400">
                  <div className="text-3xl mb-2">📷</div>
                  <div>No image</div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold">{item.brand} — {item.type}</h3>
              <div className="mt-2 text-sm text-gray-600">
                <div><strong>Size:</strong> {item.size}</div>
                <div><strong>Color:</strong> {item.color}</div>
                <div><strong>Cost:</strong> ${item.cost.toFixed(2)}</div>
                <div><strong>Added:</strong> {new Date(item.dateAdded).toLocaleString()}</div>
                {item.notes && <div className="mt-2"><strong>Notes:</strong> {item.notes}</div>}
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <div>No item selected</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ClothingDetailsDialog;
