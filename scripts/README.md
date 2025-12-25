# Compatibility Matrix Generator

This script generates an outfit compatibility matrix using OpenAI's GPT-4 model. The matrix includes:

1. **Color Compatibility**: Scores (0-10) for how well each color pairs with every other color
2. **Type Compatibility**: Scores (0-10) for how well each clothing type pairs with every other type
3. **Style Rules**: Formality levels, type categories, and general compatibility rules

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key with access to GPT-4
   - Sign up at https://platform.openai.com/
   - Get your API key from https://platform.openai.com/api-keys

2. **Set Environment Variable**: Add your API key to your environment
   
   Create a `.env` file in the project root (if it doesn't exist):
   ```bash
   OPENAI_API_KEY=your-api-key-here
   ```
   
   Or export it in your terminal:
   ```bash
   export OPENAI_API_KEY=your-api-key-here
   ```

## Usage

Run the generator script:

```bash
npm run generate:compatibility
```

The script will:
1. Call OpenAI API three times to generate:
   - Color compatibility matrix
   - Type compatibility matrix
   - Style rules and formality levels
2. Combine all data into a single compatibility matrix
3. Save the result to `src/data/outfitCompatibility.ts`

## Output

The generated file (`src/data/outfitCompatibility.ts`) will contain:

- `OUTFIT_COMPATIBILITY`: The complete compatibility matrix
- Helper functions:
  - `getColorCompatibility(color1, color2)`: Get compatibility score between two colors
  - `getTypeCompatibility(type1, type2)`: Get compatibility score between two types
  - `getFormalityLevel(type)`: Get formality level of a clothing type

## Cost Estimate

This script makes 3 API calls to OpenAI GPT-4:
- ~1 call for color compatibility (15 colors × 15 colors = 225 combinations)
- ~1 call for type compatibility (17 types × 17 types = 289 combinations)
- ~1 call for style rules

Estimated cost: ~$0.10-0.30 (depending on token usage)

## Notes

- The generated matrix is saved as TypeScript code and can be imported directly
- You can regenerate the matrix anytime by running the script again
- The matrix is based on fashion best practices and color theory
- You can manually edit the generated file if needed

