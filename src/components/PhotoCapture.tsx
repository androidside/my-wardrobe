import { useState, useRef } from 'react';
import { Upload, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingAnalysis, analyzeClothingImage } from '@/services/imageAnalysis';
import { ImageEditor } from './ImageEditor';
import { compressImage, COMPRESSION_PRESETS } from '@/utils/imageCompression';

interface PhotoCaptureProps {
  onPhotoCapture: (blob: Blob) => void;
  initialPreview?: string | null;
  onAnalysisComplete?: (analysis: ClothingAnalysis) => void;
  onAnalysisStart?: () => void;
}

export function PhotoCapture({ onPhotoCapture, initialPreview, onAnalysisComplete, onAnalysisStart }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [showEditor, setShowEditor] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [finalImageBlob, setFinalImageBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('[PhotoCapture] Component rendered with callbacks:', {
    hasOnAnalysisComplete: !!onAnalysisComplete,
    hasOnAnalysisStart: !!onAnalysisStart,
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create preview URL and open editor
    const previewUrl = URL.createObjectURL(file);
    setTempImageUrl(previewUrl);
    setShowEditor(true);
  };

  const handleEditorSave = async (croppedBlob: Blob) => {
    try {
      // Compress the cropped image before saving
      console.log('[PhotoCapture] Compressing image...');
      const compressedBlob = await compressImage(
        croppedBlob,
        COMPRESSION_PRESETS.HIGH_QUALITY.maxWidth,
        COMPRESSION_PRESETS.HIGH_QUALITY.quality
      );
      
      // Create preview from compressed blob
      const previewUrl = URL.createObjectURL(compressedBlob);
      setPreview(previewUrl);
      setFinalImageBlob(compressedBlob);

      // Clean up temp image URL
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
        setTempImageUrl(null);
      }

      // Close editor
      setShowEditor(false);

      // Call callback with compressed blob
      onPhotoCapture(compressedBlob);

      // Trigger AI analysis if callbacks are provided
      if (onAnalysisComplete) {
        console.log('[PhotoCapture] Analysis callbacks provided, starting analysis...');
        try {
          onAnalysisStart?.();
          console.log('[PhotoCapture] Analysis start callback called');
          const analysis = await analyzeClothingImage(compressedBlob);
          console.log('[PhotoCapture] Analysis completed, result:', analysis);
          onAnalysisComplete(analysis);
          console.log('[PhotoCapture] Analysis complete callback called');
        } catch (error) {
          console.error('[PhotoCapture] AI analysis failed:', error);
          // Silently fail - don't block user from continuing
        }
      } else {
        console.log('[PhotoCapture] No analysis callbacks provided, skipping analysis');
      }
    } catch (error) {
      console.error('[PhotoCapture] Image compression failed:', error);
      // Fallback to uncompressed if compression fails
      alert('Failed to compress image. Using original image.');
      
      const previewUrl = URL.createObjectURL(croppedBlob);
      setPreview(previewUrl);
      setFinalImageBlob(croppedBlob);
      onPhotoCapture(croppedBlob);
      
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
        setTempImageUrl(null);
      }
      setShowEditor(false);
    }
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    // Clean up temp image URL if editor is closed without saving
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClearPhoto = () => {
    setPreview(null);
    setFinalImageBlob(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clean up preview URL
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  };

  const handleEditPhoto = () => {
    if (finalImageBlob) {
      const previewUrl = URL.createObjectURL(finalImageBlob);
      setTempImageUrl(previewUrl);
      setShowEditor(true);
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
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleEditPhoto}
                title="Edit image"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleClearPhoto}
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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
                Click to select or capture
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
          Choose Photo
        </Button>
      )}

      {/* Image Editor Dialog */}
      {tempImageUrl && (
        <ImageEditor
          imageUrl={tempImageUrl}
          open={showEditor}
          onClose={handleEditorClose}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
}
