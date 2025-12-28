import { BRAND_LIST } from '@/data/brands';

export interface BrandOption {
  brand: string;
  score: number;
  source: string;
}

export interface ColorOption {
  color: string;
  score: number;
  source: string;
}

export interface ClothingAnalysis {
  type?: string;
  color?: string;
  brand?: string;
  brandOptions?: BrandOption[]; // Multiple brand options sorted by confidence
  colorOptions?: ColorOption[]; // Multiple color options sorted by confidence
  confidence?: number;
  labels?: string[]; // All detected labels for display
  detectedText?: string; // Detected text for display
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Match detected labels to clothing types with priority-based matching
 * Higher priority items are preferred when multiple matches are found
 */
function matchClothingType(labels: string[]): string | null {
  // Priority-based mapping: higher priority = more specific items
  const typeMapping: Array<{ keywords: string[]; type: string; priority: number }> = [
    // High priority - specific items (priority 10-9)
    { keywords: ['hoodie', 'hooded sweatshirt', 'hooded sweater'], type: 'Hoodie', priority: 10 },
    { keywords: ['sweater', 'pullover', 'jumper', 'cardigan'], type: 'Sweater', priority: 9 },
    { keywords: ['t-shirt', 'tshirt', 't shirt', 'tee', 'tank top'], type: 'T-shirt', priority: 8 },
    { keywords: ['jacket', 'blazer', 'sport coat'], type: 'Jacket', priority: 7 },
    { keywords: ['coat', 'overcoat', 'trench coat'], type: 'Coat', priority: 7 },
    { keywords: ['shirt', 'dress shirt', 'button-down'], type: 'Shirt', priority: 6 },
    
    // Footwear (priority 8-7)
    { keywords: ['sneaker', 'sneakers', 'athletic shoe', 'running shoe'], type: 'Sneakers', priority: 8 },
    { keywords: ['boot', 'boots', 'hiking boot', 'work boot'], type: 'Boots', priority: 7 },
    { keywords: ['sandal', 'sandals', 'flip-flop'], type: 'Sandals', priority: 7 },
    { keywords: ['shoe', 'shoes', 'footwear'], type: 'Shoes', priority: 6 },
    
    // Lower body (priority 7-6)
    { keywords: ['jeans', 'denim'], type: 'Jeans', priority: 7 },
    { keywords: ['pants', 'trousers', 'slacks'], type: 'Pants', priority: 6 },
    { keywords: ['shorts', 'short pants'], type: 'Shorts', priority: 6 },
    { keywords: ['skirt', 'skirts'], type: 'Skirt', priority: 6 },
    { keywords: ['dress', 'dresses'], type: 'Dress', priority: 6 },
    
    // Headwear (priority 6)
    { keywords: ['hat', 'cap', 'baseball cap', 'beanie', 'beanie hat', 'winter hat', 'fedora', 'bucket hat'], type: 'Hat', priority: 6 },
    // Underwear (priortiy 6)
    { keywords: ['underwear', 'undergarment', 'underclothes','underpants','boxers','briefs','panties'], type: 'Underwear', priority: 6 },
    // Accessories (priority 5)
    { keywords: ['accessory', 'accessories'], type: 'Accessories', priority: 5 },
  ];

  const matches: Array<{ type: string; priority: number }> = [];

  // Check each label against all mappings
  for (const label of labels) {
    const lowerLabel = label.toLowerCase();
    for (const mapping of typeMapping) {
      for (const keyword of mapping.keywords) {
        if (lowerLabel.includes(keyword)) {
          // Avoid duplicate matches for the same type
          if (!matches.some(m => m.type === mapping.type)) {
            matches.push({ type: mapping.type, priority: mapping.priority });
          }
          break; // Found a match for this label, move to next label
        }
      }
    }
  }

  // Return highest priority match
  if (matches.length > 0) {
    matches.sort((a, b) => b.priority - a.priority);
    console.log('[ClothingTypeDetection] Found matches:', matches);
    console.log('[ClothingTypeDetection] Selected type:', matches[0].type, 'with priority:', matches[0].priority);
    return matches[0].type;
  }

  return null;
}

/**
 * Match detected colors to clothing colors
 * Uses both RGB color analysis and label-based color detection
 * Returns array of color options sorted by confidence
 */
function matchColorOptions(
  colors: Array<{ color: { red: number; green: number; blue: number }; score: number }>,
  labels: string[]
): ColorOption[] {
  const colorMapping: Record<string, string> = {
    'black': 'Black',
    'white': 'White',
    'gray': 'Gray',
    'grey': 'Gray',
    'navy': 'Navy',
    'blue': 'Blue',
    'red': 'Red',
    'green': 'Green',
    'yellow': 'Yellow',
    'orange': 'Orange',
    'pink': 'Pink',
    'purple': 'Purple',
    'brown': 'Brown',
    'beige': 'Beige',
  };

  const colorResults: ColorOption[] = [];
  const foundColors = new Set<string>();

  // Method 1: Match from labels (more reliable for clothing, higher priority)
  for (const label of labels) {
    const lowerLabel = label.toLowerCase();
    for (const [key, value] of Object.entries(colorMapping)) {
      if (lowerLabel.includes(key) && !foundColors.has(value)) {
        colorResults.push({ color: value, score: 0.9, source: 'label-detection' });
        foundColors.add(value);
      }
    }
  }

  // Method 2: Infer from RGB values (lower priority)
  if (colors.length > 0) {
    const dominant = colors[0].color;
    const { red, green, blue } = dominant;
    const colorScore = colors[0].score || 0.7;

    // Simple RGB to color name mapping
    // Black: all values low
    if (red < 50 && green < 50 && blue < 50 && !foundColors.has('Black')) {
      colorResults.push({ color: 'Black', score: colorScore, source: 'rgb-analysis' });
      foundColors.add('Black');
    }
    // White: all values high
    if (red > 200 && green > 200 && blue > 200 && !foundColors.has('White')) {
      colorResults.push({ color: 'White', score: colorScore, source: 'rgb-analysis' });
      foundColors.add('White');
    }
    // Gray: similar values, medium range
    if (Math.abs(red - green) < 30 && Math.abs(green - blue) < 30 && red > 50 && red < 200 && !foundColors.has('Gray')) {
      colorResults.push({ color: 'Gray', score: colorScore, source: 'rgb-analysis' });
      foundColors.add('Gray');
    }
    // Red: high red, low green/blue
    if (red > green + 50 && red > blue + 50 && !foundColors.has('Red')) {
      colorResults.push({ color: 'Red', score: colorScore, source: 'rgb-analysis' });
      foundColors.add('Red');
    }
    // Blue: high blue
    if (blue > red + 30 && blue > green + 30) {
      if (blue < 100 && red < 50 && green < 50 && !foundColors.has('Navy')) {
        colorResults.push({ color: 'Navy', score: colorScore, source: 'rgb-analysis' });
        foundColors.add('Navy');
      } else if (!foundColors.has('Blue')) {
        colorResults.push({ color: 'Blue', score: colorScore, source: 'rgb-analysis' });
        foundColors.add('Blue');
      }
    }
    // Green: high green
    if (green > red + 30 && green > blue + 30 && !foundColors.has('Green')) {
      colorResults.push({ color: 'Green', score: colorScore, source: 'rgb-analysis' });
      foundColors.add('Green');
    }
    // Yellow: high red and green, low blue
    if (red > 150 && green > 150 && blue < 100 && !foundColors.has('Yellow')) {
      colorResults.push({ color: 'Yellow', score: colorScore, source: 'rgb-analysis' });
      foundColors.add('Yellow');
    }
    // Orange: high red and green, medium blue
    if (red > green && green > blue && red > 150 && blue < 100 && !foundColors.has('Orange')) {
      colorResults.push({ color: 'Orange', score: colorScore, source: 'rgb-analysis' });
      foundColors.add('Orange');
    }
    // Pink: high red, medium green/blue
    if (red > 150 && green > 100 && blue > 100 && red > green && !foundColors.has('Pink')) {
      colorResults.push({ color: 'Pink', score: colorScore, source: 'rgb-analysis' });
      foundColors.add('Pink');
    }
    // Purple: high red and blue, medium green
    if (red > 100 && blue > 100 && green < red && green < blue && !foundColors.has('Purple')) {
      colorResults.push({ color: 'Purple', score: colorScore, source: 'rgb-analysis' });
      foundColors.add('Purple');
    }
    // Brown: medium red/green, low blue
    if (red > 80 && green > 60 && blue < 60 && red > blue && green > blue && !foundColors.has('Brown')) {
      colorResults.push({ color: 'Brown', score: colorScore, source: 'rgb-analysis' });
      foundColors.add('Brown');
    }
  }

  // Sort by score (highest first)
  colorResults.sort((a, b) => b.score - a.score);
  console.log('[ColorDetection] Found color options:', colorResults);
  
  return colorResults;
}

/**
 * Simple fuzzy string matching using Levenshtein distance
 * Returns similarity score between 0 and 1
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Extract brand options from logo detection, text detection, labels, and fuzzy matching
 * Logo detection has highest priority as it's the most accurate
 * Returns array of brand options sorted by score (highest first)
 */
function extractBrandOptions(
  textAnnotations: any[], 
  labels: string[], 
  logoAnnotations?: any[]
): BrandOption[] {
  const brandList = BRAND_LIST;

  const results: Array<{ brand: string; score: number; source: string }> = [];

  // Method 0: Check logo detection (highest priority - most accurate)
  if (logoAnnotations && logoAnnotations.length > 0) {
    console.log('[BrandDetection] Checking logo annotations:', logoAnnotations);
    for (const logo of logoAnnotations) {
      const logoDescription = logo.description || '';
      const logoScore = logo.score || 0;
      const lowerLogoDescription = logoDescription.toLowerCase();
      
      console.log('[BrandDetection] Logo detected:', logoDescription, 'with score:', logoScore);
      
      // Match detected logo to brand list
      for (const brand of brandList) {
        const lowerBrand = brand.toLowerCase();
        
        // Exact match or contains match
        if (lowerLogoDescription === lowerBrand || 
            lowerLogoDescription.includes(lowerBrand) ||
            lowerBrand.includes(lowerLogoDescription)) {
          // Use API's confidence score, but ensure minimum threshold
          const finalScore = Math.max(logoScore, 0.8);
          results.push({ 
            brand, 
            score: finalScore,
            source: 'logo-detection' 
          });
          console.log('[BrandDetection] Logo matched to brand:', brand, 'with score:', finalScore);
        } else {
          // Fuzzy match for logo descriptions
          const similarity = stringSimilarity(lowerLogoDescription, lowerBrand);
          if (similarity > 0.8) {
            const finalScore = Math.max(logoScore * similarity, 0.75);
            results.push({ 
              brand, 
              score: finalScore,
              source: 'logo-detection-fuzzy' 
            });
            console.log('[BrandDetection] Logo fuzzy matched to brand:', brand, 'with score:', finalScore);
          }
        }
      }
    }
  }

  // Method 1: Check text annotations (exact and fuzzy match)
  if (textAnnotations && textAnnotations.length > 0) {
    const fullText = textAnnotations[0].description || '';
    const lowerText = fullText.toLowerCase();
    const words = fullText.split(/\s+/).filter((w: string) => w.length > 2);

    for (const brand of brandList) {
      const lowerBrand = brand.toLowerCase();
      
      // Exact substring match
      if (lowerText.includes(lowerBrand)) {
        results.push({ brand, score: 1.0, source: 'text-exact' });
      }
      
      // Fuzzy match on individual words
      for (const word of words) {
        const similarity = stringSimilarity(word, brand);
        if (similarity > 0.75) {
          results.push({ brand, score: similarity, source: 'text-fuzzy' });
        }
      }
    }
  }

  // Method 2: Check labels for brand-related terms
  if (labels && labels.length > 0) {
    const lowerLabels = labels.map(l => l.toLowerCase());
    
    for (const brand of brandList) {
      const lowerBrand = brand.toLowerCase();
      const brandWords = lowerBrand.split(/\s+/);
      
      // Check if any label contains brand name or brand words
      for (const label of lowerLabels) {
        if (label.includes(lowerBrand)) {
          results.push({ brand, score: 0.9, source: 'label-exact' });
        }
        
        // Check for individual brand words (for multi-word brands)
        for (const brandWord of brandWords) {
          if (brandWord.length > 3 && label.includes(brandWord)) {
            const similarity = stringSimilarity(label, brand);
            if (similarity > 0.7) {
              results.push({ brand, score: similarity * 0.8, source: 'label-fuzzy' });
            }
          }
        }
      }
    }
  }

  // Remove duplicates (keep highest score for each brand)
  const uniqueResults = new Map<string, BrandOption>();
  for (const result of results) {
    const existing = uniqueResults.get(result.brand);
    if (!existing || result.score > existing.score) {
      uniqueResults.set(result.brand, result);
    }
  }

  // Sort by score (highest first) and filter by minimum threshold
  const sortedResults = Array.from(uniqueResults.values())
    .filter(r => r.score >= 0.7)
    .sort((a, b) => b.score - a.score);

  console.log('[BrandDetection] Found brand options:', sortedResults.slice(0, 5));
  
  return sortedResults;
}

/**
 * Analyze clothing image using Google Cloud Vision API
 */
export async function analyzeClothingImage(imageBlob: Blob): Promise<ClothingAnalysis> {
  const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;

  console.log('[ImageAnalysis] Starting analysis...');
  console.log('[ImageAnalysis] API Key loaded:', apiKey ? `Yes (length: ${apiKey.length})` : 'No');
  console.log('[ImageAnalysis] Image blob size:', imageBlob.size, 'bytes');
  console.log('[ImageAnalysis] Image blob type:', imageBlob.type);

  if (!apiKey) {
    throw new Error('Google Vision API key not configured. Please add VITE_GOOGLE_VISION_API_KEY to your .env file.');
  }

  try {
    // Convert blob to base64
    console.log('[ImageAnalysis] Converting blob to base64...');
    const base64 = await blobToBase64(imageBlob);
    console.log('[ImageAnalysis] Base64 length:', base64.length);

    // Call Google Vision API
    console.log('[ImageAnalysis] Calling Google Vision API...');
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64,
              },
              features: [
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 10,
                },
                {
                  type: 'IMAGE_PROPERTIES',
                  maxResults: 1,
                },
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 5,
                },
                {
                  type: 'LOGO_DETECTION',
                  maxResults: 5,
                },
              ],
            },
          ],
        }),
      }
    );

    console.log('[ImageAnalysis] API Response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json();
      console.error('[ImageAnalysis] API Error response:', error);
      throw new Error(`Vision API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('[ImageAnalysis] API Response data:', data);
    const result = data.responses[0];
    console.log('[ImageAnalysis] API Result:', result);

    // Check for errors in the response
    if (result.error) {
      throw new Error(`Vision API error: ${result.error.message}`);
    }

    // Extract clothing type from labels
    const labels = result.labelAnnotations?.map((l: any) => l.description) || [];
    console.log('[ImageAnalysis] Detected labels:', labels);
    const clothingType = matchClothingType(labels);
    console.log('[ImageAnalysis] Matched clothing type:', clothingType);

    // Extract color options
    const dominantColors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
    console.log('[ImageAnalysis] Dominant colors:', dominantColors);
    const colorOptions = matchColorOptions(dominantColors, labels);
    const color = colorOptions.length > 0 ? colorOptions[0].color : undefined;
    console.log('[ImageAnalysis] Matched color options:', colorOptions);
    console.log('[ImageAnalysis] Best color:', color);

    // Extract brand options from logos (highest priority), text, and labels
    const logoAnnotations = result.logoAnnotations || [];
    console.log('[ImageAnalysis] Detected logos:', logoAnnotations);
    const brandOptions = extractBrandOptions(result.textAnnotations, labels, logoAnnotations);
    const brand = brandOptions.length > 0 ? brandOptions[0].brand : undefined;
    console.log('[ImageAnalysis] Detected brand options:', brandOptions);
    console.log('[ImageAnalysis] Best brand:', brand);

    // Get confidence from first label
    const confidence = result.labelAnnotations?.[0]?.score || 0;

    // Extract all labels for display
    const allLabels = labels;
    
    // Extract detected text
    const detectedText = result.textAnnotations?.[0]?.description || undefined;

    const analysisResult = {
      type: clothingType || undefined,
      color: color || undefined,
      brand: brand || undefined,
      brandOptions: brandOptions.length > 0 ? brandOptions : undefined,
      colorOptions: colorOptions.length > 0 ? colorOptions : undefined,
      confidence,
      labels: allLabels,
      detectedText,
    };
    console.log('[ImageAnalysis] Final analysis result:', analysisResult);
    return analysisResult;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

