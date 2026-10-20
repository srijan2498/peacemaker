const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function createPng(width, height, isMaskable = false) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);
  const cx = width / 2;
  const cy = height / 2;
  const cornerRadius = isMaskable ? 0 : width * 0.22; // square for maskable, rounded for standard

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Check rounded corner boundary for standard icon
      let inside = true;
      if (!isMaskable) {
        let dx = 0;
        let dy = 0;
        if (x < cornerRadius) dx = cornerRadius - x;
        else if (x > width - cornerRadius) dx = x - (width - cornerRadius);
        if (y < cornerRadius) dy = cornerRadius - y;
        else if (y > height - cornerRadius) dy = y - (height - cornerRadius);

        if (dx > 0 && dy > 0 && dx * dx + dy * dy > cornerRadius * cornerRadius) {
          inside = false;
        }
      }

      if (!inside) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Normalized coordinates
      const nx = x / width;
      const ny = y / height;

      // Base Gradient: Indigo (#4F46E5: 79, 70, 229) to Purple (#9333EA: 147, 51, 234)
      const gradT = (nx + ny) / 2;
      let r = Math.round(79 + (147 - 79) * gradT);
      let g = Math.round(70 + (51 - 70) * gradT);
      let b = Math.round(229 + (234 - 229) * gradT);
      let a = 255;

      // Draw House Silhouette & Heart Emblem in center
      // Scaled coordinates relative to center (bounds: -1 to 1)
      const sx = (x - cx) / (width * 0.45);
      const sy = (y - cy) / (height * 0.45);

      // Roof triangle: apex at (0, -0.65), base line at sy = -0.15, width |sx| <= 0.75
      const roofPeak = -0.65;
      const roofBase = -0.15;
      const inRoof = sy >= roofPeak && sy <= roofBase && Math.abs(sx) <= ((sy - roofPeak) / (roofBase - roofPeak)) * 0.85;

      // House body: sx in [-0.55, 0.55], sy in [-0.15, 0.6]
      const inBody = sx >= -0.55 && sx <= 0.55 && sy >= -0.15 && sy <= 0.65;

      // Chimney: sx in [0.3, 0.45], sy in [-0.5, -0.2]
      const inChimney = sx >= 0.3 && sx <= 0.45 && sy >= -0.5 && sy <= -0.2;

      // Heart emblem inside house: centered around (0, 0.22)
      const hx = sx / 0.35;
      const hy = (sy - 0.2) / 0.35;
      const inHeart = (hx * hx + (hy - Math.sqrt(Math.abs(hx))) * (hy - Math.sqrt(Math.abs(hx)))) <= 0.85;

      if (inChimney) {
        r = 230; g = 235; b = 255;
      } else if (inRoof) {
        // Crisp white roof
        r = 255; g = 255; b = 255;
      } else if (inBody) {
        if (inHeart) {
          // Warm Rose Heart (#F43F5E: 244, 63, 94)
          r = 244; g = 63; b = 94;
        } else {
          // Soft white house body
          r = 248; g = 250; b = 252;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    const crcVal = zlib.crc32(body);
    crc.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, body, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idatData), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = path.resolve(__dirname, '../public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. icon-192.png
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPng(192, 192, false));
console.log('Generated icon-192.png');

// 2. icon-512.png
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPng(512, 512, false));
console.log('Generated icon-512.png');

// 3. icon-maskable-192.png
fs.writeFileSync(path.join(outDir, 'icon-maskable-192.png'), createPng(192, 192, true));
console.log('Generated icon-maskable-192.png');

// 4. icon-maskable-512.png
fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), createPng(512, 512, true));
console.log('Generated icon-maskable-512.png');

// 5. apple-touch-icon.png in public root
const appleTouchPath = path.resolve(__dirname, '../public/apple-touch-icon.png');
fs.writeFileSync(appleTouchPath, createPng(180, 180, false));
console.log('Generated apple-touch-icon.png');

console.log('All PWA icons successfully generated!');
