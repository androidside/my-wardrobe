import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWardrobeContext } from '@/contexts/WardrobeContext';
import { useAuth } from '@/contexts/AuthContext';
import { updateWardrobeShareableStatus } from '@/services/firestore';

interface EditWardrobeDialogProps {
  wardrobeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWardrobeDialog({ wardrobeId, open, onOpenChange }: EditWardrobeDialogProps) {
  const { user } = useAuth();
  const { wardrobes, updateWardrobeName } = useWardrobeContext();
  const wardrobe = wardrobes.find((w) => w.id === wardrobeId);
  const [name, setName] = useState(wardrobe?.name || '');
  const [isShareable, setIsShareable] = useState(wardrobe?.isShareable ?? false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wardrobe) {
      setName(wardrobe.name);
      setIsShareable(wardrobe.isShareable ?? false);
    }
  }, [wardrobe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Wardrobe name is required');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    const nameChanged = name.trim() !== wardrobe?.name;
    const shareableChanged = isShareable !== (wardrobe?.isShareable ?? false);

    if (!nameChanged && !shareableChanged) {
      onOpenChange(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Update name if changed
      if (nameChanged) {
        await updateWardrobeName(wardrobeId, { name: name.trim() });
      }
      
      // Update shareable status if changed
      if (shareableChanged) {
        await updateWardrobeShareableStatus(user.uid, wardrobeId, isShareable);
      }
      
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wardrobe');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName(wardrobe?.name || '');
      setIsShareable(wardrobe?.isShareable ?? false);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  if (!wardrobe) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Wardrobe Name</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wardrobe-name">Wardrobe Name</Label>
              <Input
                id="wardrobe-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., New York, Home, Office"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="shareable-toggle">Share with Friends</Label>
                  <p className="text-sm text-gray-500">
                    Allow your friends to view this wardrobe
                  </p>
                </div>
                <Switch
                  id="shareable-toggle"
                  checked={isShareable}
                  onCheckedChange={setIsShareable}
                />
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

