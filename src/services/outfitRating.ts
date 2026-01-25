import { ClothingItem, FormalityLevel, ClothingTag } from '@/types/clothing';
import { getColorCompatibility, getPatternCompatibility, getTypeCompatibility } from '@/data/outfitCompatibility';

export interface OutfitCombination {
  top?: ClothingItem;
  bottom?: ClothingItem;
  footwear?: ClothingItem;
  accessories?: ClothingItem[];
}

export interface OutfitRating {
  score: number; // 0-10
  matrixScore: number; // From compatibility matrix
  colorScore?: number; // Average color compatibility
  patternScore?: number; // Average pattern compatibility
  typeScore?: number; // Average type compatibility
  formalityBonus?: number; // Bonus/penalty from formality matching
  tagBonus?: number; // Bonus/penalty from tag matching
  aiScore?: number; // From AI (placeholder for future)
  feedback: string[];
  strengths: string[];
  suggestions: string[];
}

/**
 * Calculate outfit compatibility score using enhanced compatibility matrices
 * Includes: color, pattern, type, formality, and tag matching
 */
export function calculateOutfitRating(outfit: OutfitCombination): OutfitRating {
  const colorScores: number[] = [];
  const patternScores: number[] = [];
  const typeScores: number[] = [];
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

      // 1. Color compatibility (handles multiple colors)
      let colorScore = getColorCompatibility(
        item1.color,
        item2.color,
        item1.colors,
        item2.colors
      );

      // 2. Pattern compatibility
      const pattern1 = item1.pattern || 'Solid';
      const pattern2 = item2.pattern || 'Solid';
      const patternScore = getPatternCompatibility(pattern1, pattern2);

      // 3. Apply Pattern+Color interaction rules
      const onePatterned = (pattern1 === 'Solid') !== (pattern2 === 'Solid');
      const bothPatterned = pattern1 !== 'Solid' && pattern2 !== 'Solid';

      if (onePatterned && colorScore < 7) {
        // One patterned: reduce clash severity by 20%
        colorScore = colorScore + (10 - colorScore) * 0.2;
      } else if (bothPatterned && colorScore < 7) {
        // Two patterned with color clash: additional 10% penalty
        colorScore = colorScore - (colorScore * 0.1);
      }

      // 4. Type compatibility
      const typeScore = getTypeCompatibility(item1.type, item2.type);

      // Store individual scores
      colorScores.push(colorScore);
      patternScores.push(patternScore);
      typeScores.push(typeScore);

      // Combined score (weighted: 35% color, 25% pattern, 40% type)
      const pairScore = (colorScore * 0.35) + (patternScore * 0.25) + (typeScore * 0.4);

      // Generate feedback for this pair
      const item1Colors = item1.colors && item1.colors.length > 0 
        ? `${item1.color}, ${item1.colors.join(', ')}`
        : item1.color;
      const item2Colors = item2.colors && item2.colors.length > 0 
        ? `${item2.color}, ${item2.colors.join(', ')}`
        : item2.color;
      const item1PatternText = pattern1 !== 'Solid' ? ` (${pattern1})` : '';
      const item2PatternText = pattern2 !== 'Solid' ? ` (${pattern2})` : '';
      
      if (pairScore >= 8) {
        strengths.push(`${item1.type} (${item1Colors}${item1PatternText}) and ${item2.type} (${item2Colors}${item2PatternText}) work excellently together`);
      } else if (pairScore >= 6) {
        feedback.push(`${item1.type} (${item1Colors}${item1PatternText}) and ${item2.type} (${item2Colors}${item2PatternText}) are a good match`);
      } else if (pairScore < 5) {
        suggestions.push(`Consider changing ${item1.type} or ${item2.type} - the combination needs improvement`);
      }
    }
  }

  // Calculate base matrix score
  const avgColorScore = colorScores.length > 0 ? colorScores.reduce((a, b) => a + b, 0) / colorScores.length : 5;
  const avgPatternScore = patternScores.length > 0 ? patternScores.reduce((a, b) => a + b, 0) / patternScores.length : 5;
  const avgTypeScore = typeScores.length > 0 ? typeScores.reduce((a, b) => a + b, 0) / typeScores.length : 5;

  let matrixScore = (avgColorScore * 0.35) + (avgPatternScore * 0.25) + (avgTypeScore * 0.4);

  // 5. Apply IMPROVED formality matching rules
  let formalityBonus = 0;
  const formalityLevels = items
    .filter(item => item.type !== 'Underwear') // Exclude underwear from formality check
    .map(item => item.formalityLevel)
    .filter((level): level is FormalityLevel => level !== undefined);
  
  if (formalityLevels.length >= 2) {
    const maxFormality = Math.max(...formalityLevels);
    const minFormality = Math.min(...formalityLevels);
    const variance = maxFormality - minFormality;
    
    if (variance <= 0.5) {
      formalityBonus = 1.0;
      feedback.push('Excellent formality consistency!');
      strengths.push('All items perfectly matched in formality');
    } else if (variance <= 1.0) {
      formalityBonus = 0.0;
      // Good match, no bonus or penalty
    } else if (variance <= 1.5) {
      formalityBonus = -0.2;
      feedback.push('Formality levels are slightly mismatched');
    } else {
      formalityBonus = -0.5;
      suggestions.push('Consider matching formality levels for a more cohesive look');
    }
    
    matrixScore += formalityBonus;
  }

  // 6. Apply TAG compatibility rules
  let tagBonus = 0;
  const allTags = items.flatMap(item => item.tags || []);
  const tagCounts = new Map<ClothingTag, number>();
  
  allTags.forEach(tag => {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  });

  // Same occasion tags (2+ items share same tag)
  const occasionTags: ClothingTag[] = ['Work/Office', 'Formal Event', 'Party/Night Out', 'Business Casual', 'Date Night'];
  for (const tag of occasionTags) {
    const count = tagCounts.get(tag) || 0;
    if (count >= 2) {
      tagBonus += 2.0;
      strengths.push(`All items work well for: ${tag}`);
      break; // Only count once
    }
  }

  // Style consistency
  const styleTags: ClothingTag[] = ['Classic', 'Minimalist', 'Trendy', 'Streetwear'];
  for (const tag of styleTags) {
    const count = tagCounts.get(tag) || 0;
    if (count >= 2) {
      tagBonus += 1.0;
      strengths.push(`Consistent ${tag} style`);
      break;
    }
  }

  // Season mismatches
  const hasSummer = allTags.includes('Summer') || allTags.includes('Hot Weather');
  const hasWinter = allTags.includes('Winter') || allTags.includes('Cold Weather');
  if (hasSummer && hasWinter) {
    tagBonus -= 1.0;
    suggestions.push('Mixed seasonal items - consider weather appropriateness');
  }

  matrixScore += tagBonus;

  // 7. Check for neutral colors (they stabilize outfits)
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
  const finalScore = Math.min(10, Math.max(0, matrixScore));

  // Generate overall feedback
  if (finalScore >= 8.5) {
    feedback.push('Excellent combination! This outfit works very well together.');
  } else if (finalScore >= 7) {
    feedback.push('Good combination with room for minor improvements.');
  } else if (finalScore >= 5.5) {
    feedback.push('Decent combination, but some items could be better matched.');
  } else {
    feedback.push('This combination needs improvement. Consider different combinations.');
  }

  return {
    score: Math.round(finalScore * 10) / 10,
    matrixScore: Math.round(matrixScore * 10) / 10,
    colorScore: Math.round(avgColorScore * 10) / 10,
    patternScore: Math.round(avgPatternScore * 10) / 10,
    typeScore: Math.round(avgTypeScore * 10) / 10,
    formalityBonus: Math.round(formalityBonus * 10) / 10,
    tagBonus: Math.round(tagBonus * 10) / 10,
    feedback,
    strengths,
    suggestions,
  };
}

/**
 * Placeholder for AI-based outfit rating
 * This will be implemented later when AI integration is decided
 */
export async function getAIOutfitRating(_outfit: OutfitCombination): Promise<OutfitRating | null> {
  // TODO: Implement AI-based rating using OpenAI or similar
  // This is a placeholder that returns null for now
  console.log('[AI Rating] Placeholder - AI rating not yet implemented');
  return null;
}

