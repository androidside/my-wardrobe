import { useState, useEffect } from 'react';
import { OutfitRating, OutfitCombination, calculateOutfitRating } from '@/services/outfitRating';
import { ClothingItem } from '@/types/clothing';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, AlertTriangle, TrendingUp, Eye, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface RatingPanelProps {
  rating: OutfitRating;
  currentOutfit: OutfitCombination;
  allItems: ClothingItem[];
  onSwapItem?: (category: 'top' | 'bottom' | 'footwear' | 'accessories', newItem: ClothingItem) => void;
}

export function RatingPanel({ rating, currentOutfit, allItems, onSwapItem }: RatingPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [suggestionImages, setSuggestionImages] = useState<Record<string, string | null>>({});

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-50 border-green-300';
    if (score >= 6) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  };

  const getStarRating = (score: number) => {
    const stars = Math.round((score / 10) * 5);
    return '⭐'.repeat(stars);
  };

  // Calculate potential score (estimate based on fixing main issues)
  const calculatePotentialScore = () => {
    let potential = rating.score;
    
    // If formality is negative, fixing it could add ~0.5-1.0
    if (rating.formalityBonus && rating.formalityBonus < 0) {
      potential += Math.abs(rating.formalityBonus) + 0.5;
    }
    
    // If any score is below 7, fixing it could improve by ~1-2 points
    const lowScores = [
      rating.colorScore,
      rating.patternScore,
      rating.typeScore,
    ].filter((s): s is number => s !== undefined && s < 7);
    
    if (lowScores.length > 0) {
      potential += lowScores.length * 0.8;
    }
    
    return Math.min(9.5, potential);
  };

  const potentialScore = calculatePotentialScore();
  const improvement = potentialScore - rating.score;
  const hasIssues = rating.suggestions.length > 0 || rating.score < 9;

  // Get the most critical issue (first suggestion or generate from low scores)
  const getCriticalIssue = () => {
    if (rating.suggestions.length > 0) {
      return rating.suggestions[0];
    }
    
    // Generate issue from low scores
    if (rating.formalityBonus && rating.formalityBonus < -0.3) {
      return 'Formality levels are mismatched across items';
    }
    if (rating.colorScore && rating.colorScore < 7) {
      return 'Color combination could be improved';
    }
    if (rating.typeScore && rating.typeScore < 7) {
      return 'Some clothing types don\'t pair well together';
    }
    
    return null;
  };

  const criticalIssue = getCriticalIssue();

  // Find better alternatives from wardrobe
  const findBetterAlternatives = () => {
    if (!rating.problematicItems || rating.problematicItems.length === 0) {
      return null;
    }

    const problematicItem = rating.problematicItems[0]; // Focus on worst item
    const category = problematicItem.category;

    // Find alternatives of the same category
    const alternatives = allItems
      .filter(item => {
        // Must be same category but different item
        if (item.id === problematicItem.item.id) return false;
        
        const itemCategory = getItemCategoryHelper(item);
        return itemCategory === category;
      })
      .map(item => {
        // Calculate score with this alternative
        const testOutfit: OutfitCombination = {
          top: category === 'top' ? item : currentOutfit.top,
          bottom: category === 'bottom' ? item : currentOutfit.bottom,
          footwear: category === 'footwear' ? item : currentOutfit.footwear,
          accessories: category === 'accessories' 
            ? [...(currentOutfit.accessories?.filter(a => a.id !== problematicItem.item.id) || []), item]
            : currentOutfit.accessories,
        };
        
        const testRating = calculateOutfitRating(testOutfit);
        
        return {
          item,
          predictedScore: testRating.score,
          improvement: testRating.score - rating.score,
        };
      })
      .filter(alt => alt.improvement > 0.3) // Only show if it actually improves
      .sort((a, b) => b.predictedScore - a.predictedScore) // Best scores first
      .slice(0, 3); // Top 3

    if (alternatives.length === 0) return null;

    return {
      problematicItem,
      alternatives,
    };
  };

  // Helper to categorize items (matches backend logic)
  const getItemCategoryHelper = (item: ClothingItem): 'top' | 'bottom' | 'footwear' | 'accessories' => {
    const typeLower = item.type.toLowerCase();
    if (typeLower.includes('shoe') || typeLower.includes('boot') || typeLower.includes('sandal') || typeLower.includes('sneaker') || typeLower.includes('loafer') || typeLower.includes('heel') || typeLower.includes('slipper')) {
      return 'footwear';
    }
    if (typeLower.includes('pant') || typeLower.includes('jean') || typeLower.includes('short') || typeLower.includes('skirt') || typeLower.includes('dress') || typeLower.includes('legging')) {
      return 'bottom';
    }
    if (typeLower.includes('watch') || typeLower.includes('bag') || typeLower.includes('belt') || typeLower.includes('hat') || typeLower.includes('scarf') || typeLower.includes('jewelry') || typeLower.includes('glove') || typeLower.includes('tie') || typeLower.includes('wallet') || typeLower.includes('sock')) {
      return 'accessories';
    }
    return 'top';
  };

  const suggestions = findBetterAlternatives();

  // Load images for suggested items
  useEffect(() => {
    if (!suggestions) return;

    const loadImages = async () => {
      const urls: Record<string, string | null> = {};
      for (const alt of suggestions.alternatives) {
        try {
          const url = await wardrobeStorageService.getImageUrl(alt.item.imageId);
          urls[alt.item.id] = url;
        } catch (error) {
          console.error('Failed to load suggestion image:', error);
          urls[alt.item.id] = null;
        }
      }
      setSuggestionImages(urls);
    };

    loadImages();
  }, [suggestions]);

  return (
    <Card className="border-2 bg-white transition-all">
      {/* Before/After Comparison */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Current Outfit */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Current Outfit</div>
            <div className="relative">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 150 }}
                className={`inline-block px-4 py-3 rounded-lg ${getScoreBgColor(rating.score)} border-2`}
              >
                <div className={`text-4xl font-bold ${getScoreColor(rating.score)}`}>
                  {rating.score.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 mt-1">/10</div>
              </motion.div>
              <div className="mt-2 text-xl">
                {getStarRating(rating.score)}
              </div>
            </div>
          </div>

          {/* Potential */}
          {hasIssues && improvement > 0.3 && (
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">Potential</div>
              <div className="relative">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 150, delay: 0.2 }}
                  className="inline-block px-4 py-3 rounded-lg bg-green-50 border-2 border-green-300"
                >
                  <div className="text-4xl font-bold text-green-600">
                    {potentialScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">/10</div>
                </motion.div>
                <div className="mt-2 text-xl">
                  {getStarRating(potentialScore)}
                </div>
                {/* Improvement Arrow */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -left-6 top-1/2 -translate-y-1/2"
                >
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </motion.div>
              </div>
            </div>
          )}

          {/* Perfect Score */}
          {!hasIssues && rating.score >= 9 && (
            <div className="text-center">
              <div className="text-sm font-medium text-green-600 mb-2">Perfect! 🎉</div>
              <div className="relative">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 150, delay: 0.2 }}
                  className="inline-block px-4 py-3 rounded-lg bg-green-50 border-2 border-green-400"
                >
                  <div className="text-2xl font-bold text-green-700">
                    Outstanding
                  </div>
                  <div className="text-xs text-gray-600 mt-1">No issues found</div>
                </motion.div>
                <div className="mt-2 text-xl">
                  ✨🔥✨
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gamification Message */}
        {hasIssues && improvement > 0.3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-6"
          >
            <p className="text-sm font-medium text-blue-600">
              You're <span className="font-bold">{improvement.toFixed(1)} points</span> away from perfection!
            </p>
          </motion.div>
        )}

        {/* Issues Section */}
        {criticalIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                  {rating.problematicItems && rating.problematicItems.length > 0
                    ? `Issue with your ${rating.problematicItems[0].item.type}`
                    : rating.suggestions.length === 1 ? '1 issue found' : `${rating.suggestions.length} issues found`}
                </h4>
                <p className="text-sm text-yellow-800">
                  {rating.problematicItems && rating.problematicItems.length > 0
                    ? rating.problematicItems[0].reason
                    : criticalIssue}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Smart Suggestions */}
        {suggestions && suggestions.alternatives.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4"
          >
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                💡 Try instead ({suggestions.alternatives.length} better options)
              </h4>
              <p className="text-xs text-blue-700">
                Swap your {suggestions.problematicItem.item.brand} {suggestions.problematicItem.item.type} for:
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {suggestions.alternatives.map((alt) => (
                <motion.button
                  key={alt.item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSwapItem?.(suggestions.problematicItem.category, alt.item)}
                  className="bg-white rounded-lg border-2 border-blue-300 p-2 hover:border-blue-500 transition-all"
                >
                  {/* Item Image */}
                  <div className="aspect-square rounded-md overflow-hidden bg-gray-100 mb-2">
                    {suggestionImages[alt.item.id] ? (
                      <img
                        src={suggestionImages[alt.item.id]!}
                        alt={alt.item.type}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        📷
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="text-xs">
                    <div className="font-semibold text-gray-900 truncate">
                      {alt.item.brand}
                    </div>
                    <div className="text-gray-600 truncate">
                      {alt.item.type}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-green-600 font-bold">
                        {alt.predictedScore.toFixed(1)}
                      </span>
                      <span className="text-green-600 text-xs flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        +{alt.improvement.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {hasIssues && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showDetails ? 'Hide Details' : 'View Details'}
            </Button>
          )}
          
          <Button
            variant="outline"
            className="flex-1"
            disabled
            title="AI suggestions coming soon"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Get AI Help
          </Button>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="space-y-3">
              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {rating.colorScore !== undefined && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">🎨 Color</div>
                    <div className={`text-lg font-bold ${getScoreColor(rating.colorScore)}`}>
                      {rating.colorScore.toFixed(1)}
                    </div>
                  </div>
                )}
                {rating.patternScore !== undefined && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">🔲 Pattern</div>
                    <div className={`text-lg font-bold ${getScoreColor(rating.patternScore)}`}>
                      {rating.patternScore.toFixed(1)}
                    </div>
                  </div>
                )}
                {rating.typeScore !== undefined && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">👕 Type</div>
                    <div className={`text-lg font-bold ${getScoreColor(rating.typeScore)}`}>
                      {rating.typeScore.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Suggestions */}
              {rating.suggestions.length > 1 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Other suggestions:</div>
                  <ul className="space-y-1">
                    {rating.suggestions.slice(1, 3).map((suggestion, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-gray-400">→</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
