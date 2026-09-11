const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size) {
  const width = size;
  const height = size;

  // Raw pixel data: each scanline starts with filter byte 0x00, followed by RGBA for each pixel
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  // Background color: indigo (#4F46E5 -> R:79, G:70, B:229, A:255)
  // Center circle/accent: emerald (#10B981) or white (#FFFFFF)
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.38;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded rectangle / badge effect
      const cornerRadius = size * 0.22;
      const inBoxX = Math.abs(x - cx) <= (width / 2 - cornerRadius);
      const inBoxY = Math.abs(y - cy) <= (height / 2 - cornerRadius);
      const nearCorner = Math.max(0, Math.abs(x - cx) - (width / 2 - cornerRadius)) ** 2 +
                         Math.max(0, Math.abs(y - cy) - (height / 2 - cornerRadius)) ** 2 <= cornerRadius ** 2;

      const isInsideCard = inBoxX || inBoxY || nearCorner;

      if (!isInsideCard) {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      } else if (dist <= radius * 0.75) {
        // Center White symbol / globe
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
        rawData[pxOffset + 3] = 255;
      } else if (dist <= radius) {
        // Cyan / Emerald inner ring
        rawData[pxOffset] = 16;
        rawData[pxOffset + 1] = 185;
        rawData[pxOffset + 2] = 129;
        rawData[pxOffset + 3] = 255;
      } else {
        // Indigo gradient background
        const grad = (x + y) / (width + height);
        rawData[pxOffset] = Math.round(79 + 45 * grad);
        rawData[pxOffset + 1] = Math.round(70 - 12 * grad);
        rawData[pxOffset + 2] = Math.round(229 + 15 * grad);
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  // Compress with deflate
  const compressed = zlib.deflateSync(rawData);

  // Helper to build chunk
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuffer, data]);

    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc32(body), 0);

    return Buffer.concat([len, body, crcBuffer]);
  }

  // CRC32 table
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression: deflate (0)
  ihdrData[11] = 0; // Filter: standard (0)
  ihdrData[12] = 0; // Interlace: None (0)

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate CRC Table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

// Ensure icons folder exists
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate 16, 48, 128
[16, 48, 128].forEach((size) => {
  const pngBuffer = createPNG(size);
  const filePath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`Generated ${filePath} (${pngBuffer.length} bytes)`);
});
