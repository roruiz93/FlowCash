const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../assets/logo.png');
const RES = path.resolve(__dirname, '../android/app/src/main/res');

// Standard Android launcher icon sizes (dp → px @ each density)
const LAUNCHER_SIZES = [
  { folder: 'mipmap-mdpi',    size: 48  },
  { folder: 'mipmap-hdpi',    size: 72  },
  { folder: 'mipmap-xhdpi',   size: 96  },
  { folder: 'mipmap-xxhdpi',  size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Adaptive icon foreground: full canvas, logo fills the 72/108 safe zone (66.67%)
// Canvas = 108dp equivalent per density
const FOREGROUND_SIZES = [
  { folder: 'mipmap-mdpi',    canvas: 108, logo: 72  },
  { folder: 'mipmap-hdpi',    canvas: 162, logo: 108 },
  { folder: 'mipmap-xhdpi',   canvas: 216, logo: 144 },
  { folder: 'mipmap-xxhdpi',  canvas: 324, logo: 216 },
  { folder: 'mipmap-xxxhdpi', canvas: 432, logo: 288 },
];

const BG_COLOR = { r: 10, g: 10, b: 15, alpha: 1 };

async function run() {
  // ic_launcher and ic_launcher_round — full logo at correct size
  for (const { folder, size } of LAUNCHER_SIZES) {
    const dest = path.join(RES, folder);
    for (const name of ['ic_launcher', 'ic_launcher_round']) {
      const outPath = path.join(dest, `${name}.png`);
      await sharp(SRC)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toFile(outPath);
      // Remove old webp if present
      const webp = path.join(dest, `${name}.webp`);
      if (fs.existsSync(webp)) fs.unlinkSync(webp);
      console.log(`✓ ${folder}/${name}.png  (${size}x${size})`);
    }
  }

  // ic_launcher_foreground — logo centered within safe zone on transparent bg
  for (const { folder, canvas, logo } of FOREGROUND_SIZES) {
    const dest = path.join(RES, folder);
    const outPath = path.join(dest, 'ic_launcher_foreground.png');
    const padding = Math.round((canvas - logo) / 2);

    const resized = await sharp(SRC)
      .resize(logo, logo, { fit: 'contain', background: BG_COLOR })
      .png()
      .toBuffer();

    await sharp({
      create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: resized, top: padding, left: padding }])
      .png()
      .toFile(outPath);

    const webp = path.join(dest, 'ic_launcher_foreground.webp');
    if (fs.existsSync(webp)) fs.unlinkSync(webp);
    console.log(`✓ ${folder}/ic_launcher_foreground.png  (canvas:${canvas} logo:${logo} pad:${padding})`);
  }

  console.log('\nDone. Old .webp files replaced with .png');
}

run().catch(e => { console.error(e); process.exit(1); });
