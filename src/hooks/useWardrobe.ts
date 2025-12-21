import { useState, useEffect, useCallback } from 'react';
import { ClothingItem, ClothingItemInput } from '@/types/clothing';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { useAuth } from '@/contexts/AuthContext';

export function useWardrobe() {
  const { user } = useAuth();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load items when user changes
  useEffect(() => {
    if (user) {
      loadItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const loadItems = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const loadedItems = await wardrobeStorageService.getAllItems(user.uid);
      setItems(loadedItems);
    } catch (err) {
      setError('Failed to load wardrobe items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = useCallback(
    async (input: ClothingItemInput): Promise<ClothingItem> => {
      if (!user) {
        throw new Error('User must be logged in to add items');
      }

      try {
        setError(null);
        const newItem = await wardrobeStorageService.saveItem(user.uid, input);
        setItems((prev) => [...prev, newItem]);
        return newItem;
      } catch (err) {
        setError('Failed to add item');
        console.error(err);
        throw err;
      }
    },
    [user]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<ClothingItemInput>): Promise<ClothingItem> => {
      if (!user) {
        throw new Error('User must be logged in to update items');
      }

      try {
        setError(null);
        const updatedItem = await wardrobeStorageService.updateItem(user.uid, id, updates);
        setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
        return updatedItem;
      } catch (err) {
        setError('Failed to update item');
        console.error(err);
        throw err;
      }
    },
    [user]
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
