import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CustomTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTag: (tagName: string) => Promise<void>;
  existingTags: string[];
}

export function CustomTagDialog({ open, onOpenChange, onCreateTag, existingTags }: CustomTagDialogProps) {
  const [tagName, setTagName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTag = tagName.trim();

    // Validation
    if (!trimmedTag) {
      setError('Tag name cannot be empty');
      return;
    }

    if (trimmedTag.length < 2) {
      setError('Tag name must be at least 2 characters');
      return;
    }

    if (trimmedTag.length > 30) {
      setError('Tag name must be 30 characters or less');
      return;
    }

    // Check for duplicates (case-insensitive)
    const lowerTag = trimmedTag.toLowerCase();
    if (existingTags.some(tag => tag.toLowerCase() === lowerTag)) {
      setError('This tag already exists');
      return;
    }

    try {
      setIsCreating(true);
      await onCreateTag(trimmedTag);
      setTagName('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setTagName('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom Tag</DialogTitle>
          <DialogDescription>
            Add a custom tag to organize your wardrobe items. This tag will be saved and reusable for future items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tagName">Tag Name</Label>
            <Input
              id="tagName"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="e.g., Wedding, Concert, Hiking"
              maxLength={30}
              autoFocus
              className="mt-1"
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {tagName.length}/30 characters
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !tagName.trim()}>
              {isCreating ? 'Creating...' : 'Create Tag'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
