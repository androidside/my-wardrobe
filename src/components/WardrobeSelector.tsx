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
  } = useWardrobeContext();

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
    <Select
      value={currentWardrobeId || undefined}
      onValueChange={(value) => {
        console.log('[WardrobeSelector] Select onValueChange called with:', value);
        handleWardrobeChange(value);
      }}
    >
      <SelectTrigger className="w-full bg-white shadow">
        <SelectValue placeholder="Select wardrobe">
          {currentWardrobe ? currentWardrobe.name : 'Select wardrobe'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {wardrobes.map((wardrobe) => (
          <SelectItem key={wardrobe.id} value={wardrobe.id}>
            {wardrobe.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

