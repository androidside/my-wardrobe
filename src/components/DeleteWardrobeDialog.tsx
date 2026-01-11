import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useWardrobeContext } from '@/contexts/WardrobeContext';
import { getClothingItems } from '@/services/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface DeleteWardrobeDialogProps {
  wardrobeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteWardrobeDialog({ wardrobeId, open, onOpenChange }: DeleteWardrobeDialogProps) {
  const { user } = useAuth();
  const { wardrobes, removeWardrobe, currentWardrobeId } = useWardrobeContext();
  const wardrobe = wardrobes.find((w) => w.id === wardrobeId);
  const [keepItems, setKeepItems] = useState(true);
  const [targetWardrobeId, setTargetWardrobeId] = useState<string>('');
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available wardrobes to move items to (excluding current wardrobe)
  const availableWardrobes = wardrobes.filter((w) => w.id !== wardrobeId);

  // Load item count
  useEffect(() => {
    const loadItemCount = async () => {
      if (!user || !wardrobeId) return;
      try {
        const items = await getClothingItems(user.uid, wardrobeId);
        setItemCount(items.length);
      } catch {
        setItemCount(0);
      }
    };

    if (open && wardrobeId) {
      loadItemCount();
      // Set default target wardrobe to first available (or current if not the one being deleted)
      if (availableWardrobes.length > 0) {
        const defaultTarget = currentWardrobeId !== wardrobeId 
          ? currentWardrobeId 
          : availableWardrobes[0].id;
        if (defaultTarget) {
          setTargetWardrobeId(defaultTarget);
        }
      }
    }
  }, [open, wardrobeId, user, availableWardrobes, currentWardrobeId]);

  const handleDelete = async () => {
    if (keepItems && !targetWardrobeId) {
      setError('Please select a wardrobe to move items to');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await removeWardrobe(wardrobeId, keepItems, keepItems ? targetWardrobeId : undefined);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete wardrobe');
    } finally {
      setLoading(false);
    }
  };

  if (!wardrobe) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Wardrobe</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{wardrobe.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {itemCount > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What would you like to do with the {itemCount} item{itemCount !== 1 ? 's' : ''} in this wardrobe?</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="keepItems"
                      checked={keepItems}
                      onChange={() => setKeepItems(true)}
                      className="w-4 h-4"
                    />
                    <span>Move items to another wardrobe</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="keepItems"
                      checked={!keepItems}
                      onChange={() => setKeepItems(false)}
                      className="w-4 h-4"
                    />
                    <span>Delete all items</span>
                  </label>
                </div>
              </div>

              {keepItems && (
                <div className="space-y-2">
                  <Label htmlFor="target-wardrobe">Move items to</Label>
                  <Select
                    value={targetWardrobeId}
                    onValueChange={setTargetWardrobeId}
                  >
                    <SelectTrigger id="target-wardrobe">
                      <SelectValue placeholder="Select wardrobe" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWardrobes.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || (keepItems && !targetWardrobeId)}
          >
            {loading ? 'Deleting...' : 'Delete Wardrobe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

