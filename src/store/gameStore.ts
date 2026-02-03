import { create } from 'zustand';
import { Keypair } from '@solana/web3.js';

export interface Cube {
  id: string;
  position: [number, number, number];
  type: 'stone' | 'gold' | 'diamond' | 'emerald' | 'ruby';
  health: number;
  maxHealth: number;
  respawnAt?: number; // Timestamp when block should respawn
  isBeingMined?: boolean;
  miningProgress?: number;
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
  destroyedCubes: Cube[]; // Track destroyed cubes for respawning
  isRegistered: boolean;
  isMining: boolean;
  miningCubeId: string | null;
  miningStartTime: number;
  selectedCubeId: string | null;
  
  // Constants
  MINING_TIME: number; // 2 seconds to break
  RESPAWN_TIME: number; // 1 minute to respawn
  TOKENS_BY_TYPE: Record<Cube['type'], number>; // Tokens per block type
  
  // Actions
  register: (username: string) => void;
  updatePlayerFromDb: (player: Player) => void;
  startMining: (cubeId: string) => void;
  stopMining: () => void;
  updateMining: () => void;
  setSelectedCube: (cubeId: string | null) => void;
  withdrawTokens: () => void;
  updatePlayerPosition: (position: [number, number, number], rotation: number) => void;
  checkRespawns: () => void;
}

// Generate initial cube world
const generateCubes = (): Cube[] => {
  const cubes: Cube[] = [];
  let cubeIndex = 0;
  
  // Player spawn area to keep clear (around 0, 2, 8)
  const isNearSpawn = (x: number, z: number) => {
    return Math.abs(x) <= 3 && Math.abs(z - 8) <= 3;
  };
  
  // Create a flat ground layer with cubes
  for (let x = -15; x <= 15; x += 3) {
    for (let z = -15; z <= 15; z += 3) {
      // Skip spawn area
      if (isNearSpawn(x, z)) continue;
      
      // Ground level cubes
      if (Math.random() > 0.2) {
        cubes.push({
          id: `cube-${cubeIndex++}`,
          position: [x, 0, z],
          type: 'stone',
          health: 1,
          maxHealth: 1,
        });
      }
      
      // Some elevated cubes
      if (Math.random() > 0.7) {
        const height = Math.floor(Math.random() * 3) + 1;
        for (let y = 1; y <= height; y++) {
          const types: Cube['type'][] = ['stone', 'gold', 'diamond', 'emerald', 'ruby'];
          const weights = [50, 25, 15, 7, 3];
          let rand = Math.random() * 100;
          let type: Cube['type'] = 'stone';
          for (let i = 0; i < weights.length; i++) {
            rand -= weights[i];
            if (rand <= 0) {
              type = types[i];
              break;
            }
          }
          
          cubes.push({
            id: `cube-${cubeIndex++}`,
            position: [x, y * 2, z],
            type,
            health: 1,
            maxHealth: 1,
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
  destroyedCubes: [],
  isRegistered: false,
  isMining: false,
  miningCubeId: null,
  miningStartTime: 0,
  selectedCubeId: null,
  
  // Constants as per requirements
  MINING_TIME: 2000, // 2 seconds
  RESPAWN_TIME: 60000, // 1 minute
  TOKENS_BY_TYPE: {
    stone: 1000,
    gold: 3500,
    diamond: 7500,
    emerald: 12000,
    ruby: 20000,
  },

  register: (username: string) => {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    // Convert Uint8Array to hex string (browser-compatible)
    const privateKey = Array.from(keypair.secretKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Generate random spawn position to avoid collision with other players
    // Spawn in a ring around the center, avoiding the very center
    const angle = Math.random() * Math.PI * 2;
    const distance = 3 + Math.random() * 4; // 3-7 units from center
    const spawnX = Math.cos(angle) * distance;
    const spawnZ = 8 + Math.sin(angle) * distance; // Offset from base spawn

    const player: Player = {
      id: `player-${Date.now()}`,
      username,
      publicKey,
      privateKey,
      tokens: 0,
      totalMined: 0,
      position: [spawnX, 2, spawnZ],
      rotation: 0,
    };

    set({ 
      player, 
      isRegistered: true,
      cubes: generateCubes(),
    });
  },

  updatePlayerFromDb: (player: Player) => {
    const state = get();
    set({ 
      player,
      isRegistered: true,
      cubes: state.cubes.length > 0 ? state.cubes : generateCubes(),
    });
  },

  startMining: (cubeId: string) => {
    const state = get();
    if (state.isMining) return;
    
    const cube = state.cubes.find(c => c.id === cubeId);
    if (!cube) return;

    set({ 
      isMining: true, 
      miningCubeId: cubeId,
      miningStartTime: Date.now(),
      selectedCubeId: cubeId,
    });
  },

  stopMining: () => {
    set({ 
      isMining: false, 
      miningCubeId: null,
      miningStartTime: 0,
    });
  },

  updateMining: () => {
    const state = get();
    if (!state.isMining || !state.miningCubeId || !state.player) return;

    const elapsed = Date.now() - state.miningStartTime;
    
    // Check if mining is complete (2 seconds)
    if (elapsed >= state.MINING_TIME) {
      const cubeIndex = state.cubes.findIndex(c => c.id === state.miningCubeId);
      if (cubeIndex === -1) {
        set({ isMining: false, miningCubeId: null, miningStartTime: 0 });
        return;
      }

      const cube = state.cubes[cubeIndex];
      const newCubes = state.cubes.filter(c => c.id !== state.miningCubeId);
      
      // Add to destroyed cubes for respawning
      const destroyedCube = {
        ...cube,
        respawnAt: Date.now() + state.RESPAWN_TIME,
      };

      const tokensEarned = state.TOKENS_BY_TYPE[cube.type] || 1000;

      set({
        cubes: newCubes,
        destroyedCubes: [...state.destroyedCubes, destroyedCube],
        player: {
          ...state.player,
          tokens: state.player.tokens + tokensEarned,
          totalMined: state.player.totalMined + 1,
        },
        isMining: false,
        miningCubeId: null,
        miningStartTime: 0,
        selectedCubeId: null,
      });
    }
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

  checkRespawns: () => {
    const state = get();
    const now = Date.now();
    
    const toRespawn = state.destroyedCubes.filter(c => c.respawnAt && c.respawnAt <= now);
    const stillDestroyed = state.destroyedCubes.filter(c => c.respawnAt && c.respawnAt > now);
    
    if (toRespawn.length > 0) {
      const respawnedCubes = toRespawn.map(c => ({
        ...c,
        respawnAt: undefined,
        health: c.maxHealth,
      }));
      
      set({
        cubes: [...state.cubes, ...respawnedCubes],
        destroyedCubes: stillDestroyed,
      });
    }
  },
}));
