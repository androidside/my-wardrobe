import { useState, useRef, useEffect } from 'react';
import { Upload, X, Edit2, Camera, SwitchCamera } from 'lucide-react';
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
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('[PhotoCapture] Component rendered with callbacks:', {
    hasOnAnalysisComplete: !!onAnalysisComplete,
    hasOnAnalysisStart: !!onAnalysisStart,
  });

  // Start camera with flash OFF
  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Try to disable torch/flash if supported
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      
      if (capabilities.torch) {
        await videoTrack.applyConstraints({
          // @ts-ignore - torch is not in standard types yet
          advanced: [{ torch: false }]
        });
        console.log('[PhotoCapture] Flash/torch disabled');
      }

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('[PhotoCapture] Camera access error:', error);
      alert('Unable to access camera. Please check permissions or use file upload instead.');
      setShowCamera(false);
    }
  };

  // Stop camera and release resources
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setTempImageUrl(imageUrl);
        setShowEditor(true);
        setShowCamera(false);
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  // Switch between front and rear camera
  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Effect to start camera when facingMode changes
  useEffect(() => {
    if (showCamera) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode, showCamera]);

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

  const handleOpenCamera = () => {
    setShowCamera(true);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    stopCamera();
  };

  const handleFileUpload = () => {
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
      {/* Hidden file input for file upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Camera Interface - Full Screen */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Video Preview */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Camera Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-8">
            <div className="flex items-center justify-around max-w-md mx-auto">
              {/* Close Camera */}
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleCloseCamera}
                className="bg-white/20 hover:bg-white/30 text-white border-white/50"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>

              {/* Capture Photo */}
              <Button
                type="button"
                size="lg"
                onClick={capturePhoto}
                className="bg-white hover:bg-gray-100 text-black px-8 py-6 rounded-full"
              >
                <Camera className="h-6 w-6" />
              </Button>

              {/* Switch Camera */}
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={switchCamera}
                className="bg-white/20 hover:bg-white/30 text-white border-white/50"
              >
                <SwitchCamera className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

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
          <div className="w-full aspect-square bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-400">
            <Camera className="h-16 w-16 text-gray-400" />
            <div className="text-center px-4">
              <p className="text-base font-medium text-gray-700">
                Take or Upload Photo
              </p>
              <p className="text-sm text-gray-500">
                Use camera or choose from gallery
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!preview && !showCamera && (
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={handleOpenCamera}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          <Button
            type="button"
            onClick={handleFileUpload}
            variant="secondary"
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
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
