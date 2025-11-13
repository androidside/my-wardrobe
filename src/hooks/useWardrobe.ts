import { useState, useEffect, useCallback } from 'react';
import { ClothingItem, ClothingItemInput } from '@/types/clothing';
import { storageService } from '@/utils/storage';

export function useWardrobe() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedItems = await storageService.getAllItems();
      setItems(loadedItems);
    } catch (err) {
      setError('Failed to load wardrobe items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = useCallback(async (input: ClothingItemInput): Promise<ClothingItem> => {
    try {
      setError(null);
      const newItem = await storageService.saveItem(input);
      setItems((prev) => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError('Failed to add item');
      console.error(err);
      throw err;
    }
  }, []);

  const updateItem = useCallback(
    async (id: string, updates: Partial<ClothingItemInput>): Promise<ClothingItem> => {
      try {
        setError(null);
        const updatedItem = await storageService.updateItem(id, updates);
        setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
        return updatedItem;
      } catch (err) {
        setError('Failed to update item');
        console.error(err);
        throw err;
      }
    },
    []
  );

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await storageService.deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
      throw err;
    }
  }, []);

  const getImageUrl = useCallback(async (imageId: string): Promise<string | null> => {
    try {
      return await storageService.getImageUrl(imageId);
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
