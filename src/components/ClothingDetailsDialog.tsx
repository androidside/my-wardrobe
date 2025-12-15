import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClothingItem } from '@/types/clothing';
import { storageService } from '@/utils/storage';

interface ClothingDetailsDialogProps {
  item: ClothingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClothingDetailsDialog({ item, open, onOpenChange }: ClothingDetailsDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (item && open) {
      storageService.getImageUrl(item.imageId).then((url) => {
        if (mounted) setImageUrl(url);
      });
    }
    return () => {
      mounted = false;
      setImageUrl(null);
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
            <div className="aspect-[4/3] bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt={`${item.brand} ${item.type}`} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400">No image</div>
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
