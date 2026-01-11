import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const ICONS_DIR = join(process.cwd(), 'public', 'icons', 'clothing');
const THRESHOLD = 240; // Pixels with RGB values above this threshold will be made transparent (0-255)
                      // Lower values = more white pixels become transparent
                      // Higher values = only very white pixels become transparent

async function convertToTransparent(inputPath: string, outputPath: string): Promise<void> {
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
      if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
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

    console.log(`✓ Converted: ${outputPath}`);
  } catch (error) {
    console.error(`✗ Error processing ${inputPath}:`, error);
    throw error;
  }
}

async function processAllIcons(): Promise<void> {
  try {
    // Check if directory exists
    if (!existsSync(ICONS_DIR)) {
      console.error(`Directory not found: ${ICONS_DIR}`);
      process.exit(1);
    }

    // Get all PNG files
    const files = await readdir(ICONS_DIR);
    const pngFiles = files.filter((file) => file.toLowerCase().endsWith('.png'));

    if (pngFiles.length === 0) {
      console.log('No PNG files found in icons directory');
      return;
    }

    console.log(`Found ${pngFiles.length} PNG file(s) to process\n`);

    // Process each file
    for (const file of pngFiles) {
      const inputPath = join(ICONS_DIR, file);
      const outputPath = join(ICONS_DIR, file); // Overwrite the original file
      
      await convertToTransparent(inputPath, outputPath);
    }

    console.log(`\n✓ Successfully processed ${pngFiles.length} icon(s)`);
    console.log(`Threshold used: ${THRESHOLD} (RGB values >= ${THRESHOLD} become transparent)`);
  } catch (error) {
    console.error('Error processing icons:', error);
    process.exit(1);
  }
}

// Run the script
processAllIcons();
