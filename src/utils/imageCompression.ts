/**
 * Compress an image blob using HTML5 Canvas API
 * 
 * @param blob - The original image blob
 * @param maxWidth - Maximum width in pixels (maintains aspect ratio)
 * @param quality - JPEG quality (0.0 - 1.0)
 * @returns Compressed image blob
 */
export async function compressImage(
  blob: Blob,
  maxWidth: number = 1200,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create image from blob
    const img = new Image();
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.onload = () => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        
        // Calculate new dimensions (maintain aspect ratio)
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob(
          (compressedBlob) => {
            if (compressedBlob) {
              // Log compression results
              const originalSize = blob.size;
              const compressedSize = compressedBlob.size;
              const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
              
              console.log('[Image Compression]', {
                originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
                compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)} MB`,
                reduction: `${reduction}%`,
                dimensions: `${width}x${height}`,
                quality,
              });
              
              resolve(compressedBlob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        reject(error);
      } finally {
        // Clean up
        URL.revokeObjectURL(img.src);
      }
    };
    
    // Load the image
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Preset configurations for different use cases
 */
export const COMPRESSION_PRESETS = {
  /** High quality for detailed clothing photos (1200px, 85% quality) */
  HIGH_QUALITY: { maxWidth: 1200, quality: 0.85 },
  
  /** Balanced quality/size for general use (1000px, 80% quality) */
  BALANCED: { maxWidth: 1000, quality: 0.80 },
  
  /** Low file size for thumbnails (800px, 70% quality) */
  THUMBNAIL: { maxWidth: 800, quality: 0.70 },
} as const;
