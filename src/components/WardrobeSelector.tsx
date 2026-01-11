import { useState, useEffect } from 'react';
import { useWardrobeContext } from '@/contexts/WardrobeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WardrobeSelectorProps {
  onWardrobeChange?: (wardrobeId: string) => void;
}

export function WardrobeSelector({ onWardrobeChange }: WardrobeSelectorProps) {
  const {
    wardrobes,
    currentWardrobeId,
    setCurrentWardrobeId,
    loading,
    getItemCount,
  } = useWardrobeContext();
  
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});

  // Load item counts for all wardrobes
  useEffect(() => {
    const loadCounts = async () => {
      const counts: Record<string, number> = {};
      for (const wardrobe of wardrobes) {
        counts[wardrobe.id] = await getItemCount(wardrobe.id);
      }
      setItemCounts(counts);
    };

    if (wardrobes.length > 0) {
      loadCounts();
    }
  }, [wardrobes, getItemCount]);

  const handleWardrobeChange = (wardrobeId: string) => {
    console.log('[WardrobeSelector] Changing wardrobe to:', wardrobeId, 'from:', currentWardrobeId);
    setCurrentWardrobeId(wardrobeId);
    console.log('[WardrobeSelector] setCurrentWardrobeId called');
    onWardrobeChange?.(wardrobeId);
  };

  const currentWardrobe = wardrobes.find((w) => w.id === currentWardrobeId);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-32 bg-gray-200 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={currentWardrobeId || undefined}
          onValueChange={(value) => {
            console.log('[WardrobeSelector] Select onValueChange called with:', value);
            handleWardrobeChange(value);
          }}
        >
          <SelectTrigger className="w-auto min-w-[180px] sm:min-w-[220px]">
            <SelectValue placeholder="Select wardrobe">
              {currentWardrobe ? (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{currentWardrobe.name}</span>
                  {itemCounts[currentWardrobe.id] !== undefined && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({itemCounts[currentWardrobe.id]})
                    </span>
                  )}
                </div>
              ) : (
                'Select wardrobe'
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {wardrobes.map((wardrobe) => (
              <SelectItem key={wardrobe.id} value={wardrobe.id}>
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{wardrobe.name}</span>
                  {itemCounts[wardrobe.id] !== undefined && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({itemCounts[wardrobe.id]})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

