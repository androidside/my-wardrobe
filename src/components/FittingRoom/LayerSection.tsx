import { useState } from 'react';
import { ClothingItem } from '@/types/clothing';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayerSectionProps {
  title: string;
  description: string;
  items: ClothingItem[];
  selectedItems: ClothingItem[];
  imageUrls: Record<string, string | null>;
  onAdd: () => void;
  onRemove: (itemId: string) => void;
  onReorder?: (itemId: string, direction: 'up' | 'down') => void;
  allowMultiple?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function LayerSection({
  title,
  description,
  selectedItems,
  imageUrls,
  onAdd,
  onRemove,
  onReorder,
  allowMultiple = true,
  isExpanded = true,
  onToggle,
}: LayerSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(!isExpanded);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const canAddMore = allowMultiple || selectedItems.length === 0;

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {selectedItems.length > 0 && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
              {selectedItems.length}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 hidden sm:block">{description}</p>
      </button>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Selected Items */}
              {selectedItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedItems.map((item, index) => (
                    <Card key={item.id} className="p-3 relative">
                      <div className="flex items-center gap-3">
                        {/* Image */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                          {imageUrls[item.id] ? (
                            <img
                              src={imageUrls[item.id]!}
                              alt={item.brand}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl">📷</span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {item.brand}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {item.type}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              {item.color}
                            </span>
                            {item.pattern && item.pattern !== 'Solid' && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                {item.pattern}
                              </span>
                            )}
                            {item.formalityLevel && (
                              <span className="text-xs text-gray-600">
                                {'⭐'.repeat(item.formalityLevel)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1">
                          {onReorder && selectedItems.length > 1 && (
                            <>
                              {index > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => onReorder(item.id, 'up')}
                                  title="Move up (closer to skin)"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                              )}
                              {index < selectedItems.length - 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => onReorder(item.id, 'down')}
                                  title="Move down (outer layer)"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => onRemove(item.id)}
                            title="Remove item"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm italic">No items selected</p>
                  <p className="text-xs mt-1">{description}</p>
                </div>
              )}

              {/* Add Button */}
              {canAddMore && (
                <Button
                  variant="outline"
                  className="w-full border-dashed border-2"
                  onClick={onAdd}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {title}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
