import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { websiteWorks } from "@/config/myData";
import { OUTPUT_DIR, SCREENSHOT_CONFIG } from '@/config/global';

async function processImage(url: string) {
  const inputPath = path.join(OUTPUT_DIR, `${url}.jpeg`);
  const outputPath = path.join(OUTPUT_DIR, `${url}.webp`);

  try {
    await sharp(inputPath)
      .resize(SCREENSHOT_CONFIG.width, SCREENSHOT_CONFIG.height, {
        fit: 'cover', // or 'contain' if you want to maintain aspect ratio
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    console.log(`✅ Processed ${url}.jpeg to 640x480px WebP`);

    // Optional: Delete the original JPEG after conversion
    fs.unlinkSync(inputPath);
    console.log(`🗑️ Deleted original ${url}.jpeg`);
  } catch (error) {
    console.error(`❌ Failed to process ${url}:`, error);
  }
}

async function takeScreenshot(url: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.setViewportSize({
      width: SCREENSHOT_CONFIG.width * 2,
      height: SCREENSHOT_CONFIG.height * 2
    });
    await page.goto(`https://${url}`, { waitUntil: 'networkidle' });

    const fileName = `${url}.jpeg`;
    await page.screenshot({
      path: path.join(OUTPUT_DIR, fileName),
      type: 'jpeg',
      quality: 80
    });

    console.log(`✅ Screenshot saved for ${url}`);

    // Process the image immediately after capture
    await processImage(url);
  } catch (error) {
    console.error(`❌ Failed to capture ${url}:`, error);
  } finally {
    await browser.close();
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Install sharp if needed (optional check)
  try {
    require.resolve('sharp');
  } catch {
    console.log('Installing sharp...');
    await import('child_process').then(({ execSync }) => {
      execSync('bun add sharp', { stdio: 'inherit' });
    });
  }

  for (const website of websiteWorks) {
    await takeScreenshot(website);
  }
}

main().catch(console.error);