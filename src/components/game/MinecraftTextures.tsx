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

// Hook to get all textures
export function useMinecraftTextures() {
  const textures = useMemo(() => ({
    stone: createStoneTexture(),
  }), []);

  return textures;
}

export type CubeType = 'stone';
