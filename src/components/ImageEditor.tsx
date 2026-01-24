import { useState, useRef } from 'react';
import { Cropper, CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RotateCw, RotateCcw, Check, X } from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  open: boolean;
  onClose: () => void;
  onSave: (croppedImageBlob: Blob) => void;
}

export function ImageEditor({ imageUrl, open, onClose, onSave }: ImageEditorProps) {
  const cropperRef = useRef<CropperRef>(null);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const rotateImage = (direction: 'left' | 'right') => {
    setRotation((prev) => (direction === 'right' ? prev + 90 : prev - 90));
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const cropper = cropperRef.current;
      if (!cropper) {
        throw new Error('Cropper ref not available');
      }

      // Get the canvas with the cropped and rotated image
      const canvas = cropper.getCanvas({
        height: 2048, // Max height for good quality
        width: 2048,  // Max width for good quality
      });

      if (!canvas) {
        throw new Error('Failed to get canvas from cropper');
      }

      // Apply rotation if needed
      let finalCanvas = canvas;
      if (rotation !== 0) {
        const rotatedCanvas = document.createElement('canvas');
        const ctx = rotatedCanvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Calculate rotated dimensions
        const angle = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(angle));
        const sin = Math.abs(Math.sin(angle));
        
        rotatedCanvas.width = canvas.width * cos + canvas.height * sin;
        rotatedCanvas.height = canvas.width * sin + canvas.height * cos;

        // Rotate and draw
        ctx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
        ctx.rotate(angle);
        ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

        finalCanvas = rotatedCanvas;
      }

      // Convert to blob
      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            onSave(blob);
            onClose();
          } else {
            throw new Error('Failed to create blob from canvas');
          }
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setRotation(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent 
        className="max-w-full max-h-full w-full h-full m-0 p-0 rounded-none"
        hideCloseButton
      >
        {/* Fullscreen layout */}
        <div className="flex flex-col h-full w-full bg-black">
          {/* Crop area - takes all available space */}
          <div className="flex-1 relative min-h-0">
            <Cropper
              ref={cropperRef}
              src={imageUrl}
              className="h-full w-full"
              
              // Start with full image selected
              defaultSize={({ imageSize, visibleArea }) => {
                return {
                  width: (visibleArea || imageSize).width,
                  height: (visibleArea || imageSize).height,
                };
              }}
              
              // Configure stencil (crop box) behavior
              stencilProps={{
                // Show grid for alignment
                grid: true,
                
                // Configure handlers behavior
                handlers: {
                  // Corners: maintain aspect ratio
                  eastNorth: true,
                  eastSouth: true,
                  westNorth: true,
                  westSouth: true,
                  
                  // Edges: free aspect ratio
                  north: true,
                  south: true,
                  east: true,
                  west: true,
                },
                
                // Allow moving the crop box
                movable: true,
                
                // Allow resizing
                resizable: true,
                
                // Lines for grid
                lines: {},
              }}
              
              // Background styling
              backgroundClassName="bg-black"
            />
          </div>

          {/* Bottom toolbar - compact single line */}
          <div className="flex items-center justify-around bg-black border-t border-gray-700 py-3 px-4 safe-area-inset-bottom">
            {/* Cancel */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 text-white hover:text-gray-300 disabled:opacity-50 transition-colors min-w-[60px]"
            >
              <X className="h-6 w-6" />
              <span className="text-xs">Cancel</span>
            </button>

            {/* Rotate Left */}
            <button
              type="button"
              onClick={() => rotateImage('left')}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 text-white hover:text-gray-300 disabled:opacity-50 transition-colors min-w-[60px]"
            >
              <RotateCcw className="h-6 w-6" />
              <span className="text-xs">Rotate Left</span>
            </button>

            {/* Rotate Right */}
            <button
              type="button"
              onClick={() => rotateImage('right')}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 text-white hover:text-gray-300 disabled:opacity-50 transition-colors min-w-[60px]"
            >
              <RotateCw className="h-6 w-6" />
              <span className="text-xs">Rotate Right</span>
            </button>

            {/* Done/Choose */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 text-white hover:text-gray-300 disabled:opacity-50 transition-colors min-w-[60px]"
            >
              <Check className="h-6 w-6" />
              <span className="text-xs">{isProcessing ? 'Processing...' : 'Done'}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
