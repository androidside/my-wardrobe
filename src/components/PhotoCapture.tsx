import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoCaptureProps {
  onPhotoCapture: (blob: Blob) => void;
  initialPreview?: string | null;
}

export function PhotoCapture({ onPhotoCapture, initialPreview }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Convert to blob and call callback
    onPhotoCapture(file);
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClearPhoto = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview area - SMALLER MAX WIDTH */}
      <div className="max-w-md mx-auto">
        {preview ? (
          <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-md border-2 border-gray-300">
            <img
              src={preview}
              alt="Clothing preview"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleClearPhoto}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="w-full aspect-square bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-400 hover:border-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={handleCameraClick}
          >
            <Upload className="h-16 w-16 text-gray-400" />
            <div className="text-center px-4">
              <p className="text-base font-medium text-gray-700">
                Upload Photo
              </p>
              <p className="text-sm text-gray-500">
                Click to browse files
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      {!preview && (
        <Button
          type="button"
          onClick={handleCameraClick}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Photo from Computer
        </Button>
      )}
    </div>
  );
}
