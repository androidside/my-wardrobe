import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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

type AspectRatio = '1:1' | '4:3' | '16:9' | 'original';

const ASPECT_RATIO_MAP: Record<AspectRatio, number | undefined> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  'original': undefined,
};

export function ImageEditor({ imageUrl, open, onClose, onSave }: ImageEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
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
      // If "original" is selected, return full image with rotation only (no crop)
      if (aspectRatio === 'original') {
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

      // For cropped aspect ratios, ensure we have crop area
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
    setAspectRatio('1:1');
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aspect Ratio Selection */}
          <div>
            <Label htmlFor="aspect-ratio" className="text-sm font-medium text-gray-700 mb-2 block">
              Aspect Ratio
            </Label>
            <Select
              value={aspectRatio}
              onValueChange={(value) => {
                setAspectRatio(value as AspectRatio);
                // Reset crop position when aspect ratio changes
                setCrop({ x: 0, y: 0 });
                setZoom(1);
              }}
            >
              <SelectTrigger id="aspect-ratio" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">Square (1:1)</SelectItem>
                <SelectItem value="4:3">Standard (4:3)</SelectItem>
                <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                <SelectItem value="original">Original (No Crop)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image Cropper */}
          {aspectRatio === 'original' ? (
            <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '300px', height: '400px', maxHeight: '60vh' }}>
              <div className="relative max-w-full max-h-full">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease',
                  }}
                />
                {rotation !== 0 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded text-sm">
                    Rotated {rotation % 360}°
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '300px', height: '400px', maxHeight: '60vh' }}>
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={ASPECT_RATIO_MAP[aspectRatio]}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={true}
              />
            </div>
          )}

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control - Only show when not in original mode */}
            {aspectRatio !== 'original' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoom: {Math.round(zoom * 100)}%
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Rotation Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => rotateImage('left')}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Rotate Left
              </Button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {((rotation % 360) + 360) % 360}°
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => rotateImage('right')}
                className="flex items-center gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Rotate Right
              </Button>
            </div>

            {aspectRatio === 'original' && (
              <div className="text-sm text-gray-600 text-center bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="font-medium text-blue-900">Original Image Mode</p>
                <p className="text-xs text-blue-700 mt-1">The full image will be saved. You can still rotate it if needed.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex-1"
              disabled={isProcessing}
            >
              <Check className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
