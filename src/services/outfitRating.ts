import { ClothingItem, ClothingTag } from '@/types/clothing';
import { getColorCompatibility, getPatternCompatibility, getTypeCompatibility } from '@/data/outfitCompatibility';

export interface OutfitCombination {
  top?: ClothingItem;
  bottom?: ClothingItem;
  footwear?: ClothingItem;
  accessories?: ClothingItem[];
}

export interface ProblematicItem {
  item: ClothingItem;
  reason: string;
  category: 'top' | 'bottom' | 'footwear' | 'accessories';
  severity: 'high' | 'medium' | 'low'; // How much it's dragging down the score
  potentialImprovement: number; // Estimated score gain if fixed
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
  problematicItems?: ProblematicItem[]; // Items causing issues
}

// Helper to categorize items
function getItemCategory(item: ClothingItem): 'top' | 'bottom' | 'footwear' | 'accessories' {
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
  const problematicItems: ProblematicItem[] = [];
  
  // Track which items have issues (item -> list of issues)
  const itemIssues = new Map<ClothingItem, Array<{reason: string, severity: number}>>();

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

      // Track problematic pairs
      if (pairScore < 5.5) {
        const severity = pairScore < 4 ? 3 : pairScore < 5 ? 2 : 1;
        
        // Both items contribute to the clash
        if (!itemIssues.has(item1)) itemIssues.set(item1, []);
        if (!itemIssues.has(item2)) itemIssues.set(item2, []);
        
        itemIssues.get(item1)!.push({
          reason: `Clashes with ${item2.type}`,
          severity,
        });
        itemIssues.get(item2)!.push({
          reason: `Clashes with ${item1.type}`,
          severity,
        });
        
        suggestions.push(`${item1.type} and ${item2.type} don't match well - consider swapping one`);
      } else if (pairScore >= 8.5) {
        strengths.push(`${item1.type} and ${item2.type} pair excellently`);
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
  const formalityItems = items.filter(item => item.type !== 'Underwear' && item.formalityLevel !== undefined);
  const formalityLevels = formalityItems.map(item => item.formalityLevel!);
  
  if (formalityLevels.length >= 2) {
    const maxFormality = Math.max(...formalityLevels);
    const minFormality = Math.min(...formalityLevels);
    const variance = maxFormality - minFormality;
    const avgFormality = formalityLevels.reduce((a, b) => a + b, 0) / formalityLevels.length;
    
    if (variance <= 0.5) {
      formalityBonus = 1.0;
      // Only add strength if score is already high (reduce positive spam)
      if (matrixScore >= 8) {
        strengths.push('Perfect formality consistency');
      }
    } else if (variance <= 1.0) {
      formalityBonus = 0.0;
      // Good match, no bonus or penalty
    } else if (variance <= 1.5) {
      formalityBonus = -0.2;
    } else {
      formalityBonus = -0.5;
      suggestions.push('Mix of formal and casual items - try matching formality levels');
      
      // Find the outlier(s) - items furthest from average
      formalityItems.forEach(item => {
        const diff = Math.abs(item.formalityLevel! - avgFormality);
        if (diff > 1.5) {
          if (!itemIssues.has(item)) itemIssues.set(item, []);
          itemIssues.get(item)!.push({
            reason: item.formalityLevel! > avgFormality ? 'Too formal for outfit' : 'Too casual for outfit',
            severity: 2,
          });
        }
      });
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
      // Only mention if score is high (reduce positive spam)
      if (matrixScore >= 8) {
        strengths.push(`Perfect for ${tag}`);
      }
      break; // Only count once
    }
  }

  // Style consistency
  const styleTags: ClothingTag[] = ['Classic', 'Minimalist', 'Trendy', 'Streetwear'];
  for (const tag of styleTags) {
    const count = tagCounts.get(tag) || 0;
    if (count >= 2) {
      tagBonus += 1.0;
      break; // Don't spam about style consistency
    }
  }

  // Season mismatches (only mention if it's a significant issue)
  const hasSummer = allTags.includes('Summer') || allTags.includes('Hot Weather');
  const hasWinter = allTags.includes('Winter') || allTags.includes('Cold Weather');
  if (hasSummer && hasWinter) {
    tagBonus -= 1.0;
    suggestions.push('Mixing summer and winter items - check weather appropriateness');
  }

  matrixScore += tagBonus;

  // Final score (capped at 10)
  const finalScore = Math.min(10, Math.max(0, matrixScore));

  // Generate minimal overall feedback (only if needed)
  if (finalScore >= 9) {
    feedback.push('Outstanding outfit!');
  } else if (finalScore < 6) {
    feedback.push('This combination could use some improvements');
  }
  // For mid-range scores (6-9), let the visual scores speak for themselves

  // Convert itemIssues map to problematicItems array
  itemIssues.forEach((issues, item) => {
    // Calculate total severity and average
    const totalSeverity = issues.reduce((sum, issue) => sum + issue.severity, 0);
    const avgSeverity = totalSeverity / issues.length;
    
    // Estimate potential improvement (rough heuristic)
    const potentialImprovement = avgSeverity * 0.5 + (issues.length * 0.3);
    
    // Get main reason (most severe)
    const mainReason = issues.reduce((worst, issue) => 
      issue.severity > worst.severity ? issue : worst
    ).reason;
    
    problematicItems.push({
      item,
      reason: mainReason,
      category: getItemCategory(item),
      severity: avgSeverity >= 2.5 ? 'high' : avgSeverity >= 1.5 ? 'medium' : 'low',
      potentialImprovement: Math.round(potentialImprovement * 10) / 10,
    });
  });

  // Sort by severity and potential improvement
  problematicItems.sort((a, b) => {
    const severityWeight = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityWeight[b.severity] - severityWeight[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.potentialImprovement - a.potentialImprovement;
  });

  return {
    score: Math.round(finalScore * 10) / 10,
    matrixScore: Math.round(matrixScore * 10) / 10,
    colorScore: Math.round(avgColorScore * 10) / 10,
    patternScore: Math.round(avgPatternScore * 10) / 10,
    typeScore: Math.round(avgTypeScore * 10) / 10,
    formalityBonus: Math.round(formalityBonus * 10) / 10,
    tagBonus: Math.round(tagBonus * 10) / 10,
    feedback: feedback.slice(0, 2), // Max 2 feedback items
    strengths: strengths.slice(0, 2), // Max 2 strengths
    suggestions: suggestions.slice(0, 3), // Max 3 suggestions (prioritize problems)
    problematicItems: problematicItems.slice(0, 2), // Max 2 problematic items
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

