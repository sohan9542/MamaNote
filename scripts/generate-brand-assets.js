/**
 * Generates app icon, adaptive icon, splash, and favicon from assets/mainlogo.png.
 * Run: npm run assets:brand
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const SOURCE = path.join(ASSETS, 'mainlogo.png');

// Sampled from the logo peach gradient — keeps edges seamless on splash & icons.
const BRAND_PEACH = '#F9B88A';
const BRAND_PEACH_RGB = { r: 249, g: 184, b: 138 };

async function sampleBrandColor() {
  const { data, info } = await sharp(SOURCE)
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  // Average color along the top edge (peach background region).
  for (let x = 20; x < info.width - 20; x++) {
    const i = (30 * info.width + x) * info.channels;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

async function loadCleanLogo(peachRgb) {
  return sharp(SOURCE).flatten({ background: peachRgb }).png().toBuffer();
}

async function writeIcon(cleanLogo, peachRgb) {
  await sharp(cleanLogo)
    .resize(1024, 1024, { fit: 'contain', background: peachRgb })
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));
}

async function writeAdaptiveIcon() {
  // Android applies its own mask — foreground must be transparent with logo in safe zone.
  // Do NOT flatten here; let backgroundColor fill the area behind the rounded logo.
  const canvas = 1024;
  const safeSize = Math.round(canvas * 0.5);

  const foreground = await sharp(SOURCE)
    .resize(safeSize, safeSize, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: foreground, gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS, 'adaptive-icon.png'));
}

async function writeSplashIcon(cleanLogo, peachRgb) {
  // Dedicated splash asset — flattened peach edges, no white fringe on dark bg.
  await sharp(cleanLogo)
    .resize(512, 512, { fit: 'contain', background: peachRgb })
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));
}

async function writeLogoClean(cleanLogo, peachRgb) {
  await sharp(cleanLogo)
    .resize(512, 512, { fit: 'contain', background: peachRgb })
    .png()
    .toFile(path.join(ASSETS, 'logo-clean.png'));
}

async function writeFavicon(cleanLogo, peachRgb) {
  await sharp(cleanLogo)
    .resize(48, 48, { fit: 'contain', background: peachRgb })
    .png()
    .toFile(path.join(ASSETS, 'favicon.png'));
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error('Missing assets/mainlogo.png');
    process.exit(1);
  }

  const peachRgb = await sampleBrandColor();
  const peachHex =
    '#' +
    [peachRgb.r, peachRgb.g, peachRgb.b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('');

  console.log('Brand peach:', peachHex);
  const cleanLogo = await loadCleanLogo(peachRgb);

  await writeIcon(cleanLogo, peachRgb);
  await writeAdaptiveIcon();
  await writeSplashIcon(cleanLogo, peachRgb);
  await writeLogoClean(cleanLogo, peachRgb);
  await writeFavicon(cleanLogo, peachRgb);

  console.log('Generated: icon.png, adaptive-icon.png, splash-icon.png, logo-clean.png, favicon.png');
  console.log('Set adaptiveIcon.backgroundColor to', peachHex, 'in app.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
