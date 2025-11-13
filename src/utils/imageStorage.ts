/**
 * IndexedDB wrapper for storing clothing images as Blobs
 */

const DB_NAME = 'WardrobeDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

class ImageStorage {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  /**
   * Initialize IndexedDB database
   */
  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Save an image blob to IndexedDB
   * @param id Unique identifier for the image
   * @param blob Image blob to store
   */
  async saveImage(id: string, blob: Blob): Promise<void> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id, blob });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save image'));
    });
  }

  /**
   * Get an image blob from IndexedDB
   * @param id Unique identifier for the image
   * @returns Image blob or null if not found
   */
  async getImage(id: string): Promise<Blob | null> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };
      request.onerror = () => reject(new Error('Failed to get image'));
    });
  }

  /**
   * Delete an image from IndexedDB
   * @param id Unique identifier for the image
   */
  async deleteImage(id: string): Promise<void> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete image'));
    });
  }

  /**
   * Get all image IDs from IndexedDB
   * @returns Array of image IDs
   */
  async getAllImageIds(): Promise<string[]> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };
      request.onerror = () => reject(new Error('Failed to get image IDs'));
    });
  }

  /**
   * Convert a Blob to an Object URL for display
   * @param blob Image blob
   * @returns Object URL string
   */
  createObjectURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Revoke an Object URL to free memory
   * @param url Object URL to revoke
   */
  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }
}

// Export a singleton instance
export const imageStorage = new ImageStorage();
