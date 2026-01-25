import { useState, useEffect, useMemo } from 'react';
import { ClothingItem } from '@/types/clothing';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface ItemPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: ClothingItem[];
  title: string;
  onSelect: (item: ClothingItem) => void;
  excludeIds?: string[];
}

export function ItemPickerDialog({
  isOpen,
  onClose,
  items,
  title,
  onSelect,
  excludeIds = [],
}: ItemPickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});

  // Get unique categories and types from items
  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [items]);

  const types = useMemo(() => {
    const typeSet = new Set<string>();
    items
      .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
      .forEach(item => typeSet.add(item.type));
    return Array.from(typeSet).sort();
  }, [items, selectedCategory]);

  // Reset type filter when category changes
  useEffect(() => {
    setSelectedType('all');
  }, [selectedCategory]);

  // Reset filters when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedType('all');
    }
  }, [isOpen]);

  // Filter items by search, category, and type
  const filteredItems = useMemo(() => {
    return items
      .filter(item => !excludeIds.includes(item.id))
      .filter(item => {
        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        
        // Type filter
        if (selectedType !== 'all' && item.type !== selectedType) {
          return false;
        }
        
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            item.brand.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query) ||
            item.color.toLowerCase().includes(query) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
          );
        }
        
        return true;
      });
  }, [items, excludeIds, selectedCategory, selectedType, searchQuery]);

  // Load images for visible items
  useEffect(() => {
    if (!isOpen) return;

    const loadImages = async () => {
      const urls: Record<string, string | null> = {};
      const visibleItems = filteredItems.slice(0, 20);

      for (const item of visibleItems) {
        try {
          const url = await wardrobeStorageService.getImageUrl(item.imageId);
          urls[item.id] = url;
        } catch (error) {
          console.error('Failed to load image:', error);
          urls[item.id] = null;
        }
      }

      setImageUrls(urls);
    };

    loadImages();
  }, [isOpen, filteredItems]);

  const handleSelect = (item: ClothingItem) => {
    onSelect(item);
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
    onClose();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-3">
          {/* Category and Type Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Filter */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Type
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by brand, color, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Indicator */}
          {(selectedCategory !== 'all' || selectedType !== 'all' || searchQuery) && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Filters active: {selectedCategory !== 'all' && 'Category'} {selectedType !== 'all' && 'Type'} {searchQuery && 'Search'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 px-2 text-xs"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="group bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {imageUrls[item.id] ? (
                      <img
                        src={imageUrls[item.id]!}
                        alt={item.brand}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-4xl">📷</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {item.brand}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {item.type}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {item.color}
                      </span>
                      {item.formalityLevel && (
                        <span className="text-xs">
                          {'⭐'.repeat(Math.min(item.formalityLevel, 3))}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-sm">No items found</p>
              {(selectedCategory !== 'all' || selectedType !== 'all' || searchQuery) && (
                <Button
                  variant="link"
                  onClick={handleClearFilters}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-600">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </p>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
