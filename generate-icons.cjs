const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'public', 'logo.png');
const publicDir = path.join(__dirname, 'public');

async function generateIcons() {
  const sizes = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 }
  ];

  for (const item of sizes) {
    await sharp(inputFile)
      .resize({
        width: item.size,
        height: item.size,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(path.join(publicDir, item.name));
    console.log(`Generated ${item.name}`);
  }
}

generateIcons().catch(err => {
  console.error("Error generating icons:", err);
});
