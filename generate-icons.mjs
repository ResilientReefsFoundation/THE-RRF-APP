#!/usr/bin/env node
/**
 * generate-icons.mjs
 * 
 * Run this once to generate all PWA icons from a source image.
 * 
 * Usage:
 *   npm install sharp --save-dev
 *   node generate-icons.mjs ./your-logo.png
 * 
 * Outputs to public/icons/ and public/apple-touch-icon.png
 */

import sharp from 'sharp';
import { mkdirSync } from 'fs';
import path from 'path';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node generate-icons.mjs <source-image.png>');
  console.error('Source image should be at least 512x512px, ideally 1024x1024px square.');
  process.exit(1);
}

mkdirSync('public/icons', { recursive: true });

const sizes = [
  { name: 'public/icons/icon-192.png', size: 192 },
  { name: 'public/icons/icon-512.png', size: 512 },
  { name: 'public/apple-touch-icon.png', size: 180 },
  // Splash screens (iOS)
  { name: 'public/icons/splash-1170x2532.png', width: 1170, height: 2532 },
  { name: 'public/icons/splash-1284x2778.png', width: 1284, height: 2778 },
];

for (const spec of sizes) {
  if (spec.size) {
    await sharp(source)
      .resize(spec.size, spec.size, { fit: 'contain', background: { r: 74, g: 144, b: 226, alpha: 1 } })
      .png()
      .toFile(spec.name);
    console.log(`✓ ${spec.name}`);
  } else {
    // Splash screen: center the icon on a colored background
    const iconSize = Math.min(spec.width, spec.height) * 0.4;
    const icon = await sharp(source)
      .resize(Math.round(iconSize), Math.round(iconSize), { fit: 'contain', background: { r: 74, g: 144, b: 226, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: spec.width,
        height: spec.height,
        channels: 4,
        background: { r: 74, g: 144, b: 226, alpha: 1 }
      }
    })
      .composite([{
        input: icon,
        left: Math.round((spec.width - iconSize) / 2),
        top: Math.round((spec.height - iconSize) / 2),
      }])
      .png()
      .toFile(spec.name);
    console.log(`✓ ${spec.name}`);
  }
}

console.log('\nAll icons generated. Commit the public/ folder to your repo.');
