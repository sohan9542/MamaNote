/**
 * Writes minimal placeholder PNGs so Expo can start before final artwork exists.
 * Replace these files with production assets (see assets/README.md).
 */
const fs = require('fs');
const path = require('path');

// 1×1 soft-pink PNG
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const assetsDir = path.join(__dirname, '..', 'assets');
const files = [
  'icon.png',
  'adaptive-icon.png',
  'splash.png',
  'favicon.png',
  'notification-icon.png',
];

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

for (const file of files) {
  const target = path.join(assetsDir, file);
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, PLACEHOLDER_PNG);
    console.log(`Created ${file}`);
  }
}

// Intentionally do not auto-generate brand assets here.
// Team can run `npm run assets:brand` manually when needed.
