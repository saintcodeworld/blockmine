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
}

interface GameState {
  player: Player | null;
  cubes: Cube[];
  isRegistered: boolean;
  isMining: boolean;
  lastMineTime: number;
  miningCooldown: number;
  selectedCubeId: string | null;
  
  // Actions
  register: (username: string) => void;
  mineCube: (cubeId: string) => void;
  spawnCubes: () => void;
  setSelectedCube: (cubeId: string | null) => void;
  withdrawTokens: () => void;
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

const generateCubes = (): Cube[] => {
  const cubes: Cube[] = [];
  const gridSize = 5;
  const spacing = 3;
  
  for (let x = -gridSize; x <= gridSize; x += 2) {
    for (let y = -2; y <= 2; y += 2) {
      for (let z = -gridSize; z <= gridSize; z += 2) {
        if (Math.random() > 0.4) {
          const type = generateCubeType();
          const health = getCubeHealth(type);
          cubes.push({
            id: `cube-${x}-${y}-${z}-${Date.now()}-${Math.random()}`,
            position: [x * spacing / 2, y * spacing / 2, z * spacing / 2 - 10],
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

  register: (username: string) => {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const privateKey = Buffer.from(keypair.secretKey).toString('hex');

    const player: Player = {
      id: `player-${Date.now()}`,
      username,
      publicKey,
      privateKey,
      tokens: 0,
      totalMined: 0,
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
      // Cube destroyed - award tokens
      const reward = getTokenReward(cube.type);
      const newCubes = state.cubes.filter(c => c.id !== cubeId);
      
      // Spawn new cube
      const type = generateCubeType();
      const health = getCubeHealth(type);
      const newCube: Cube = {
        id: `cube-${Date.now()}-${Math.random()}`,
        position: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 6,
          -10 - Math.random() * 5,
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
      // Damage cube
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
    
    // In a real implementation, this would call a backend API
    // to transfer tokens from treasury to user's wallet
    console.log(`Withdrawing ${state.player.tokens} tokens to ${state.player.publicKey}`);
    
    set({
      player: {
        ...state.player,
        tokens: 0,
      },
    });
  },
}));
