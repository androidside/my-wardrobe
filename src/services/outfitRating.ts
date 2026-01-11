import { ClothingItem } from '@/types/clothing';
import { getColorCompatibility, getTypeCompatibility } from '@/data/outfitCompatibility';

export interface OutfitCombination {
  top?: ClothingItem;
  bottom?: ClothingItem;
  footwear?: ClothingItem;
  accessories?: ClothingItem[];
}

export interface OutfitRating {
  score: number; // 0-10
  matrixScore: number; // From compatibility matrix
  aiScore?: number; // From AI (placeholder for future)
  feedback: string[];
  strengths: string[];
  suggestions: string[];
}

/**
 * Calculate outfit compatibility score using the compatibility matrix
 */
export function calculateOutfitRating(outfit: OutfitCombination): OutfitRating {
  const scores: number[] = [];
  const feedback: string[] = [];
  const strengths: string[] = [];
  const suggestions: string[] = [];

  const items = [
    outfit.top,
    outfit.bottom,
    outfit.footwear,
    ...(outfit.accessories || []),
  ].filter((item): item is ClothingItem => item !== undefined);

  if (items.length === 0) {
    return {
      score: 0,
      matrixScore: 0,
      feedback: ['Please select at least one clothing item'],
      strengths: [],
      suggestions: [],
    };
  }

  // Calculate pairwise compatibility scores
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i];
      const item2 = items[j];

      // Color compatibility (enhanced to handle multiple colors)
      const colorScore = getColorCompatibility(
        item1.color,
        item2.color,
        item1.colors,
        item2.colors
      );
      
      // Type compatibility
      const typeScore = getTypeCompatibility(item1.type, item2.type);
      
      // Combined score (weighted: 60% color, 40% type)
      const pairScore = (colorScore * 0.6) + (typeScore * 0.4);
      scores.push(pairScore);

      // Generate feedback for this pair (show all colors if multiple)
      const item1Colors = item1.colors && item1.colors.length > 0 
        ? `${item1.color}, ${item1.colors.join(', ')}`
        : item1.color;
      const item2Colors = item2.colors && item2.colors.length > 0 
        ? `${item2.color}, ${item2.colors.join(', ')}`
        : item2.color;
      const item1Pattern = item1.pattern && item1.pattern !== 'Solid' ? ` (${item1.pattern})` : '';
      const item2Pattern = item2.pattern && item2.pattern !== 'Solid' ? ` (${item2.pattern})` : '';
      
      if (pairScore >= 8) {
        strengths.push(`${item1.type} (${item1Colors}${item1Pattern}) and ${item2.type} (${item2Colors}${item2Pattern}) work excellently together`);
      } else if (pairScore >= 6) {
        feedback.push(`${item1.type} (${item1Colors}${item1Pattern}) and ${item2.type} (${item2Colors}${item2Pattern}) are a good match`);
      } else if (pairScore < 5) {
        suggestions.push(`Consider changing ${item1.type} or ${item2.type} - the colors/types don't complement well`);
      }
    }
  }

  // Calculate average score
  const matrixScore = scores.length > 0 
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
    : 5;

  // Apply formality matching bonus using user-defined formality levels
  const formalityLevels = items
    .map(item => item.formalityLevel)
    .filter((level): level is number => level !== undefined);
  
  // Only check formality if all items have formality levels defined
  if (formalityLevels.length > 1 && formalityLevels.length === items.length) {
    const avgFormality = formalityLevels.reduce((sum, level) => sum + level, 0) / formalityLevels.length;
    const variance = formalityLevels.reduce((sum, level) => sum + Math.pow(level - avgFormality, 2), 0) / formalityLevels.length;
    
    if (variance <= 0.5) {
      // Very consistent formality levels
      const formalityBonus = 0.5;
      const adjustedScore = matrixScore + formalityBonus;
      feedback.push('Great formality level consistency!');
      strengths.push('All items match in formality level');
    } else if (variance <= 1.5) {
      // Reasonably consistent
      feedback.push('Formality levels are reasonably matched');
    } else {
      // Inconsistent formality
      suggestions.push('Consider matching formality levels for a more cohesive look');
    }
  }

  // Check for neutral colors (they work well with everything)
  const neutralColors = ['Black', 'White', 'Gray', 'Beige', 'Navy'];
  const hasNeutral = items.some(item => {
    const allColors = item.colors && item.colors.length > 0 
      ? [item.color, ...item.colors]
      : [item.color];
    return allColors.some(c => neutralColors.includes(c));
  });
  if (hasNeutral && items.length > 1) {
    strengths.push('Neutral colors provide a solid foundation');
  }

  // Final score (capped at 10)
  const finalScore = Math.min(10, matrixScore);

  // Generate overall feedback
  if (finalScore >= 8.5) {
    feedback.push('Excellent combination! This outfit works very well together.');
  } else if (finalScore >= 7) {
    feedback.push('Good combination with room for minor improvements.');
  } else if (finalScore >= 5.5) {
    feedback.push('Decent combination, but some items could be better matched.');
  } else {
    feedback.push('This combination needs improvement. Consider different color or type combinations.');
  }

  return {
    score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
    matrixScore: Math.round(matrixScore * 10) / 10,
    feedback,
    strengths,
    suggestions,
  };
}

/**
 * Placeholder for AI-based outfit rating
 * This will be implemented later when AI integration is decided
 */
export async function getAIOutfitRating(outfit: OutfitCombination): Promise<OutfitRating | null> {
  // TODO: Implement AI-based rating using OpenAI or similar
  // This is a placeholder that returns null for now
  console.log('[AI Rating] Placeholder - AI rating not yet implemented');
  return null;
}

