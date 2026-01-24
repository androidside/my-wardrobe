import { BRAND_LIST } from '@/data/brands';
import { ClothingCategory, getCategoryForType, ClothingPattern } from '@/types/clothing';

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
  category?: ClothingCategory; // NEW: Category detected from image
  type?: string;
  color?: string;
  brand?: string;
  pattern?: ClothingPattern; // NEW: Pattern detected from image
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
 * Returns both category and type for the new hierarchical structure
 */
function matchClothingType(labels: string[]): { category: ClothingCategory; type: string } | null {
  // Priority-based mapping: higher priority = more specific items
  // EXPANDED in Phase 1: Added 30+ more types and keywords for better detection
  const typeMapping: Array<{ keywords: string[]; type: string; priority: number }> = [
    // TOPS - High priority specific items (priority 10-7)
    { keywords: ['hoodie', 'hooded sweatshirt', 'hooded sweater', 'hood'], type: 'Hoodie', priority: 10 },
    { keywords: ['sweater', 'pullover', 'jumper', 'knit top', 'knitwear'], type: 'Sweater', priority: 9 },
    { keywords: ['cardigan', 'cardigan sweater', 'button sweater'], type: 'Cardigan', priority: 9 },
    { keywords: ['tank top', 'tank', 'sleeveless shirt', 'muscle shirt', 'vest top'], type: 'Tank Top', priority: 8 },
    { keywords: ['t-shirt', 'tshirt', 't shirt', 'tee', 'graphic tee', 'crew neck'], type: 'T-shirt', priority: 8 },
    { keywords: ['polo', 'polo shirt', 'collar shirt'], type: 'Polo', priority: 8 },
    { keywords: ['blouse', 'womens shirt', 'ladies shirt'], type: 'Blouse', priority: 8 },
    { keywords: ['tunic', 'long shirt', 'tunic top'], type: 'Tunic', priority: 7 },
    { keywords: ['crop top', 'cropped shirt', 'belly shirt'], type: 'Crop Top', priority: 8 },
    { keywords: ['long sleeve', 'long-sleeve', 'longsleeve', 'ls shirt'], type: 'Long Sleeve', priority: 7 },
    { keywords: ['shirt', 'dress shirt', 'button-down', 'button-up', 'button down', 'formal shirt'], type: 'Shirt', priority: 6 },
    
    // OUTERWEAR - Specific items (priority 10-7)
    { keywords: ['bomber', 'bomber jacket', 'flight jacket'], type: 'Bomber', priority: 10 },
    { keywords: ['windbreaker', 'wind breaker', 'shell jacket', 'rain jacket'], type: 'Windbreaker', priority: 9 },
    { keywords: ['parka', 'winter coat', 'down jacket', 'padded jacket'], type: 'Parka', priority: 9 },
    { keywords: ['trench coat', 'trench', 'raincoat', 'mac coat'], type: 'Trench Coat', priority: 9 },
    { keywords: ['blazer', 'sport coat', 'suit jacket', 'sports jacket'], type: 'Blazer', priority: 8 },
    { keywords: ['vest', 'waistcoat', 'sleeveless jacket', 'gilet'], type: 'Vest', priority: 8 },
    { keywords: ['jacket', 'outerwear'], type: 'Jacket', priority: 7 },
    { keywords: ['coat', 'overcoat', 'topcoat'], type: 'Coat', priority: 7 },
    
    // BOTTOMS - Lower body (priority 9-6)
    { keywords: ['jeans', 'denim', 'denim pants', 'blue jeans'], type: 'Jeans', priority: 9 },
    { keywords: ['chinos', 'chino pants', 'khaki', 'khakis'], type: 'Chinos', priority: 8 },
    { keywords: ['cargo pants', 'cargo', 'utility pants'], type: 'Cargo Pants', priority: 8 },
    { keywords: ['sweatpants', 'sweat pants', 'joggers', 'track pants', 'athletic pants'], type: 'Sweatpants', priority: 8 },
    { keywords: ['leggings', 'legging', 'tights', 'yoga pants'], type: 'Leggings', priority: 8 },
    { keywords: ['shorts', 'short pants', 'bermuda'], type: 'Shorts', priority: 7 },
    { keywords: ['skirt', 'skirts', 'mini skirt', 'maxi skirt'], type: 'Skirt', priority: 7 },
    { keywords: ['dress', 'dresses', 'gown', 'frock'], type: 'Dress', priority: 7 },
    { keywords: ['pants', 'trousers', 'slacks', 'bottoms'], type: 'Pants', priority: 6 },
    
    // FOOTWEAR - Specific footwear (priority 10-6)
    { keywords: ['sneaker', 'sneakers', 'athletic shoe', 'trainer', 'trainers', 'kicks'], type: 'Sneakers', priority: 9 },
    { keywords: ['running shoe', 'running shoes', 'runner', 'runners'], type: 'Running Shoes', priority: 9 },
    { keywords: ['boot', 'boots', 'ankle boot', 'chelsea boot', 'combat boot'], type: 'Boots', priority: 8 },
    { keywords: ['heel', 'heels', 'high heel', 'stiletto', 'pumps'], type: 'Heels', priority: 8 },
    { keywords: ['sandal', 'sandals', 'flip-flop', 'flip flop', 'slides', 'thongs'], type: 'Sandals', priority: 8 },
    { keywords: ['loafer', 'loafers', 'slip-on', 'slip on', 'moccasin'], type: 'Loafers', priority: 8 },
    { keywords: ['flat', 'flats', 'ballet flat', 'ballet shoe'], type: 'Flats', priority: 7 },
    { keywords: ['slipper', 'slippers', 'house shoe', 'indoor shoe'], type: 'Slippers', priority: 7 },
    { keywords: ['shoe', 'shoes', 'footwear'], type: 'Shoes', priority: 6 },
    
    // ACCESSORIES - Specific accessories (priority 8-5)
    { keywords: ['hat', 'cap', 'baseball cap', 'beanie', 'beanie hat', 'winter hat', 'fedora', 'bucket hat'], type: 'Hat', priority: 7 },
    { keywords: ['sock', 'socks', 'ankle sock', 'crew sock', 'knee sock', 'athletic sock'], type: 'Socks', priority: 7 },
    { keywords: ['scarf', 'scarves', 'neck scarf', 'muffler'], type: 'Scarf', priority: 7 },
    { keywords: ['glove', 'gloves', 'mitten', 'mittens', 'hand warmer'], type: 'Gloves', priority: 7 },
    { keywords: ['belt', 'waist belt', 'leather belt'], type: 'Belt', priority: 7 },
    { keywords: ['bag', 'handbag', 'purse', 'backpack', 'tote', 'satchel', 'clutch'], type: 'Bag', priority: 7 },
    { keywords: ['wallet', 'billfold', 'purse', 'card holder'], type: 'Wallet', priority: 7 },
    { keywords: ['watch', 'wristwatch', 'timepiece', 'wrist watch'], type: 'Watch', priority: 7 },
    { keywords: ['jewelry', 'jewellery', 'necklace', 'bracelet', 'earring', 'ring'], type: 'Jewelry', priority: 6 },
    { keywords: ['underwear', 'undergarment', 'underclothes', 'underpants', 'boxers', 'briefs', 'panties', 'lingerie'], type: 'Underwear', priority: 6 },
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

  // Return highest priority match with category
  if (matches.length > 0) {
    matches.sort((a, b) => b.priority - a.priority);
    const selectedType = matches[0].type;
    console.log('[ClothingTypeDetection] Found matches:', matches);
    console.log('[ClothingTypeDetection] Selected type:', selectedType, 'with priority:', matches[0].priority);
    
    // Get category for the selected type
    const category = getCategoryForType(selectedType);
    console.log('[ClothingTypeDetection] Inferred category:', category);
    
    return { category, type: selectedType };
  }

  return null;
}

/**
 * Detect pattern from labels
 * Returns the most likely pattern or null if no pattern is detected
 */
function detectPattern(labels: string[]): ClothingPattern | null {
  const patternKeywords: Record<ClothingPattern, string[]> = {
    'Solid': [],
    'Stripes': ['stripe', 'striped', 'line', 'lined'],
    'Checks': ['check', 'checked', 'checker', 'checkered', 'grid'],
    'Plaid': ['plaid', 'tartan'],
    'Polka Dots': ['polka', 'dot', 'dotted', 'dots', 'spotted'],
    'Floral': ['floral', 'flower', 'floral pattern', 'bloom'],
    'Abstract': ['abstract', 'pattern', 'print', 'graphic'],
    'Geometric': ['geometric', 'geometric pattern', 'shape', 'triangle', 'square', 'circle'],
    'Corduroy': ['corduroy', 'cord', 'ribbed', 'wale'],
    'Other': ['pattern', 'print'],
  };

  // Priority order for pattern detection (higher priority first)
  const priorityOrder: ClothingPattern[] = [
    'Stripes',
    'Checks',
    'Plaid',
    'Polka Dots',
    'Floral',
    'Geometric',
    'Corduroy',
    'Abstract',
    'Other',
  ];

  for (const pattern of priorityOrder) {
    const keywords = patternKeywords[pattern];
    for (const label of labels) {
      const lowerLabel = label.toLowerCase();
      for (const keyword of keywords) {
        if (lowerLabel.includes(keyword)) {
          console.log('[PatternDetection] Detected pattern:', pattern, 'from label:', label);
          return pattern;
        }
      }
    }
  }

  return null; // No pattern detected, will default to 'Solid'
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
 * Extract potential brand names from text using heuristics
 * Looks for capitalized words, common brand patterns, etc.
 */
function extractPotentialBrandsFromText(text: string): string[] {
  const potentialBrands: string[] = [];
  
  // Split text into words and phrases
  // Remove common non-brand words (articles, prepositions, clothing terms, size labels, etc.)
  const commonWords = new Set([
    // Articles, prepositions, common words
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its',
    // Size labels
    'size', 'cm', 'eu', 'us', 'uk', 'xl', 'xxl', 'xs', 's', 'm', 'l', 'small', 'medium', 'large', 'extra',
    // Clothing terms
    'made', 'shirt', 'pants', 'shoes', 'jacket', 'coat', 'dress', 'clothing', 'wear', 'style', 'fashion', 'apparel', 'garment',
    // Materials
    'cotton', 'polyester', 'wool', 'silk', 'leather', 'denim', 'nylon', 'spandex', 'lycra',
    // Care instructions
    'wash', 'clean', 'dry', 'iron', 'bleach', 'care', 'only', 'cold', 'warm', 'hot', 'machine', 'hand',
    // Common label text
    'product', 'item', 'code', 'color', 'colour', 'material', 'fabric', 'imported', 'export', 'quality',
    // Numbers and percentages
    'one', 'two', 'three', 'four', 'five', 'ten', 'percent',
    // Country names (often on labels)
    'china', 'usa', 'vietnam', 'india', 'bangladesh', 'turkey', 'italy', 'france', 'spain',
    // Very short words that cause false positives
    'es', 'la', 'le', 'de', 'un', 'el', 'en', 'et', 'no', 'si', 'so', 'up', 'go', 'me', 'we', 'my', 'or', 'if', 'to', 'he', 'it'
  ]);
  
  // Extract capitalized words/phrases (likely brand names)
  const lines = text.split(/\n/);
  for (const line of lines) {
    // Look for words that start with capital letters
    const capitalizedWords = line.match(/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b/g);
    if (capitalizedWords) {
      for (const word of capitalizedWords) {
        const cleanWord = word.trim().replace(/[^\w\s]/g, '');
        // Minimum brand length: 4 characters (prevents "Es", "La", etc.)
        if (cleanWord.length >= 4 && cleanWord.length <= 30 && !commonWords.has(cleanWord.toLowerCase())) {
          potentialBrands.push(cleanWord);
        }
      }
    }
  }
  
  // Also extract all words longer than 4 characters (excluding common words)
  // Increased from 3 to 4 to reduce false positives
  const words = text.split(/\s+/).filter((w: string) => {
    const clean = w.replace(/[^\w]/g, '').toLowerCase();
    return clean.length >= 4 && clean.length <= 25 && !commonWords.has(clean);
  });
  potentialBrands.push(...words);
  
  // Remove duplicates and return
  return Array.from(new Set(potentialBrands.map(b => b.trim()))).filter(b => b.length > 0);
}

/**
 * Check if text contains brand name with word boundaries (better matching)
 */
function containsBrandName(text: string, brand: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerBrand = brand.toLowerCase();
  
  // Exact match with word boundaries
  const wordBoundaryRegex = new RegExp(`\\b${lowerBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  if (wordBoundaryRegex.test(lowerText)) {
    return true;
  }
  
  // Contains match (fallback for multi-word brands)
  if (lowerText.includes(lowerBrand)) {
    return true;
  }
  
  // Check if brand is part of a larger word (but not vice versa)
  const brandWords = lowerBrand.split(/\s+/);
  if (brandWords.length === 1) {
    // Single word brand - check for standalone occurrence
    const standaloneRegex = new RegExp(`(^|[^a-z])${lowerBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`);
    return standaloneRegex.test(lowerText);
  }
  
  return false;
}

/**
 * Extract brand options from logo detection, text detection, labels, and fuzzy matching
 * Logo detection has highest priority as it's the most accurate
 * Text detection is now enhanced to better extract brand names from detected text
 * Returns array of brand options sorted by score (highest first)
 */
function extractBrandOptions(
  textAnnotations: any[], 
  labels: string[], 
  logoAnnotations?: any[]
): BrandOption[] {
  const brandList = BRAND_LIST;

  const results: Array<{ brand: string; score: number; source: string }> = [];
  const foundBrands = new Set<string>(); // Track brands we've found to avoid duplicates

  // Method 0: Check logo detection (highest priority - most accurate, score: 0.9-1.0)
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
          const finalScore = Math.max(logoScore, 0.9);
          results.push({ 
            brand, 
            score: finalScore,
            source: 'logo-detection' 
          });
          foundBrands.add(brand);
          console.log('[BrandDetection] Logo matched to brand:', brand, 'with score:', finalScore);
        } else {
          // Fuzzy match for logo descriptions
          const similarity = stringSimilarity(lowerLogoDescription, lowerBrand);
          if (similarity > 0.75) {
            const finalScore = Math.max(logoScore * similarity, 0.8);
            results.push({ 
              brand, 
              score: finalScore,
              source: 'logo-detection-fuzzy' 
            });
            foundBrands.add(brand);
            console.log('[BrandDetection] Logo fuzzy matched to brand:', brand, 'with score:', finalScore);
          }
        }
      }
    }
  }

  // Method 1: Enhanced text annotations analysis (high priority, score: 0.85-1.0)
  if (textAnnotations && textAnnotations.length > 0) {
    console.log('[BrandDetection] Analyzing text annotations:', textAnnotations.length, 'blocks');
    
    // Process ALL text annotations, not just the first one
    let allText = '';
    const textBlocks: string[] = [];
    
    for (const annotation of textAnnotations) {
      const text = annotation.description || '';
      if (text) {
        allText += text + '\n';
        textBlocks.push(text);
      }
    }
    
    console.log('[BrandDetection] Full detected text:', allText);
    
    // Extract potential brand names from text using heuristics
    const potentialBrands = extractPotentialBrandsFromText(allText);
    console.log('[BrandDetection] Extracted potential brands from text:', potentialBrands.slice(0, 10));
    
    // Check each brand in our list against the detected text
      for (const brand of brandList) {
        if (foundBrands.has(brand)) continue; // Skip if already found via logo
        
        const lowerBrand = brand.toLowerCase();
      
        // Exact match with word boundaries (highest confidence for text)
        if (containsBrandName(allText, brand)) {
          results.push({ brand, score: 1.0, source: 'text-exact' });
          foundBrands.add(brand);
          console.log('[BrandDetection] Text exact match found:', brand);
          continue;
        }
        
        // Check against potential brands extracted from text
        let matchedViaPotential = false;
        for (const potential of potentialBrands) {
          const lowerPotential = potential.toLowerCase();
          
          // Exact match with potential brand
          if (lowerPotential === lowerBrand) {
            results.push({ brand, score: 0.95, source: 'text-extracted' });
            foundBrands.add(brand);
            matchedViaPotential = true;
            console.log('[BrandDetection] Potential brand matched:', brand);
            break;
          }
          
          // Check if potential brand contains brand name or vice versa
          if (lowerPotential.includes(lowerBrand) || lowerBrand.includes(lowerPotential)) {
            const similarity = stringSimilarity(lowerPotential, lowerBrand);
            if (similarity > 0.7) {
              results.push({ brand, score: 0.85 + (similarity * 0.1), source: 'text-extracted-fuzzy' });
              foundBrands.add(brand);
              matchedViaPotential = true;
              console.log('[BrandDetection] Potential brand fuzzy matched:', brand, 'similarity:', similarity);
              break;
            }
          }
        }
        
        // Fuzzy match on individual words if not matched yet (lower confidence)
        if (!matchedViaPotential) {
          // Check individual words from potential brands
          for (const potential of potentialBrands) {
            if (potential.length >= 3 && !matchedViaPotential) {
              const similarity = stringSimilarity(potential.toLowerCase(), lowerBrand);
              if (similarity > 0.7 && similarity < 1.0) { // Similar but not exact
                results.push({ brand, score: 0.7 + (similarity * 0.15), source: 'text-word-fuzzy' });
                foundBrands.add(brand);
                matchedViaPotential = true;
                console.log('[BrandDetection] Word fuzzy match:', brand, 'from', potential, 'similarity:', similarity);
                break;
              }
            }
          }
        }
        
        // Last resort: check similarity against full text (for partial matches)
        if (!matchedViaPotential) {
          // Extract first few words that might be brand name (usually brand appears early in text)
          const firstWords = allText.split(/\s+/).slice(0, 5).join(' ').toLowerCase();
          const fullTextSimilarity = stringSimilarity(firstWords, brand);
          if (fullTextSimilarity > 0.65) {
            results.push({ brand, score: 0.7 + (fullTextSimilarity * 0.15), source: 'text-fuzzy' });
            foundBrands.add(brand);
            console.log('[BrandDetection] Text fuzzy match:', brand, 'similarity:', fullTextSimilarity);
          }
        }
      }
  }

  // Method 2: Check labels for brand-related terms (medium priority, score: 0.8-0.9)
  if (labels && labels.length > 0) {
    const lowerLabels = labels.map(l => l.toLowerCase());
    
    for (const brand of brandList) {
      if (foundBrands.has(brand)) continue; // Skip if already found
      
      const lowerBrand = brand.toLowerCase();
      const brandWords = lowerBrand.split(/\s+/);
      
      // Check if any label contains brand name or brand words
      for (const label of lowerLabels) {
        if (label.includes(lowerBrand)) {
          results.push({ brand, score: 0.9, source: 'label-exact' });
          foundBrands.add(brand);
          console.log('[BrandDetection] Label exact match:', brand);
          break;
        }
        
        // Check for individual brand words (for multi-word brands)
        for (const brandWord of brandWords) {
          if (brandWord.length > 3 && label.includes(brandWord)) {
            const similarity = stringSimilarity(label, brand);
            if (similarity > 0.7) {
              results.push({ brand, score: similarity * 0.85, source: 'label-fuzzy' });
              foundBrands.add(brand);
              console.log('[BrandDetection] Label fuzzy match:', brand, 'similarity:', similarity);
              break;
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
  // Raised threshold to 0.80 to reduce false positives (Phase 1 improvement)
  const sortedResults = Array.from(uniqueResults.values())
    .filter(r => r.score >= 0.80)
    .sort((a, b) => {
      // First sort by score
      if (Math.abs(a.score - b.score) > 0.05) {
        return b.score - a.score;
      }
      // If scores are close, prioritize certain sources
      const sourcePriority: Record<string, number> = {
        'logo-detection': 4,
        'logo-detection-fuzzy': 3,
        'text-exact': 4,
        'text-extracted': 3,
        'text-extracted-fuzzy': 2,
        'text-fuzzy': 2,
        'text-word-fuzzy': 1,
        'label-exact': 2,
        'label-fuzzy': 1,
      };
      return (sourcePriority[b.source] || 0) - (sourcePriority[a.source] || 0);
    });

  console.log('[BrandDetection] Final brand options:', sortedResults.slice(0, 10));
  
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

    // Extract clothing type and category from labels
    const labels = result.labelAnnotations?.map((l: any) => l.description) || [];
    console.log('[ImageAnalysis] Detected labels:', labels);
    const clothingMatch = matchClothingType(labels);
    const clothingType = clothingMatch?.type;
    const clothingCategory = clothingMatch?.category;
    console.log('[ImageAnalysis] Matched clothing type:', clothingType);
    console.log('[ImageAnalysis] Matched clothing category:', clothingCategory);
    
    // Detect pattern from labels
    const detectedPattern = detectPattern(labels);
    console.log('[ImageAnalysis] Detected pattern:', detectedPattern);

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
      category: clothingCategory || undefined,
      type: clothingType || undefined,
      color: color || undefined,
      brand: brand || undefined,
      pattern: detectedPattern || undefined,
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

