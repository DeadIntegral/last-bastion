import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const sourceDirectory = path.join(root, 'public/assets/characters/expansion-sources');
const outputPath = path.join(root, 'public/assets/characters/expansion-atlas.png');
const frameWidth = 153;
const frameHeight = 160;
const atlasWidth = frameWidth * 4;
const atlasHeight = frameHeight * 4;
const sourceOrder = ['goblin-archer.png', 'goblin-bomber.png', 'orc-berserker.png', 'orc-shaman.png'];

function paeth(left, up, upperLeft) {
  const prediction = left + up - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const upDistance = Math.abs(prediction - up);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  return leftDistance <= upDistance && leftDistance <= upperLeftDistance ? left : upDistance <= upperLeftDistance ? up : upperLeft;
}

function decodeRgbaPng(filePath) {
  const buffer = fs.readFileSync(filePath);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const imageData = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    }
    if (type === 'IDAT') imageData.push(data);
    if (type === 'IEND') break;
  }
  if (bitDepth !== 8 || colorType !== 6) throw new Error(`${filePath} must be an 8-bit RGBA PNG.`);
  const filtered = zlib.inflateSync(Buffer.concat(imageData));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = filtered[sourceOffset++];
    for (let byte = 0; byte < stride; byte += 1) {
      const value = filtered[sourceOffset++];
      const destination = y * stride + byte;
      const left = byte >= 4 ? pixels[destination - 4] : 0;
      const up = y > 0 ? pixels[destination - stride] : 0;
      const upperLeft = y > 0 && byte >= 4 ? pixels[destination - stride - 4] : 0;
      const predictor = filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, upperLeft) : 0;
      pixels[destination] = (value + predictor) & 255;
    }
  }
  return { width, height, pixels };
}

function alphaBounds(image) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.pixels[(y * image.width + x) * 4 + 3] <= 4) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error('Source image has no visible pixels.');
  const padding = 20;
  return {
    minX: Math.max(0, minX - padding),
    minY: Math.max(0, minY - padding),
    maxX: Math.min(image.width - 1, maxX + padding),
    maxY: Math.min(image.height - 1, maxY + padding),
  };
}

function compositeFrame(atlas, image, frameIndex) {
  const bounds = alphaBounds(image);
  const cropWidth = bounds.maxX - bounds.minX + 1;
  const cropHeight = bounds.maxY - bounds.minY + 1;
  const scale = Math.min((frameWidth - 8) / cropWidth, (frameHeight - 6) / cropHeight);
  const destinationWidth = Math.max(1, Math.round(cropWidth * scale));
  const destinationHeight = Math.max(1, Math.round(cropHeight * scale));
  const startX = frameIndex * frameWidth + Math.floor((frameWidth - destinationWidth) / 2);
  const startY = frameHeight - destinationHeight - 2;
  for (let y = 0; y < destinationHeight; y += 1) {
    for (let x = 0; x < destinationWidth; x += 1) {
      const sourceX = Math.min(bounds.maxX, bounds.minX + Math.floor((x + 0.5) / scale));
      const sourceY = Math.min(bounds.maxY, bounds.minY + Math.floor((y + 0.5) / scale));
      const sourcePixel = (sourceY * image.width + sourceX) * 4;
      const destinationPixel = ((startY + y) * atlasWidth + startX + x) * 4;
      image.pixels.copy(atlas, destinationPixel, sourcePixel, sourcePixel + 4);
    }
  }
}

const crcTable = Array.from({ length: 256 }, (_, entry) => {
  let value = entry;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  typeBuffer.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), data.length + 8);
  return result;
}

function encodeRgbaPng(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) pixels.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const atlas = Buffer.alloc(atlasWidth * atlasHeight * 4);
sourceOrder.forEach((file, index) => compositeFrame(atlas, decodeRgbaPng(path.join(sourceDirectory, file)), index));
const transparentPixels = Array.from({ length: atlas.length / 4 }, (_, index) => atlas[index * 4 + 3]).filter((alpha) => alpha === 0).length;
if (transparentPixels === 0) throw new Error('Atlas build failed: no transparent pixels were produced.');
fs.writeFileSync(outputPath, encodeRgbaPng(atlasWidth, atlasHeight, atlas));
console.log(`Wrote ${path.relative(root, outputPath)} with ${transparentPixels.toLocaleString()} transparent pixels.`);
