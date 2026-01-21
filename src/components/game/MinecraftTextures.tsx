import { useMemo } from 'react';
import { CanvasTexture, NearestFilter, RepeatWrapping } from 'three';

// Generate pixelated Minecraft-style textures procedurally
function createPixelTexture(
  baseColor: string,
  noiseColors: string[],
  size: number = 16
): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Fill base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Add noise pixels
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (Math.random() > 0.6) {
        ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}

// Create stone texture (gray with darker spots)
function createStoneTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  // Base gray
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, 16, 16);

  // Add stone pattern
  const spots = [
    { x: 2, y: 3, w: 3, h: 2, c: '#6e6e6e' },
    { x: 8, y: 1, w: 4, h: 3, c: '#5a5a5a' },
    { x: 1, y: 9, w: 5, h: 3, c: '#707070' },
    { x: 10, y: 8, w: 4, h: 4, c: '#5e5e5e' },
    { x: 5, y: 5, w: 3, h: 2, c: '#7a7a7a' },
    { x: 12, y: 4, w: 3, h: 2, c: '#666666' },
    { x: 0, y: 14, w: 4, h: 2, c: '#6a6a6a' },
    { x: 7, y: 12, w: 5, h: 3, c: '#5c5c5c' },
  ];

  spots.forEach(spot => {
    ctx.fillStyle = spot.c;
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
  });

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

// Create gold ore texture
function createGoldOreTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  // Stone base
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, 16, 16);

  // Stone pattern
  const stoneSpots = [
    { x: 2, y: 3, w: 2, h: 2, c: '#6e6e6e' },
    { x: 10, y: 2, w: 3, h: 2, c: '#5a5a5a' },
    { x: 1, y: 11, w: 3, h: 2, c: '#707070' },
    { x: 12, y: 10, w: 2, h: 3, c: '#5e5e5e' },
  ];
  stoneSpots.forEach(spot => {
    ctx.fillStyle = spot.c;
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
  });

  // Gold ore spots
  const goldSpots = [
    { x: 4, y: 4, w: 2, h: 2 },
    { x: 5, y: 5, w: 2, h: 2 },
    { x: 10, y: 6, w: 2, h: 2 },
    { x: 11, y: 7, w: 2, h: 2 },
    { x: 2, y: 9, w: 2, h: 2 },
    { x: 7, y: 11, w: 2, h: 2 },
    { x: 8, y: 12, w: 2, h: 2 },
  ];

  goldSpots.forEach(spot => {
    ctx.fillStyle = '#fceb3d';
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
    ctx.fillStyle = '#c79a1a';
    ctx.fillRect(spot.x + 1, spot.y + 1, 1, 1);
  });

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

// Create diamond ore texture
function createDiamondOreTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  // Stone base
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, 16, 16);

  // Stone pattern
  const stoneSpots = [
    { x: 2, y: 2, w: 3, h: 2, c: '#6e6e6e' },
    { x: 11, y: 1, w: 3, h: 2, c: '#5a5a5a' },
    { x: 0, y: 12, w: 4, h: 2, c: '#707070' },
    { x: 13, y: 11, w: 2, h: 3, c: '#5e5e5e' },
  ];
  stoneSpots.forEach(spot => {
    ctx.fillStyle = spot.c;
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
  });

  // Diamond ore spots
  const diamondSpots = [
    { x: 4, y: 3, w: 2, h: 2 },
    { x: 5, y: 4, w: 2, h: 2 },
    { x: 10, y: 5, w: 2, h: 2 },
    { x: 2, y: 8, w: 2, h: 2 },
    { x: 3, y: 9, w: 2, h: 2 },
    { x: 8, y: 10, w: 2, h: 2 },
    { x: 12, y: 7, w: 2, h: 2 },
  ];

  diamondSpots.forEach(spot => {
    ctx.fillStyle = '#5fd4e8';
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
    ctx.fillStyle = '#1db2cc';
    ctx.fillRect(spot.x + 1, spot.y + 1, 1, 1);
  });

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

// Create emerald ore texture
function createEmeraldOreTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  // Stone base
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, 16, 16);

  // Stone pattern
  const stoneSpots = [
    { x: 1, y: 2, w: 3, h: 2, c: '#6e6e6e' },
    { x: 10, y: 0, w: 4, h: 2, c: '#5a5a5a' },
    { x: 0, y: 13, w: 5, h: 2, c: '#707070' },
    { x: 12, y: 12, w: 3, h: 3, c: '#5e5e5e' },
  ];
  stoneSpots.forEach(spot => {
    ctx.fillStyle = spot.c;
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
  });

  // Emerald ore - more rectangular like real Minecraft
  const emeraldSpots = [
    { x: 5, y: 4, w: 3, h: 4 },
    { x: 10, y: 7, w: 3, h: 4 },
    { x: 2, y: 9, w: 3, h: 4 },
  ];

  emeraldSpots.forEach(spot => {
    ctx.fillStyle = '#17d960';
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
    ctx.fillStyle = '#0ea043';
    ctx.fillRect(spot.x + 1, spot.y + 1, spot.w - 1, spot.h - 1);
    ctx.fillStyle = '#17d960';
    ctx.fillRect(spot.x + 1, spot.y + 1, 1, 1);
  });

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

// Create ruby/redstone ore texture
function createRubyOreTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  // Stone base
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, 16, 16);

  // Stone pattern
  const stoneSpots = [
    { x: 2, y: 1, w: 3, h: 2, c: '#6e6e6e' },
    { x: 9, y: 2, w: 4, h: 2, c: '#5a5a5a' },
    { x: 1, y: 11, w: 4, h: 3, c: '#707070' },
    { x: 11, y: 13, w: 4, h: 2, c: '#5e5e5e' },
  ];
  stoneSpots.forEach(spot => {
    ctx.fillStyle = spot.c;
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
  });

  // Ruby/redstone spots
  const rubySpots = [
    { x: 3, y: 4, w: 2, h: 2 },
    { x: 4, y: 5, w: 2, h: 2 },
    { x: 9, y: 5, w: 2, h: 2 },
    { x: 10, y: 6, w: 2, h: 2 },
    { x: 5, y: 9, w: 2, h: 2 },
    { x: 6, y: 10, w: 2, h: 2 },
    { x: 12, y: 9, w: 2, h: 2 },
    { x: 1, y: 7, w: 2, h: 2 },
  ];

  rubySpots.forEach(spot => {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(spot.x + 1, spot.y + 1, 1, 1);
  });

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

// Hook to get all textures
export function useMinecraftTextures() {
  const textures = useMemo(() => ({
    stone: createStoneTexture(),
    gold: createGoldOreTexture(),
    diamond: createDiamondOreTexture(),
    emerald: createEmeraldOreTexture(),
    ruby: createRubyOreTexture(),
  }), []);

  return textures;
}

export type CubeType = 'stone' | 'gold' | 'diamond' | 'emerald' | 'ruby';
