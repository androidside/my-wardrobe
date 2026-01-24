import { useEffect, useState } from 'react';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClothingItem, ClothingColor } from '@/types/clothing';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { getCategoryForType } from '@/types/clothing';

interface ClothingDetailsDialogProps {
  item: ClothingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (item: ClothingItem) => void;
  onDelete?: (id: string) => void;
}

// Color hex mapping for visual swatches
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

export function ClothingDetailsDialog({ item, open, onOpenChange, onEdit, onDelete }: ClothingDetailsDialogProps) {
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

  // Get formality emoji
  const getFormalityEmoji = (level: number) => {
    switch (level) {
      case 1: return '🩴';
      case 2: return '👕';
      case 3: return '👔';
      case 4: return '🎩';
      case 5: return '🤵';
      default: return '👔';
    }
  };

  // Get formality text
  const getFormalityText = (level: number) => {
    switch (level) {
      case 1: return 'Very Informal';
      case 2: return 'Informal';
      case 3: return 'Casual';
      case 4: return 'Formal';
      case 5: return 'Very Formal';
      default: return 'Casual';
    }
  };

  // Get pattern emoji
  const getPatternEmoji = (pattern: string) => {
    const patternEmojis: Record<string, string> = {
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
    return patternEmojis[pattern] || '⬜';
  };

  const handleDelete = () => {
    if (item && onDelete) {
      if (confirm(`Are you sure you want to delete ${item.brand} ${item.type}?`)) {
        onDelete(item.id);
        onOpenChange(false);
      }
    }
  };

  const handleEdit = () => {
    if (item && onEdit) {
      onEdit(item);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" hideCloseButton>
        {/* Accessible title and description for screen readers */}
        <DialogTitle className="sr-only">
          {item ? `${item.brand} ${item.type}` : 'Clothing Item Details'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {item ? `View details for ${item.brand} ${item.type} - Size ${item.size}, ${item.color}` : 'View clothing item details'}
        </DialogDescription>
        
        {item ? (
          <div className="space-y-0">
            {/* Header with Actions */}
            <div className="flex items-center justify-between pb-4 border-b sticky top-0 bg-white z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Hero Image */}
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center my-4">
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
                <div className="text-gray-400 text-center">
                  <div className="text-5xl mb-2">📷</div>
                  <div className="text-sm">No image</div>
                </div>
              )}
            </div>

            {/* Title Section */}
            <div className="space-y-1 pb-4">
              <h2 className="text-2xl font-bold text-gray-900">🏷️ {item.brand}</h2>
              <p className="text-lg text-gray-600">{item.type} • Size {item.size}</p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-3 gap-3 pb-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">${item.cost.toFixed(2)}</div>
                <div className="text-xs text-green-600 font-medium mt-1">Price</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-3xl">{getFormalityEmoji(item.formalityLevel || 3)}</div>
                <div className="text-xs text-purple-700 font-medium mt-1">{getFormalityText(item.formalityLevel || 3)}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-sm font-bold text-blue-700">
                  {new Date(item.dateAdded).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <div className="text-xs text-blue-600 font-medium mt-1">Added</div>
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Details</h3>
              
              {/* Primary Color */}
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Primary Color:</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{
                      background: COLOR_HEX_MAP[item.color] || '#CCCCCC',
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">{item.color}</span>
                </div>
              </div>

              {/* Additional Colors */}
              {item.colors && item.colors.length > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Additional Colors:</span>
                  <div className="flex items-center gap-2">
                    {item.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{
                          background: COLOR_HEX_MAP[color as ClothingColor] || '#CCCCCC',
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pattern */}
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Pattern:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getPatternEmoji(item.pattern || 'Solid')}</span>
                  <span className="text-sm font-medium text-gray-900">{item.pattern || 'Solid'}</span>
                </div>
              </div>

              {/* Category */}
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-medium text-gray-900">
                  {item.category || getCategoryForType(item.type)}
                </span>
              </div>

              {/* Wardrobe */}
              {item.wardrobeId && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Wardrobe:</span>
                  <span className="text-sm font-medium text-gray-900">{item.wardrobeId}</span>
                </div>
              )}
            </div>

            {/* Tags Section */}
            {item.tags && item.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">📝 Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {item.notes && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">💭 Notes</h3>
                <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  {item.notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No item selected</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ClothingDetailsDialog;
