import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RotateCw, RotateCcw, Check, X } from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  open: boolean;
  onClose: () => void;
  onSave: (croppedImageBlob: Blob) => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageEditor({ imageUrl, open, onClose, onSave }: ImageEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const rotateImage = (direction: 'left' | 'right') => {
    setRotation((prev) => (direction === 'right' ? prev + 90 : prev - 90));
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180;
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    
    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // Step 1: Rotate the full image
    const rotatedCanvas = document.createElement('canvas');
    rotatedCanvas.width = bBoxWidth;
    rotatedCanvas.height = bBoxHeight;
    const rotatedCtx = rotatedCanvas.getContext('2d');

    if (!rotatedCtx) {
      throw new Error('No 2d context for rotated canvas');
    }

    rotatedCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
    rotatedCtx.rotate(rotRad);
    rotatedCtx.drawImage(image, -image.width / 2, -image.height / 2);

    // Step 2: Crop from rotated image
    const cropX = Math.max(0, Math.min(Math.round(pixelCrop.x), rotatedCanvas.width));
    const cropY = Math.max(0, Math.min(Math.round(pixelCrop.y), rotatedCanvas.height));
    const cropWidth = Math.min(pixelCrop.width, rotatedCanvas.width - cropX);
    const cropHeight = Math.min(pixelCrop.height, rotatedCanvas.height - cropY);

    const imageData = rotatedCtx.getImageData(cropX, cropY, cropWidth, cropHeight);

    // Step 3: Create final canvas with cropped image
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = cropWidth;
    finalCanvas.height = cropHeight;
    const finalCtx = finalCanvas.getContext('2d');

    if (!finalCtx) {
      throw new Error('No 2d context for final canvas');
    }

    finalCtx.putImageData(imageData, 0, 0);

    // Convert to blob
    return new Promise((resolve, reject) => {
      finalCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to blob conversion failed'));
        }
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      if (!croppedAreaPixels) {
        // Fallback: return original image with rotation
        if (rotation === 0) {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          onSave(blob);
        } else {
          const image = await createImage(imageUrl);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            onSave(blob);
            onClose();
            return;
          }

          const rotRad = getRadianAngle(rotation);
          const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
            image.width,
            image.height,
            rotation
          );

          canvas.width = bBoxWidth;
          canvas.height = bBoxHeight;

          ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
          ctx.rotate(rotRad);
          ctx.translate(-image.width / 2, -image.height / 2);
          ctx.drawImage(image, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              onSave(blob);
            } else {
              fetch(imageUrl).then(res => res.blob()).then(onSave);
            }
            onClose();
          }, 'image/jpeg', 0.95);
        }
        return;
      }

      // Crop and rotate the image
      const croppedImage = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation
      );
      onSave(croppedImage);
      onClose();
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Using original image.');
      // Fallback to original image
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        onSave(blob);
      } catch (fetchError) {
        console.error('Failed to fetch original image:', fetchError);
      }
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
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
          <div className="flex-1 relative">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={undefined} // Free-form crop
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid={true}
              style={{
                containerStyle: {
                  backgroundColor: '#000',
                },
              }}
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
