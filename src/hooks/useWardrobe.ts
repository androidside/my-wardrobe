import { useState, useEffect, useCallback, useRef } from 'react';
import { ClothingItem, ClothingItemInput } from '@/types/clothing';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { useAuth } from '@/contexts/AuthContext';

export function useWardrobe(wardrobeId?: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentWardrobeIdRef = useRef<string | undefined>(wardrobeId);

  // Update ref when wardrobeId changes
  useEffect(() => {
    currentWardrobeIdRef.current = wardrobeId;
    console.log('[useWardrobe] wardrobeId prop changed to:', wardrobeId);
  }, [wardrobeId]);

  // Load items when user or wardrobeId changes
  useEffect(() => {
    console.log('[useWardrobe] Effect triggered - wardrobeId:', wardrobeId, 'user:', user?.uid);
    
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (!wardrobeId) {
      // If user is logged in but no wardrobe selected, clear items
      setItems([]);
      setLoading(false);
      return;
    }

    // Store the wardrobeId for this effect run to check against later
    const effectWardrobeId = wardrobeId;
    let cancelled = false;

    const loadItems = async () => {
      try {
        setLoading(true);
        setError(null);
        // Clear items first when switching wardrobes
        setItems([]);
        
        console.log('[useWardrobe] Loading items for wardrobeId:', effectWardrobeId);
        const loadedItems = await wardrobeStorageService.getAllItems(user.uid, effectWardrobeId);
        console.log('[useWardrobe] Loaded', loadedItems.length, 'items for wardrobe:', effectWardrobeId);
        if (loadedItems.length > 0) {
          console.log('[useWardrobe] Sample item wardrobeIds:', loadedItems.slice(0, 3).map(i => ({ id: i.id, wardrobeId: i.wardrobeId })));
        }
        
        // Only update if this effect hasn't been cancelled AND the wardrobeId hasn't changed
        // Check against the ref to get the current value, not the closure value
        if (!cancelled && effectWardrobeId === currentWardrobeIdRef.current) {
          setItems(loadedItems);
          console.log('[useWardrobe] Items state updated with', loadedItems.length, 'items for wardrobe:', effectWardrobeId);
        } else {
          console.log('[useWardrobe] Load cancelled or wardrobeId changed - discarding results. Expected:', effectWardrobeId, 'Current:', currentWardrobeIdRef.current);
        }
      } catch (err) {
        if (!cancelled && effectWardrobeId === currentWardrobeIdRef.current) {
          setError('Failed to load wardrobe items');
          console.error('[useWardrobe] Error loading items:', err);
        }
      } finally {
        if (!cancelled && effectWardrobeId === currentWardrobeIdRef.current) {
          setLoading(false);
        }
      }
    };

    loadItems();

    // Cleanup function to cancel if wardrobeId changes before load completes
    return () => {
      console.log('[useWardrobe] Cleaning up effect for wardrobeId:', effectWardrobeId);
      cancelled = true;
    };
  }, [user, wardrobeId]); // wardrobeId is the key dependency - when it changes, reload

  const loadItems = useCallback(async (targetWardrobeId?: string) => {
    // Always use the current wardrobeId from ref, not from closure
    const idToUse = targetWardrobeId || currentWardrobeIdRef.current;
    console.log('[useWardrobe] loadItems called with wardrobeId:', idToUse, 'current ref:', currentWardrobeIdRef.current);
    
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (!idToUse) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Clear items first when switching wardrobes
      setItems([]);
      const loadedItems = await wardrobeStorageService.getAllItems(user.uid, idToUse);
      console.log('[useWardrobe] loadItems loaded', loadedItems.length, 'items for wardrobe:', idToUse);
      
      // Only set items if we're still loading for the same wardrobe
      if (idToUse === currentWardrobeIdRef.current) {
        setItems(loadedItems);
        console.log('[useWardrobe] loadItems set items successfully');
      } else {
        console.log('[useWardrobe] loadItems discarded - wardrobeId changed. Expected:', idToUse, 'Current:', currentWardrobeIdRef.current);
      }
    } catch (err) {
      if (idToUse === currentWardrobeIdRef.current) {
        setError('Failed to load wardrobe items');
        console.error(err);
      }
    } finally {
      if (idToUse === currentWardrobeIdRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  const addItem = useCallback(
    async (input: ClothingItemInput, itemWardrobeId?: string): Promise<ClothingItem> => {
      if (!user) {
        throw new Error('User must be logged in to add items');
      }

      try {
        setError(null);
        // Use provided itemWardrobeId or fall back to current wardrobeId
        const targetWardrobeId = itemWardrobeId || wardrobeId;
        const newItem = await wardrobeStorageService.saveItem(user.uid, input, targetWardrobeId);
        // Only add to items if it belongs to current wardrobe
        if (!wardrobeId || newItem.wardrobeId === wardrobeId) {
          setItems((prev) => [...prev, newItem]);
        }
        return newItem;
      } catch (err) {
        setError('Failed to add item');
        console.error(err);
        throw err;
      }
    },
    [user, wardrobeId]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<ClothingItemInput>, newWardrobeId?: string): Promise<ClothingItem> => {
      if (!user) {
        throw new Error('User must be logged in to update items');
      }

      try {
        setError(null);
        const updatedItem = await wardrobeStorageService.updateItem(user.uid, id, updates, newWardrobeId);
        
        // If wardrobe changed, remove from current list (it will appear in the new wardrobe)
        if (newWardrobeId && newWardrobeId !== wardrobeId) {
          setItems((prev) => prev.filter((item) => item.id !== id));
        } else {
          // Otherwise, update in place
          setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
        }
        return updatedItem;
      } catch (err) {
        setError('Failed to update item');
        console.error(err);
        throw err;
      }
    },
    [user, wardrobeId]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      if (!user) {
        throw new Error('User must be logged in to delete items');
      }

      try {
        setError(null);
        await wardrobeStorageService.deleteItem(user.uid, id);
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        setError('Failed to delete item');
        console.error(err);
        throw err;
      }
    },
    [user]
  );

  const getImageUrl = useCallback(async (imageId: string): Promise<string | null> => {
    try {
      return await wardrobeStorageService.getImageUrl(imageId);
    } catch (err) {
      console.error('Failed to get image URL:', err);
      return null;
    }
  }, []);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    getImageUrl,
    refresh: loadItems,
  };
}
