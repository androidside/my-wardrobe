import sharp from 'sharp';
import { readdir, copyFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const SOURCE_DIR = '/Users/mvilla/Git/new_items';
const TARGET_DIR = join(process.cwd(), 'public', 'icons', 'clothing');
const THRESHOLD = 240; // Pixels with RGB values above this threshold will be made transparent

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

    console.log(`✓ Converted and saved: ${outputPath}`);
  } catch (error) {
    console.error(`✗ Error processing ${inputPath}:`, error);
    throw error;
  }
}

async function processNewIcons(): Promise<void> {
  try {
    // Check if source directory exists
    if (!existsSync(SOURCE_DIR)) {
      console.error(`Source directory not found: ${SOURCE_DIR}`);
      process.exit(1);
    }

    // Check if target directory exists
    if (!existsSync(TARGET_DIR)) {
      console.error(`Target directory not found: ${TARGET_DIR}`);
      process.exit(1);
    }

    // Get all PNG files from source
    const files = await readdir(SOURCE_DIR);
    const pngFiles = files.filter((file) => file.toLowerCase().endsWith('.png'));

    if (pngFiles.length === 0) {
      console.log('No PNG files found in source directory');
      return;
    }

    console.log(`Found ${pngFiles.length} PNG file(s) to process\n`);

    // Process each file
    let successCount = 0;
    let skippedCount = 0;
    
    for (const file of pngFiles) {
      // Skip the generic "generated-image" files
      if (file.startsWith('generated-image')) {
        console.log(`Skipping: ${file} (generic name)`);
        skippedCount++;
        continue;
      }

      const inputPath = join(SOURCE_DIR, file);
      const outputPath = join(TARGET_DIR, file);
      
      await convertToTransparent(inputPath, outputPath);
      successCount++;
    }

    console.log(`\n✓ Successfully processed ${successCount} icon(s)`);
    if (skippedCount > 0) {
      console.log(`⊘ Skipped ${skippedCount} file(s)`);
    }
    console.log(`Threshold used: ${THRESHOLD} (RGB values >= ${THRESHOLD} become transparent)`);
    console.log(`Output directory: ${TARGET_DIR}`);
  } catch (error) {
    console.error('Error processing icons:', error);
    process.exit(1);
  }
}

// Run the script
processNewIcons();
