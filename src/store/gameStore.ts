import { create } from 'zustand';
import { Keypair } from '@solana/web3.js';

export interface Cube {
  id: string;
  position: [number, number, number];
  type: 'stone';
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

  // World Boundaries
  worldBounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };

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
  renderDistance: 'low' | 'medium' | 'high';
  setRenderDistance: (distance: 'low' | 'medium' | 'high') => void;
  cubesMap: Map<string, Cube>;
  getCubeAt: (x: number, y: number, z: number) => Cube | undefined;
}

// Generate initial cube world
const generateCubes = (): Cube[] => {
  const cubes: Cube[] = [];
  let cubeIndex = 0;

  // Player spawn area to keep clear (around 0, 2, 8)
  const isNearSpawn = (x: number, z: number) => {
    return Math.abs(x) <= 3 && Math.abs(z - 8) <= 3;
  };

  // 1. Ground Layer (Removed to prevent half-buried cubes)
  // Only the building cubes will remain

  // 2. The Big Building (Centered at 0,0, -16 to align with 2-unit grid for collision)
  const buildX = 0;
  const buildZ = -16; // Changed from -15 to -16 to match even-numbered collision grid
  const width = 20; // blocks wide
  const height = 15; // blocks high
  const depth = 20; // blocks deep
  const spacing = 2; // size of blocks

  // Generate a solid big block of cubes
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let z = 0; z < depth; z++) {
        // Calculate world position
        const worldX = buildX + (x - width / 2) * spacing;
        const worldY = (y + 1) * spacing; // Start above ground
        const worldZ = buildZ + (z - depth / 2) * spacing;

        // Determine type based on depth/rarity
        // Outer shell: Stone
        // Inner: increasing value (simplified to stone for now)

        let type: Cube['type'] = 'stone';

        cubes.push({
          id: `building-${cubeIndex++}`,
          position: [worldX, worldY, worldZ],
          type,
          health: 1,
          maxHealth: 1,
        });
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
  },

  worldBounds: {
    minX: -40,
    maxX: 40,
    minZ: -50,
    maxZ: 30, // Increased slightly to allow room behind the building
  },

  register: (username: string) => {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    // Convert Uint8Array to hex string (browser-compatible)
    const privateKey = Array.from(keypair.secretKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Spawn at random position far from the block buildings
    // Building center is approx (0, 0, -15), radius ~20
    // We'll spawn in a large ring around the center to ensure they are far away
    const angle = Math.random() * Math.PI * 2;
    const minDistance = 50;
    const maxDistance = 80;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);

    const spawnX = Math.cos(angle) * distance;
    const spawnZ = Math.sin(angle) * distance;

    const player: Player = {
      id: `player-${Date.now()}`,
      username,
      publicKey,
      privateKey,
      tokens: 0,
      totalMined: 0,
      position: [spawnX, 10, spawnZ], // Random spawn point
      rotation: angle + Math.PI, // Face towards center (approx)
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

      // Update map
      const newMap = new Map(state.cubesMap);
      newMap.delete(cube.position.join(','));

      set({
        cubes: newCubes,
        destroyedCubes: [...state.destroyedCubes, destroyedCube],
        cubesMap: newMap,
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

      const newCubes = [...state.cubes, ...respawnedCubes];

      // Update map
      const newMap = new Map(state.cubesMap);
      respawnedCubes.forEach(c => {
        newMap.set(c.position.join(','), c);
      });

      set({
        cubes: newCubes,
        destroyedCubes: stillDestroyed,
        cubesMap: newMap,
      });
    }
  },

  // Graphics Settings
  renderDistance: 'medium',
  setRenderDistance: (distance: 'low' | 'medium' | 'high') => set({ renderDistance: distance }),

  // Spatial lookup optimization
  cubesMap: new Map(),
  getCubeAt: (x: number, y: number, z: number) => {
    const state = get();
    return state.cubesMap.get(`${x},${y},${z}`);
  },
}));

// Initialize the map after creation if needed, or update the initial state
// We need to override the initial state to include the map generated from generateCubes
const initialCubes = generateCubes();
const initialMap = new Map<string, Cube>();
initialCubes.forEach(c => initialMap.set(c.position.join(','), c));

useGameStore.setState({ cubes: initialCubes, cubesMap: initialMap });
