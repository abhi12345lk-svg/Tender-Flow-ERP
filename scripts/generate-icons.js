import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const typeAndData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

export function generatePng(width, height, drawFn) {
  // RGBA scanlines: 1 filter byte (0) + width * 4 bytes per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw TenderFlow Government Landmark / Document Icon
function drawTenderFlowIcon(x, y, w, h, isMaskable = false) {
  // Normalized coords -1 to 1
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background
  let bgR = 15, bgG = 23, bgB = 42; // #0f172a (Slate 900)
  
  if (!isMaskable) {
    // Rounded squircle
    const cornerRadius = 0.85;
    if (Math.abs(nx) > cornerRadius && Math.abs(ny) > cornerRadius) {
      const cornerDx = Math.abs(nx) - cornerRadius;
      const cornerDy = Math.abs(ny) - cornerRadius;
      if (Math.sqrt(cornerDx * cornerDx + cornerDy * cornerDy) > (1 - cornerRadius)) {
        return [0, 0, 0, 0]; // Transparent outside squircle
      }
    }
  }

  // Circular emblem / seal in center
  const emblemRadius = isMaskable ? 0.65 : 0.72;
  const inEmblem = dist < emblemRadius;
  const onEmblemRing = dist >= (emblemRadius - 0.04) && dist <= emblemRadius;

  if (onEmblemRing) {
    return [59, 130, 246, 255]; // Royal Blue accent #3b82f6
  }

  if (inEmblem) {
    // Gradient inside emblem: Dark navy #1e293b to Royal #1e3a8a
    const grad = (ny + 1) * 0.5;
    bgR = Math.round(15 + 15 * grad);
    bgG = Math.round(23 + 35 * grad);
    bgB = Math.round(42 + 96 * grad);
  }

  // Draw Central Motif: Landmark / Pillar + Document
  // Landmark roof triangle: -0.35 <= nx <= 0.35, -0.45 <= ny <= -0.28
  const roofTopY = -0.42;
  const roofBottomY = -0.25;
  if (ny >= roofTopY && ny <= roofBottomY) {
    const halfWidth = ((ny - roofTopY) / (roofBottomY - roofTopY)) * 0.38;
    if (Math.abs(nx) <= halfWidth) {
      return [255, 255, 255, 255]; // White roof pediment
    }
  }

  // Roof base line: ny between -0.25 and -0.21, |nx| <= 0.40
  if (ny >= -0.25 && ny <= -0.21 && Math.abs(nx) <= 0.40) {
    return [255, 255, 255, 255];
  }

  // 4 Columns: ny between -0.21 and 0.22
  if (ny > -0.21 && ny < 0.22) {
    const colPositions = [-0.27, -0.09, 0.09, 0.27];
    const colWidth = 0.055;
    for (const cx of colPositions) {
      if (Math.abs(nx - cx) <= colWidth / 2) {
        return [255, 255, 255, 255];
      }
    }
  }

  // Plinth / Base: ny between 0.22 and 0.28, |nx| <= 0.42
  if (ny >= 0.22 && ny <= 0.28 && Math.abs(nx) <= 0.42) {
    return [255, 255, 255, 255];
  }

  // Sub-base: ny between 0.28 and 0.34, |nx| <= 0.46
  if (ny > 0.28 && ny <= 0.34 && Math.abs(nx) <= 0.46) {
    return [59, 130, 246, 255]; // Blue sub-base
  }

  // Golden accent star / emblem dot in roof center:
  if (Math.sqrt(nx * nx + (ny - -0.32) * (ny - -0.32)) < 0.04) {
    return [245, 158, 11, 255]; // Amber #f59e0b
  }

  return [bgR, bgG, bgB, 255];
}

// Generate all standard PWA assets
const publicDir = path.resolve('public');
const iconsDir = path.resolve(publicDir, 'icons');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

console.log('Generating PWA Icons...');

// 1. 192x192 Standard
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), generatePng(192, 192, (x, y, w, h) => drawTenderFlowIcon(x, y, w, h, false)));
console.log('✓ icon-192x192.png');

// 2. 512x512 Standard
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), generatePng(512, 512, (x, y, w, h) => drawTenderFlowIcon(x, y, w, h, false)));
console.log('✓ icon-512x512.png');

// 3. 192x192 Maskable
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192x192.png'), generatePng(192, 192, (x, y, w, h) => drawTenderFlowIcon(x, y, w, h, true)));
console.log('✓ icon-maskable-192x192.png');

// 4. 512x512 Maskable
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.png'), generatePng(512, 512, (x, y, w, h) => drawTenderFlowIcon(x, y, w, h, true)));
console.log('✓ icon-maskable-512x512.png');

// 5. Apple Touch Icon 180x180
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), generatePng(180, 180, (x, y, w, h) => drawTenderFlowIcon(x, y, w, h, true)));
console.log('✓ apple-touch-icon.png');

// 6. SVG Favicon
const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="tfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#tfGrad)" />
  <circle cx="50" cy="50" r="42" fill="none" stroke="#3b82f6" stroke-width="2.5" opacity="0.6"/>
  <!-- Government Landmark Pediment -->
  <polygon points="50,22 24,35 76,35" fill="#ffffff" />
  <rect x="22" y="35" width="56" height="4" fill="#ffffff" rx="1" />
  <!-- Pillars -->
  <rect x="27" y="42" width="6" height="26" fill="#ffffff" rx="1.5" />
  <rect x="41" y="42" width="6" height="26" fill="#ffffff" rx="1.5" />
  <rect x="53" y="42" width="6" height="26" fill="#ffffff" rx="1.5" />
  <rect x="67" y="42" width="6" height="26" fill="#ffffff" rx="1.5" />
  <!-- Pedestal -->
  <rect x="22" y="70" width="56" height="4" fill="#ffffff" rx="1" />
  <rect x="18" y="75" width="64" height="4.5" fill="#3b82f6" rx="1.5" />
  <!-- Gold crest star -->
  <circle cx="50" cy="30" r="2.5" fill="#f59e0b" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgFavicon);
console.log('✓ favicon.svg');
