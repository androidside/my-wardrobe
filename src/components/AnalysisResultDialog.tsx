import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClothingAnalysis } from '@/services/imageAnalysis';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface AnalysisResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: ClothingAnalysis | null;
  onSelection?: (selections: { brand?: string; color?: string }) => void;
}

export function AnalysisResultDialog({ open, onOpenChange, analysis, onSelection }: AnalysisResultDialogProps) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Initialize selections with best matches when dialog opens
  useEffect(() => {
    if (open && analysis) {
      setSelectedBrand(analysis.brand || null);
      setSelectedColor(analysis.color || null);
    }
  }, [open, analysis]);

  if (!analysis) return null;

  const hasDetections = !!(analysis.type || analysis.color || analysis.brand || 
    (analysis.brandOptions && analysis.brandOptions.length > 0) ||
    (analysis.colorOptions && analysis.colorOptions.length > 0));
  
  const fashionLabels = analysis.labels?.filter((label) => {
    const lowerLabel = label.toLowerCase();
    return (
      lowerLabel.includes('clothing') ||
      lowerLabel.includes('apparel') ||
      lowerLabel.includes('fashion') ||
      lowerLabel.includes('garment') ||
      lowerLabel.includes('textile') ||
      lowerLabel.includes('fabric') ||
      lowerLabel.includes('shoe') ||
      lowerLabel.includes('shirt') ||
      lowerLabel.includes('pants') ||
      lowerLabel.includes('jacket') ||
      lowerLabel.includes('dress') ||
      lowerLabel.includes('accessory')
    );
  }) || [];

  const handleApply = () => {
    if (onSelection) {
      onSelection({
        brand: selectedBrand || undefined,
        color: selectedColor || undefined,
      });
    }
    onOpenChange(false);
  };

  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'logo-detection': 'Logo',
      'logo-detection-fuzzy': 'Logo (fuzzy)',
      'text-exact': 'Text',
      'text-fuzzy': 'Text (fuzzy)',
      'label-exact': 'Label',
      'label-fuzzy': 'Label (fuzzy)',
      'label-detection': 'Label',
      'rgb-analysis': 'RGB',
    };
    return labels[source] || source;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-indigo-600" />
            Image Analysis Results
          </DialogTitle>
          <DialogDescription>
            Select the correct brand and color from the detected options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasDetections ? (
            <>
              {/* Clothing Type (read-only, no selection) */}
              {analysis.type && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Clothing Type</h3>
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-md border border-green-200">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-green-900">{analysis.type}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Brand Options with Selection */}
              {(analysis.brandOptions && analysis.brandOptions.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Brand Options</h3>
                  <div className="space-y-2">
                    {analysis.brandOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedBrand(option.brand)}
                        className={`w-full flex items-center justify-between p-3 rounded-md border-2 transition-all ${
                          selectedBrand === option.brand
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedBrand === option.brand
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedBrand === option.brand && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-900">{option.brand}</div>
                            <div className="text-xs text-gray-500">{getSourceLabel(option.source)} • {formatScore(option.score)}</div>
                          </div>
                        </div>
                        {index === 0 && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Best Match</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Options with Selection */}
              {(analysis.colorOptions && analysis.colorOptions.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Color Options</h3>
                  <div className="space-y-2">
                    {analysis.colorOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(option.color)}
                        className={`w-full flex items-center justify-between p-3 rounded-md border-2 transition-all ${
                          selectedColor === option.color
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedColor === option.color
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedColor === option.color && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-900">{option.color}</div>
                            <div className="text-xs text-gray-500">{getSourceLabel(option.source)} • {formatScore(option.score)}</div>
                          </div>
                        </div>
                        {index === 0 && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Best Match</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Not Detected Items */}
              {(!analysis.brandOptions || analysis.brandOptions.length === 0) && !analysis.brand && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <XCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600">Brand</div>
                    <div className="text-xs text-gray-500">No brand name or logo detected</div>
                  </div>
                </div>
              )}

              {(!analysis.colorOptions || analysis.colorOptions.length === 0) && !analysis.color && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <XCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600">Color</div>
                    <div className="text-xs text-gray-500">Could not identify the color</div>
                  </div>
                </div>
              )}

              {!analysis.type && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <XCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600">Clothing Type</div>
                    <div className="text-xs text-gray-500">Could not identify the clothing type</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-yellow-900">No Clothing Information Detected</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    We couldn't detect clothing type, color, or brand from this image. 
                    Please fill in the information manually.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fashion-related labels */}
          {fashionLabels.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Related Labels:</h3>
              <div className="flex flex-wrap gap-2">
                {fashionLabels.slice(0, 8).map((label, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detected Text */}
          {analysis.detectedText && analysis.detectedText.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Detected Text:</h3>
              <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-xs text-gray-600 font-mono break-words">
                  {analysis.detectedText.substring(0, 200)}
                  {analysis.detectedText.length > 200 ? '...' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Apply Button */}
          {hasDetections && onSelection && (
            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={handleApply}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Apply Selected Options
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

