import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWardrobeContext } from '@/contexts/WardrobeContext';

interface EditWardrobeDialogProps {
  wardrobeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWardrobeDialog({ wardrobeId, open, onOpenChange }: EditWardrobeDialogProps) {
  const { wardrobes, updateWardrobeName } = useWardrobeContext();
  const wardrobe = wardrobes.find((w) => w.id === wardrobeId);
  const [name, setName] = useState(wardrobe?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wardrobe) {
      setName(wardrobe.name);
    }
  }, [wardrobe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Wardrobe name is required');
      return;
    }

    if (name.trim() === wardrobe?.name) {
      onOpenChange(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateWardrobeName(wardrobeId, { name: name.trim() });
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
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
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

