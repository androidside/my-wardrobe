import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clothing types and colors from the application
const CLOTHING_TYPES = [
  'T-shirt', 'Shirt', 'Jacket', 'Coat', 'Sweater', 'Hoodie',
  'Pants', 'Jeans', 'Shorts', 'Skirt', 'Dress',
  'Shoes', 'Sneakers', 'Boots', 'Sandals', 'Accessories', 'Other'
];

const CLOTHING_COLORS = [
  'Black', 'White', 'Gray', 'Navy', 'Blue', 'Red', 'Green',
  'Yellow', 'Orange', 'Pink', 'Purple', 'Brown', 'Beige',
  'Multicolor', 'Other'
];

interface CompatibilityMatrix {
  colorCompatibility: Record<string, Record<string, number>>;
  typeCompatibility: Record<string, Record<string, number>>;
  styleRules: {
    formalityLevels: Record<string, 'formal' | 'casual' | 'sporty' | 'versatile'>;
    typeCategories: {
      tops: string[];
      bottoms: string[];
      outerwear: string[];
      footwear: string[];
      accessories: string[];
    };
    compatibilityRules: Array<{
      rule: string;
      description: string;
      score: number;
    }>;
  };
}

async function generateCompatibilityMatrix(): Promise<CompatibilityMatrix> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please set it in your .env file or export it.');
  }

  const openai = new OpenAI({ apiKey });

  console.log('🤖 Generating compatibility matrix using OpenAI...\n');

  // Generate color compatibility matrix
  console.log('📊 Generating color compatibility matrix...');
  const colorPrompt = `You are a fashion expert. Generate a compatibility matrix for clothing colors.

Available colors: ${CLOTHING_COLORS.join(', ')}

For each color pair, provide a compatibility score from 0-10 where:
- 10 = Perfect match (classic combinations like black-white, navy-beige)
- 8-9 = Excellent match (complementary colors, analogous colors)
- 6-7 = Good match (neutral combinations, acceptable contrasts)
- 4-5 = Acceptable but not ideal (somewhat clashing)
- 2-3 = Poor match (clashing colors)
- 0-1 = Very poor match (strongly clashing)

Consider:
- Color theory (complementary, analogous, triadic, monochromatic)
- Fashion trends and classic combinations
- Versatility and wearability
- Context (casual vs formal)

Return ONLY a JSON object with this exact structure:
{
  "colorCompatibility": {
    "Black": { "White": 10, "Gray": 9, "Navy": 8, ... },
    "White": { "Black": 10, "Navy": 9, "Blue": 8, ... },
    ...
  }
}

Include all color combinations. Be thorough and consider real-world fashion applications.`;

  const colorResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a fashion expert specializing in color theory and outfit coordination. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: colorPrompt
      }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  const colorData = JSON.parse(colorResponse.choices[0].message.content || '{}');

  // Generate type compatibility matrix
  console.log('👔 Generating type compatibility matrix...');
  const typePrompt = `You are a fashion expert. Generate a compatibility matrix for clothing types.

Available types: ${CLOTHING_TYPES.join(', ')}

For each type pair, provide a compatibility score from 0-10 where:
- 10 = Perfect match (classic combinations like T-shirt + Jeans, Shirt + Pants)
- 8-9 = Excellent match (very common and stylish combinations)
- 6-7 = Good match (works well together, acceptable)
- 4-5 = Acceptable but unusual (can work in specific contexts)
- 2-3 = Poor match (rarely worn together, looks odd)
- 0-1 = Very poor match (incompatible, doesn't make sense)

Consider:
- What items are typically worn together
- Formality levels matching
- Practicality and common fashion sense
- Seasonal appropriateness
- Body coverage (e.g., don't wear two jackets)

Categories:
- Tops: T-shirt, Shirt, Sweater, Hoodie
- Bottoms: Pants, Jeans, Shorts, Skirt
- Outerwear: Jacket, Coat
- Footwear: Shoes, Sneakers, Boots, Sandals
- Special: Dress (complete outfit), Accessories

Return ONLY a JSON object with this exact structure:
{
  "typeCompatibility": {
    "T-shirt": { "Jeans": 10, "Pants": 9, "Shorts": 8, "Sneakers": 9, ... },
    "Shirt": { "Pants": 10, "Jeans": 9, "Shoes": 9, ... },
    ...
  }
}

Include all type combinations. Be thorough and consider real-world fashion applications.`;

  const typeResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a fashion expert specializing in outfit coordination and style matching. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: typePrompt
      }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  const typeData = JSON.parse(typeResponse.choices[0].message.content || '{}');

  // Generate style rules and formality levels
  console.log('🎨 Generating style rules and formality levels...');
  const stylePrompt = `You are a fashion expert. Generate style rules and formality classifications.

Available types: ${CLOTHING_TYPES.join(', ')}

1. Classify each clothing type's formality level:
   - "formal": Business attire, dressy occasions
   - "casual": Everyday wear, relaxed settings
   - "sporty": Athletic wear, active lifestyle
   - "versatile": Can work in multiple contexts

2. Categorize types into groups:
   - tops: Upper body garments
   - bottoms: Lower body garments
   - outerwear: Jackets and coats
   - footwear: All shoe types
   - accessories: Accessories category

3. Provide general compatibility rules with scores (0-10):
   - Rules about matching formality levels
   - Rules about color coordination
   - Rules about type combinations
   - Rules about seasonal appropriateness

Return ONLY a JSON object with this exact structure:
{
  "formalityLevels": {
    "T-shirt": "casual",
    "Shirt": "versatile",
    "Jacket": "versatile",
    ...
  },
  "typeCategories": {
    "tops": ["T-shirt", "Shirt", "Sweater", "Hoodie"],
    "bottoms": ["Pants", "Jeans", "Shorts", "Skirt"],
    "outerwear": ["Jacket", "Coat"],
    "footwear": ["Shoes", "Sneakers", "Boots", "Sandals"],
    "accessories": ["Accessories"]
  },
  "compatibilityRules": [
    {
      "rule": "matching_formality",
      "description": "Items with matching formality levels score +2",
      "score": 2
    },
    {
      "rule": "complementary_colors",
      "description": "Complementary color pairs score +3",
      "score": 3
    },
    ...
  ]
}`;

  const styleResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a fashion expert specializing in style rules and formality classification. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: stylePrompt
      }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  const styleData = JSON.parse(styleResponse.choices[0].message.content || '{}');

  // Combine all data
  const matrix: CompatibilityMatrix = {
    colorCompatibility: colorData.colorCompatibility || {},
    typeCompatibility: typeData.typeCompatibility || {},
    styleRules: {
      formalityLevels: styleData.formalityLevels || {},
      typeCategories: styleData.typeCategories || {
        tops: [],
        bottoms: [],
        outerwear: [],
        footwear: [],
        accessories: []
      },
      compatibilityRules: styleData.compatibilityRules || []
    }
  };

  return matrix;
}

// Main execution
async function main() {
  try {
    const matrix = await generateCompatibilityMatrix();
    
    // Save to file
    const projectRoot = path.join(__dirname, '..');
    const outputPath = path.join(projectRoot, 'src/data/outfitCompatibility.ts');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileContent = `// Auto-generated compatibility matrix for outfit combinations
// Generated using OpenAI GPT-4
// Last updated: ${new Date().toISOString()}

import { ClothingType, ClothingColor } from '../types/clothing';

export interface CompatibilityMatrix {
  colorCompatibility: Record<ClothingColor, Record<ClothingColor, number>>;
  typeCompatibility: Record<ClothingType, Record<ClothingType, number>>;
  styleRules: {
    formalityLevels: Record<ClothingType, 'formal' | 'casual' | 'sporty' | 'versatile'>;
    typeCategories: {
      tops: ClothingType[];
      bottoms: ClothingType[];
      outerwear: ClothingType[];
      footwear: ClothingType[];
      accessories: ClothingType[];
    };
    compatibilityRules: Array<{
      rule: string;
      description: string;
      score: number;
    }>;
  };
}

export const OUTFIT_COMPATIBILITY: CompatibilityMatrix = ${JSON.stringify(matrix, null, 2)};

// Helper function to get color compatibility score
export function getColorCompatibility(color1: ClothingColor, color2: ClothingColor): number {
  return OUTFIT_COMPATIBILITY.colorCompatibility[color1]?.[color2] ?? 5;
}

// Helper function to get type compatibility score
export function getTypeCompatibility(type1: ClothingType, type2: ClothingType): number {
  return OUTFIT_COMPATIBILITY.typeCompatibility[type1]?.[type2] ?? 5;
}

// Helper function to get formality level
export function getFormalityLevel(type: ClothingType): 'formal' | 'casual' | 'sporty' | 'versatile' {
  return OUTFIT_COMPATIBILITY.styleRules.formalityLevels[type] ?? 'versatile';
}
`;

    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    
    console.log('\n✅ Compatibility matrix generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log('\n📊 Summary:');
    console.log(`   - Color combinations: ${Object.keys(matrix.colorCompatibility).length} colors`);
    console.log(`   - Type combinations: ${Object.keys(matrix.typeCompatibility).length} types`);
    console.log(`   - Style rules: ${matrix.styleRules.compatibilityRules.length} rules`);
    
  } catch (error) {
    console.error('\n❌ Error generating compatibility matrix:');
    console.error(error);
    process.exit(1);
  }
}

main();

