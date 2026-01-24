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
    
    // react-easy-crop's croppedAreaPixels are relative to the displayed image
    // which is already rotated. We need to:
    // 1. First crop from the original image (coordinates need adjustment if rotated)
    // 2. Then rotate the cropped result
    
    // For simplicity, we'll rotate the full image first, then crop
    // This is easier to reason about
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
    // The pixelCrop coordinates from react-easy-crop account for rotation
    // So we can use them directly on the rotated canvas
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
      // If no crop area is set, return full image with rotation
      if (!croppedAreaPixels) {
        const image = await createImage(imageUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback: fetch original image
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          onSave(blob);
          onClose();
          return;
        }

        // If no rotation, return original image as-is
        if (rotation === 0) {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          onSave(blob);
          onClose();
          return;
        }

        // Apply rotation to full image
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
            // Fallback: fetch original image
            fetch(imageUrl).then(res => res.blob()).then(onSave);
          }
          onClose();
        }, 'image/jpeg', 0.95);
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
        className="max-w-full w-full h-full max-h-full m-0 p-0 rounded-none flex flex-col"
        hideCloseButton
      >
        {/* Full-screen crop area */}
        <div className="relative flex-1 bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={undefined} // Free-form crop (no fixed aspect ratio)
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid={true}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
              },
            }}
          />
        </div>

        {/* Bottom toolbar - Single line with 4 icons */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 safe-bottom">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {/* Cancel */}
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 transition-colors"
            >
              <X className="h-6 w-6" />
              <span className="text-xs font-medium">Cancel</span>
            </button>

            {/* Rotate Left */}
            <button
              onClick={() => rotateImage('left')}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="h-6 w-6" />
              <span className="text-xs font-medium">Rotate Left</span>
            </button>

            {/* Rotate Right */}
            <button
              onClick={() => rotateImage('right')}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 transition-colors"
            >
              <RotateCw className="h-6 w-6" />
              <span className="text-xs font-medium">Rotate Right</span>
            </button>

            {/* Choose/Done */}
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 px-4 py-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors font-semibold"
            >
              <Check className="h-6 w-6" />
              <span className="text-xs font-medium">
                {isProcessing ? 'Processing...' : 'Choose'}
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
