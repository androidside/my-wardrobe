import { ClothingItem, ClothingItemInput } from '@/types/clothing';
import { imageStorage } from './imageStorage';

const STORAGE_KEY = 'wardrobe_items';

/**
 * Storage service that abstracts localStorage and IndexedDB operations
 * This makes it easy to swap out the implementation later (e.g., to use a backend API)
 */
class StorageService {
  /**
   * Get all clothing items from localStorage
   */
  async getAllItems(): Promise<ClothingItem[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting items from storage:', error);
      return [];
    }
  }

  /**
   * Get a single clothing item by ID
   */
  async getItem(id: string): Promise<ClothingItem | null> {
    const items = await this.getAllItems();
    return items.find((item) => item.id === id) || null;
  }

  /**
   * Save a new clothing item
   */
  async saveItem(input: ClothingItemInput): Promise<ClothingItem> {
    try {
      // Generate unique ID
      const id = this.generateId();
      const imageId = `img_${id}`;

      // Save image to IndexedDB
      await imageStorage.saveImage(imageId, input.imageBlob);

      // Create clothing item
      const item: ClothingItem = {
        id,
        type: input.type,
        brand: input.brand,
        size: input.size,
        color: input.color,
        cost: input.cost,
        imageId,
        dateAdded: new Date().toISOString(),
        notes: input.notes,
      };

      // Save to localStorage
      const items = await this.getAllItems();
      items.push(item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

      return item;
    } catch (error) {
      console.error('Error saving item:', error);
      throw new Error('Failed to save clothing item');
    }
  }

  /**
   * Update an existing clothing item
   */
  async updateItem(
    id: string,
    updates: Partial<ClothingItemInput>
  ): Promise<ClothingItem> {
    try {
      const items = await this.getAllItems();
      const index = items.findIndex((item) => item.id === id);

      if (index === -1) {
        throw new Error('Item not found');
      }

      const existingItem = items[index];

      // If new image provided, update it in IndexedDB
      if (updates.imageBlob) {
        await imageStorage.saveImage(existingItem.imageId, updates.imageBlob);
      }

      // Update item metadata
      const updatedItem: ClothingItem = {
        ...existingItem,
        type: updates.type ?? existingItem.type,
        brand: updates.brand ?? existingItem.brand,
        size: updates.size ?? existingItem.size,
        color: updates.color ?? existingItem.color,
        cost: updates.cost ?? existingItem.cost,
        notes: updates.notes ?? existingItem.notes,
      };

      items[index] = updatedItem;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

      return updatedItem;
    } catch (error) {
      console.error('Error updating item:', error);
      throw new Error('Failed to update clothing item');
    }
  }

  /**
   * Delete a clothing item
   */
  async deleteItem(id: string): Promise<void> {
    try {
      const items = await this.getAllItems();
      const item = items.find((i) => i.id === id);

      if (!item) {
        throw new Error('Item not found');
      }

      // Delete image from IndexedDB
      await imageStorage.deleteImage(item.imageId);

      // Remove from localStorage
      const filteredItems = items.filter((i) => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredItems));
    } catch (error) {
      console.error('Error deleting item:', error);
      throw new Error('Failed to delete clothing item');
    }
  }

  /**
   * Get image URL for a clothing item
   */
  async getImageUrl(imageId: string): Promise<string | null> {
    try {
      const blob = await imageStorage.getImage(imageId);
      return blob ? imageStorage.createObjectURL(blob) : null;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  }

  /**
   * Generate a unique ID for clothing items
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all data (useful for testing/debugging)
   */
  async clearAll(): Promise<void> {
    try {
      // Get all items to delete their images
      const items = await this.getAllItems();

      // Delete all images from IndexedDB
      for (const item of items) {
        await imageStorage.deleteImage(item.imageId);
      }

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
