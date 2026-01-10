import { ClothingItem, ClothingItemInput } from '@/types/clothing';
import {
  saveClothingItem,
  getClothingItems,
  updateClothingItem,
  deleteClothingItem,
} from './firestore';
import { uploadImage, deleteImage } from './storage';
import { migrateItem, migrateItems } from '@/utils/clothingMigration';

/**
 * Unified storage service for wardrobe items
 * Uses Firebase Firestore for metadata and Firebase Storage for images
 */
class WardrobeStorageService {
  /**
   * Get all clothing items for a user
   * @param wardrobeId Optional - filter items by wardrobe ID
   */
  async getAllItems(userId: string, wardrobeId?: string): Promise<ClothingItem[]> {
    try {
      const items = await getClothingItems(userId, wardrobeId);
      // Migrate items to new structure if needed
      return migrateItems(items);
    } catch (error) {
      console.error('Error getting items:', error);
      throw error;
    }
  }

  /**
   * Get a single clothing item by ID
   */
  async getItem(userId: string, id: string, wardrobeId?: string): Promise<ClothingItem | null> {
    try {
      const items = await this.getAllItems(userId, wardrobeId);
      const item = items.find((item) => item.id === id) || null;
      // Ensure item is migrated
      return item ? migrateItems([item])[0] : null;
    } catch (error) {
      console.error('Error getting item:', error);
      throw error;
    }
  }

  /**
   * Save a new clothing item
   * @param wardrobeId Optional - assign item to a specific wardrobe
   */
  async saveItem(userId: string, input: ClothingItemInput, wardrobeId?: string): Promise<ClothingItem> {
    try {
      // Generate a temporary ID for the item (will be replaced by Firestore)
      // We use this to organize the image in storage, but the actual item ID comes from Firestore
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Convert blob to File for Firebase Storage
      const file = new File([input.imageBlob], `image_${Date.now()}.jpg`, {
        type: input.imageBlob.type || 'image/jpeg',
      });

      console.log('Uploading image to Firebase Storage...', { userId, tempId, fileSize: file.size });
      
      // Upload image to Firebase Storage first
      let imageUrl: string;
      try {
        imageUrl = await uploadImage(userId, tempId, file);
        console.log('Image uploaded successfully:', imageUrl);
      } catch (imageError) {
        console.error('Failed to upload image:', imageError);
        throw new Error(`Failed to upload image: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
      }

      // Create clothing item (imageId will store the Firebase Storage URL)
      // Only include notes if it's provided (Firestore doesn't like undefined)
      const itemData: Omit<ClothingItem, 'id'> = {
        category: input.category,
        type: input.type,
        brand: input.brand,
        size: input.size,
        color: input.color,
        cost: input.cost,
        imageId: imageUrl, // Store Firebase Storage URL
        dateAdded: new Date().toISOString(),
        migrated: true, // New items are already in new format
        ...(input.tags && input.tags.length > 0 && { tags: input.tags }), // Include tags if provided
        ...(input.colors && input.colors.length > 0 && { colors: input.colors }), // Include additional colors if provided
        ...(input.pattern && input.pattern !== 'Solid' && { pattern: input.pattern }), // Include pattern if not Solid
        ...(input.notes && { notes: input.notes }), // Only include notes if provided
        ...(wardrobeId && { wardrobeId }), // Include wardrobeId if provided
      };

      console.log('Saving item to Firestore...', { userId, itemData });
      
      // Save to Firestore (this will generate the actual ID)
      let itemId: string;
      try {
        itemId = await saveClothingItem(userId, itemData);
        console.log('Item saved successfully with ID:', itemId);
      } catch (firestoreError) {
        console.error('Failed to save to Firestore:', firestoreError);
        // Try to clean up the uploaded image if Firestore save fails
        try {
          // Extract path from URL and delete
          const url = new URL(imageUrl);
          const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
          if (pathMatch) {
            const storagePath = decodeURIComponent(pathMatch[1]);
            await deleteImage(storagePath);
            console.log('Cleaned up uploaded image after Firestore error');
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup image:', cleanupError);
        }
        throw new Error(`Failed to save item: ${firestoreError instanceof Error ? firestoreError.message : 'Unknown error'}`);
      }

      return {
        id: itemId,
        ...itemData,
      };
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  }

  /**
   * Update an existing clothing item
   */
  async updateItem(
    userId: string,
    id: string,
    updates: Partial<ClothingItemInput>,
    newWardrobeId?: string
  ): Promise<ClothingItem> {
    try {
      const existingItem = await this.getItem(userId, id);
      if (!existingItem) {
        throw new Error('Item not found');
      }

      // Ensure item is migrated before updating
      const migratedItem = migrateItem(existingItem);

      let imageUrl = migratedItem.imageId;

      // If new image provided, upload it and delete the old one
      if (updates.imageBlob) {
        // Delete old image from Firebase Storage
        try {
          // Extract path from URL or use the stored path
          // For now, we'll upload new image and keep old URL reference
          // In production, you'd want to extract the path from the URL and delete it
          const file = new File([updates.imageBlob], `image_${Date.now()}.jpg`, {
            type: updates.imageBlob.type || 'image/jpeg',
          });
          imageUrl = await uploadImage(userId, id, file);
        } catch (error) {
          console.error('Error updating image:', error);
          // Continue with metadata update even if image update fails
        }
      }

      // Prepare update data
      // Use migrated item as base
      const updateData: Partial<ClothingItem> = {
        category: updates.category ?? migratedItem.category,
        type: updates.type ?? migratedItem.type,
        brand: updates.brand ?? migratedItem.brand,
        size: updates.size ?? migratedItem.size,
        color: updates.color ?? migratedItem.color,
        cost: updates.cost ?? migratedItem.cost,
        imageId: imageUrl,
        migrated: true, // Mark as migrated
      };
      
      // Handle tags
      if (updates.tags !== undefined) {
        updateData.tags = updates.tags;
      } else if (migratedItem.tags) {
        updateData.tags = migratedItem.tags;
      }
      
      // Handle colors
      if (updates.colors !== undefined) {
        updateData.colors = updates.colors && updates.colors.length > 0 ? updates.colors : undefined;
      } else if (migratedItem.colors && migratedItem.colors.length > 0) {
        updateData.colors = migratedItem.colors;
      }
      
      // Handle pattern
      if (updates.pattern !== undefined) {
        updateData.pattern = updates.pattern && updates.pattern !== 'Solid' ? updates.pattern : undefined;
      } else if (migratedItem.pattern && migratedItem.pattern !== 'Solid') {
        updateData.pattern = migratedItem.pattern;
      }
      
      // Handle notes separately to avoid undefined
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes || undefined;
      } else if (migratedItem.notes) {
        updateData.notes = migratedItem.notes;
      }

      // Handle wardrobeId change
      if (newWardrobeId !== undefined) {
        updateData.wardrobeId = newWardrobeId || undefined;
      } else if (migratedItem.wardrobeId) {
        // Keep existing wardrobeId if not changing
        updateData.wardrobeId = migratedItem.wardrobeId;
      }
      
      // Keep legacyType for reference if it exists
      if (migratedItem.legacyType) {
        updateData.legacyType = migratedItem.legacyType;
      }

      // Update in Firestore
      await updateClothingItem(userId, id, updateData);

      return {
        ...existingItem,
        ...updateData,
      };
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  /**
   * Delete a clothing item
   */
  async deleteItem(userId: string, id: string): Promise<void> {
    try {
      const item = await this.getItem(userId, id);
      if (!item) {
        throw new Error('Item not found');
      }

      // Delete image from Firebase Storage
      // The imageId contains the full URL, we need to extract the path
      try {
        // Extract path from Firebase Storage URL
        // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
        const url = new URL(item.imageId);
        const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
        if (pathMatch) {
          const storagePath = decodeURIComponent(pathMatch[1]);
          await deleteImage(storagePath);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        // Continue with item deletion even if image deletion fails
      }

      // Delete item from Firestore
      await deleteClothingItem(userId, id);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  /**
   * Get image URL for a clothing item
   * For Firebase Storage, the imageId already contains the URL
   */
  async getImageUrl(imageId: string): Promise<string | null> {
    try {
      // If imageId is already a URL (Firebase Storage), return it directly
      if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
        return imageId;
      }
      // Otherwise, it might be a local storage reference (for backwards compatibility)
      return null;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  }
}

// Export singleton instance
export const wardrobeStorageService = new WardrobeStorageService();

