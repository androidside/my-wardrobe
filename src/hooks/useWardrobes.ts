import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  createWardrobe,
  getWardrobes,
  updateWardrobe,
  deleteWardrobe,
  moveItemsToWardrobe,
  deleteItemsInWardrobe,
  getClothingItems,
} from '@/services/firestore';
import { Wardrobe, WardrobeInput } from '@/types/wardrobe';

export function useWardrobes() {
  const { user } = useAuth();
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [currentWardrobeId, setCurrentWardrobeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log when currentWardrobeId changes
  useEffect(() => {
    console.log('[useWardrobes] currentWardrobeId changed to:', currentWardrobeId);
  }, [currentWardrobeId]);

  const loadWardrobes = useCallback(async () => {
    if (!user) {
      setWardrobes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let loadedWardrobes = await getWardrobes(user.uid);
      
      // If no wardrobes exist, create default "Wardrobe 1"
      if (loadedWardrobes.length === 0) {
        try {
          const defaultWardrobeId = await createWardrobe(user.uid, { name: 'Wardrobe 1' });
          const defaultWardrobe: Wardrobe = {
            id: defaultWardrobeId,
            name: 'Wardrobe 1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          loadedWardrobes = [defaultWardrobe];
        } catch (createErr) {
          console.error('Failed to create default wardrobe:', createErr);
          // If creation fails, still set empty array to avoid infinite loop
          setWardrobes([]);
          setLoading(false);
          return;
        }
      }
      
      // Sort by creation date (oldest first)
      loadedWardrobes.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      setWardrobes((prevWardrobes) => {
        // Only set first wardrobe if currentWardrobeId is null
        // Use functional update to get current state
        return loadedWardrobes;
      });
      
      // Use functional update to check current state
      setCurrentWardrobeId((prevId) => {
        // Only set first wardrobe if no wardrobe is currently selected
        if (prevId === null && loadedWardrobes.length > 0) {
          console.log('[useWardrobes] loadWardrobes: Setting first wardrobe as current:', loadedWardrobes[0].id);
          return loadedWardrobes[0].id;
        }
        return prevId; // Keep current selection
      });
    } catch (err) {
      setError('Failed to load wardrobes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load wardrobes when user changes
  useEffect(() => {
    if (user) {
      loadWardrobes();
    } else {
      setWardrobes([]);
      setCurrentWardrobeId(null);
      setLoading(false);
    }
  }, [user, loadWardrobes]);

  // Set first wardrobe as current when wardrobes load (only if no wardrobe is selected)
  useEffect(() => {
    if (wardrobes.length > 0 && currentWardrobeId === null) {
      console.log('[useWardrobes] Setting first wardrobe as current:', wardrobes[0].id);
      setCurrentWardrobeId(wardrobes[0].id);
    }
  }, [wardrobes, currentWardrobeId]);

  const createNewWardrobe = useCallback(
    async (input: WardrobeInput): Promise<Wardrobe> => {
      if (!user) {
        throw new Error('User must be logged in to create wardrobes');
      }

      try {
        setError(null);
        const wardrobeId = await createWardrobe(user.uid, input);
        const newWardrobe: Wardrobe = {
          id: wardrobeId,
          name: input.name.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setWardrobes((prev) => [...prev, newWardrobe]);
        return newWardrobe;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create wardrobe';
        setError(errorMessage);
        throw err;
      }
    },
    [user]
  );

  const updateWardrobeName = useCallback(
    async (wardrobeId: string, input: WardrobeInput): Promise<void> => {
      if (!user) {
        throw new Error('User must be logged in to update wardrobes');
      }

      try {
        setError(null);
        await updateWardrobe(user.uid, wardrobeId, input);
        setWardrobes((prev) =>
          prev.map((w) =>
            w.id === wardrobeId
              ? { ...w, name: input.name.trim(), updatedAt: new Date().toISOString() }
              : w
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update wardrobe';
        setError(errorMessage);
        throw err;
      }
    },
    [user]
  );

  const removeWardrobe = useCallback(
    async (
      wardrobeId: string,
      keepItems: boolean,
      targetWardrobeId?: string
    ): Promise<void> => {
      if (!user) {
        throw new Error('User must be logged in to delete wardrobes');
      }

      // Prevent deleting the last wardrobe
      if (wardrobes.length <= 1) {
        throw new Error('Cannot delete the last wardrobe. You must have at least one wardrobe.');
      }

      try {
        setError(null);

        if (keepItems && targetWardrobeId) {
          // Move items to target wardrobe
          await moveItemsToWardrobe(user.uid, wardrobeId, targetWardrobeId);
        } else {
          // Delete all items in the wardrobe
          await deleteItemsInWardrobe(user.uid, wardrobeId);
        }

        // Delete the wardrobe
        await deleteWardrobe(user.uid, wardrobeId);
        
        // Update local state
        setWardrobes((prev) => prev.filter((w) => w.id !== wardrobeId));
        
        // If deleted wardrobe was current, switch to first available
        if (currentWardrobeId === wardrobeId) {
          const remaining = wardrobes.filter((w) => w.id !== wardrobeId);
          if (remaining.length > 0) {
            setCurrentWardrobeId(remaining[0].id);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete wardrobe';
        setError(errorMessage);
        throw err;
      }
    },
    [user, wardrobes, currentWardrobeId]
  );

  const getItemCount = useCallback(
    async (wardrobeId: string): Promise<number> => {
      if (!user) return 0;
      try {
        const items = await getClothingItems(user.uid, wardrobeId);
        return items.length;
      } catch {
        return 0;
      }
    },
    [user]
  );

  return {
    wardrobes,
    currentWardrobeId,
    setCurrentWardrobeId,
    loading,
    error,
    createNewWardrobe,
    updateWardrobeName,
    removeWardrobe,
    getItemCount,
    refresh: loadWardrobes,
  };
}

