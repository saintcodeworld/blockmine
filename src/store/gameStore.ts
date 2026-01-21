import { create } from 'zustand';
import { Keypair } from '@solana/web3.js';

export interface Cube {
  id: string;
  position: [number, number, number];
  type: 'stone' | 'gold' | 'diamond' | 'emerald' | 'ruby';
  health: number;
  maxHealth: number;
}

export interface Player {
  id: string;
  username: string;
  publicKey: string;
  privateKey: string;
  tokens: number;
  totalMined: number;
  position: [number, number, number];
  rotation: number;
}

interface GameState {
  player: Player | null;
  cubes: Cube[];
  isRegistered: boolean;
  isMining: boolean;
  lastMineTime: number;
  miningCooldown: number;
  selectedCubeId: string | null;
  isFirstPerson: boolean;
  
  // Actions
  register: (username: string) => void;
  mineCube: (cubeId: string) => void;
  spawnCubes: () => void;
  setSelectedCube: (cubeId: string | null) => void;
  withdrawTokens: () => void;
  updatePlayerPosition: (position: [number, number, number], rotation: number) => void;
  setFirstPerson: (value: boolean) => void;
}

const generateCubeType = (): Cube['type'] => {
  const rand = Math.random();
  if (rand < 0.5) return 'stone';
  if (rand < 0.75) return 'gold';
  if (rand < 0.9) return 'diamond';
  if (rand < 0.97) return 'emerald';
  return 'ruby';
};

const getTokenReward = (type: Cube['type']): number => {
  switch (type) {
    case 'stone': return 1;
    case 'gold': return 5;
    case 'diamond': return 15;
    case 'emerald': return 25;
    case 'ruby': return 50;
  }
};

const getCubeHealth = (type: Cube['type']): number => {
  switch (type) {
    case 'stone': return 1;
    case 'gold': return 2;
    case 'diamond': return 3;
    case 'emerald': return 4;
    case 'ruby': return 5;
  }
};

// Generate a larger Minecraft-style world
const generateCubes = (): Cube[] => {
  const cubes: Cube[] = [];
  
  // Create a ground layer and scattered blocks
  for (let x = -20; x <= 20; x += 2) {
    for (let z = -20; z <= 20; z += 2) {
      // Ground layer
      if (Math.random() > 0.3) {
        const type = generateCubeType();
        const health = getCubeHealth(type);
        cubes.push({
          id: `cube-${x}-0-${z}-${Date.now()}-${Math.random()}`,
          position: [x, -1, z],
          type,
          health,
          maxHealth: health,
        });
      }
      
      // Scattered elevated blocks
      if (Math.random() > 0.85) {
        const height = Math.floor(Math.random() * 3) + 1;
        for (let y = 0; y < height; y++) {
          const type = generateCubeType();
          const health = getCubeHealth(type);
          cubes.push({
            id: `cube-${x}-${y}-${z}-${Date.now()}-${Math.random()}`,
            position: [x, y, z],
            type,
            health,
            maxHealth: health,
          });
        }
      }
    }
  }
  
  // Add some floating islands
  for (let i = 0; i < 15; i++) {
    const centerX = (Math.random() - 0.5) * 40;
    const centerY = Math.random() * 8 + 4;
    const centerZ = (Math.random() - 0.5) * 40;
    const size = Math.floor(Math.random() * 3) + 2;
    
    for (let dx = -size; dx <= size; dx += 2) {
      for (let dz = -size; dz <= size; dz += 2) {
        if (dx * dx + dz * dz <= size * size * 2) {
          const type = generateCubeType();
          const health = getCubeHealth(type);
          cubes.push({
            id: `float-${centerX}-${centerY}-${centerZ}-${dx}-${dz}-${Math.random()}`,
            position: [centerX + dx, centerY, centerZ + dz],
            type,
            health,
            maxHealth: health,
          });
        }
      }
    }
  }
  
  return cubes;
};

export const useGameStore = create<GameState>((set, get) => ({
  player: null,
  cubes: [],
  isRegistered: false,
  isMining: false,
  lastMineTime: 0,
  miningCooldown: 3000,
  selectedCubeId: null,
  isFirstPerson: true,

  register: (username: string) => {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    // Convert Uint8Array to hex string without Buffer (browser-compatible)
    const privateKey = Array.from(keypair.secretKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const player: Player = {
      id: `player-${Date.now()}`,
      username,
      publicKey,
      privateKey,
      tokens: 0,
      totalMined: 0,
      position: [0, 1.5, 5],
      rotation: 0,
    };

    set({ 
      player, 
      isRegistered: true,
      cubes: generateCubes(),
    });
  },

  mineCube: (cubeId: string) => {
    const state = get();
    const now = Date.now();
    
    if (now - state.lastMineTime < state.miningCooldown) {
      return;
    }

    const cubeIndex = state.cubes.findIndex(c => c.id === cubeId);
    if (cubeIndex === -1) return;

    const cube = state.cubes[cubeIndex];
    const newHealth = cube.health - 1;

    set({ isMining: true, lastMineTime: now });

    setTimeout(() => {
      set({ isMining: false });
    }, 300);

    if (newHealth <= 0) {
      const reward = getTokenReward(cube.type);
      const newCubes = state.cubes.filter(c => c.id !== cubeId);
      
      // Spawn new cube in a random location
      const type = generateCubeType();
      const health = getCubeHealth(type);
      const newCube: Cube = {
        id: `cube-${Date.now()}-${Math.random()}`,
        position: [
          (Math.random() - 0.5) * 30,
          Math.random() * 6,
          (Math.random() - 0.5) * 30,
        ],
        type,
        health,
        maxHealth: health,
      };

      set({
        cubes: [...newCubes, newCube],
        player: state.player ? {
          ...state.player,
          tokens: state.player.tokens + reward,
          totalMined: state.player.totalMined + 1,
        } : null,
        selectedCubeId: null,
      });
    } else {
      const newCubes = [...state.cubes];
      newCubes[cubeIndex] = { ...cube, health: newHealth };
      set({ cubes: newCubes });
    }
  },

  spawnCubes: () => {
    set({ cubes: generateCubes() });
  },

  setSelectedCube: (cubeId: string | null) => {
    set({ selectedCubeId: cubeId });
  },

  withdrawTokens: () => {
    const state = get();
    if (!state.player) return;
    
    console.log(`Withdrawing ${state.player.tokens} tokens to ${state.player.publicKey}`);
    
    set({
      player: {
        ...state.player,
        tokens: 0,
      },
    });
  },

  updatePlayerPosition: (position: [number, number, number], rotation: number) => {
    const state = get();
    if (!state.player) return;
    
    set({
      player: {
        ...state.player,
        position,
        rotation,
      },
    });
  },

  setFirstPerson: (value: boolean) => {
    set({ isFirstPerson: value });
  },
}));
