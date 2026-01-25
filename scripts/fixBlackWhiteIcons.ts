import sharp from 'sharp';
import { join } from 'path';

const SOURCE_DIR = '/Users/mvilla/Git/new_items';
const TARGET_DIR = join(process.cwd(), 'public', 'icons', 'clothing');
const WHITE_THRESHOLD = 240; // Pixels with RGB values above this become transparent
const BLACK_THRESHOLD = 15; // Pixels with RGB values below this become transparent

const FILES_TO_PROCESS = ['chinos.png', 'sweatpants.png'];

async function convertBlackWhiteToTransparent(inputPath: string, outputPath: string): Promise<void> {
  try {
    console.log(`Processing: ${inputPath}`);
    
    // Read the image
    const image = sharp(inputPath);
    const { data, info } = await image
      .ensureAlpha() // Ensure alpha channel exists
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Process pixels
    const channels = info.channels;
    const newData = Buffer.from(data);

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Check if pixel is white/light (all RGB values above threshold)
      if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
        // Make transparent (set alpha to 0)
        if (channels === 4) {
          newData[i + 3] = 0; // Alpha channel
        }
      }
      
      // Check if pixel is black/dark (all RGB values below threshold)
      if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
        // Make transparent (set alpha to 0)
        if (channels === 4) {
          newData[i + 3] = 0; // Alpha channel
        }
      }
    }

    // Save the processed image
    await sharp(newData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: channels,
      },
    })
      .png()
      .toFile(outputPath);

    console.log(`✓ Converted and saved: ${outputPath}`);
  } catch (error) {
    console.error(`✗ Error processing ${inputPath}:`, error);
    throw error;
  }
}

async function processIcons(): Promise<void> {
  try {
    console.log(`Processing ${FILES_TO_PROCESS.length} icon(s) with black & white transparency\n`);

    // Process each file
    for (const file of FILES_TO_PROCESS) {
      const inputPath = join(SOURCE_DIR, file);
      const outputPath = join(TARGET_DIR, file);
      
      await convertBlackWhiteToTransparent(inputPath, outputPath);
    }

    console.log(`\n✓ Successfully processed ${FILES_TO_PROCESS.length} icon(s)`);
    console.log(`White threshold: ${WHITE_THRESHOLD} (RGB >= ${WHITE_THRESHOLD} → transparent)`);
    console.log(`Black threshold: ${BLACK_THRESHOLD} (RGB <= ${BLACK_THRESHOLD} → transparent)`);
    console.log(`Output directory: ${TARGET_DIR}`);
  } catch (error) {
    console.error('Error processing icons:', error);
    process.exit(1);
  }
}

// Run the script
processIcons();
