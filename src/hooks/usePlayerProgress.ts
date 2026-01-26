import { useEffect, useCallback, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { Keypair } from '@solana/web3.js';

interface PlayerProgressRow {
  id: string;
  user_id: string;
  username: string | null;
  tokens: number;
  total_mined: number;
  public_key: string | null;
  created_at: string;
  updated_at: string;
}

// Client-side only key storage - NEVER send to server
const PRIVATE_KEY_STORAGE_PREFIX = 'solana_pk_';

function getStoredPrivateKey(userId: string): string | null {
  try {
    return localStorage.getItem(`${PRIVATE_KEY_STORAGE_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

function storePrivateKey(userId: string, privateKey: string): void {
  try {
    localStorage.setItem(`${PRIVATE_KEY_STORAGE_PREFIX}${userId}`, privateKey);
  } catch {
    console.warn('Could not store private key in localStorage');
  }
}

export function usePlayerProgress(userId: string | undefined, username: string) {
  const { player, isRegistered, register } = useGameStore();
  const updatePlayerFromDb = useGameStore((state) => state.updatePlayerFromDb);
  const hasInitialized = useRef(false);

  // Load player progress from database on mount
  useEffect(() => {
    if (!userId || hasInitialized.current) return;
    
    const loadProgress = async () => {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('player_progress' as never)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle() as { data: PlayerProgressRow | null; error: Error | null };

      if (error) {
        console.error('Error loading player progress:', error);
        // Still register if db fails
        if (!isRegistered) {
          register(username);
        }
        return;
      }

      if (data) {
        // Existing player - restore progress
        hasInitialized.current = true;
        
        // Get private key from local storage (client-side only)
        let privateKey = getStoredPrivateKey(userId);
        
        // If no stored private key but we have public key, user must regenerate
        // This is expected behavior for security
        if (!privateKey && data.public_key) {
          console.log('Private key not found in local storage - wallet access requires re-import');
          privateKey = '';
        }
        
        updatePlayerFromDb({
          id: `player-${userId}`,
          username,
          publicKey: data.public_key || '',
          privateKey: privateKey || '',
          tokens: Number(data.tokens) || 0,
          totalMined: data.total_mined || 0,
          position: [0, 2, 8],
          rotation: 0,
        });
      } else {
        // New player - create with fresh keys
        hasInitialized.current = true;
        const keypair = Keypair.generate();
        const publicKey = keypair.publicKey.toBase58();
        const privateKey = Array.from(keypair.secretKey)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Store private key client-side ONLY
        storePrivateKey(userId, privateKey);

        // Insert into database (public key only - NEVER private key)
        const { error: insertError } = await supabase
          .from('player_progress' as never)
          .insert({
            user_id: userId,
            username: username,
            tokens: 0,
            total_mined: 0,
            public_key: publicKey,
          } as never);

        if (insertError) {
          console.error('Error creating player progress:', insertError);
        }

        updatePlayerFromDb({
          id: `player-${userId}`,
          username,
          publicKey,
          privateKey,
          tokens: 0,
          totalMined: 0,
          position: [0, 2, 8],
          rotation: 0,
        });
      }
    };

    loadProgress();
  }, [userId, username, isRegistered, register, updatePlayerFromDb]);

  // Save progress to database when tokens or totalMined change
  const saveProgress = useCallback(async () => {
    if (!userId || !player) return;

    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('player_progress' as never)
      .update({
        tokens: player.tokens,
        total_mined: player.totalMined,
      } as never)
      .eq('user_id', userId);

    if (error) {
      console.error('Error saving player progress:', error);
    }
  }, [userId, player]);

  // Debounced save - save after mining completes
  const lastTokens = useRef(player?.tokens);
  const lastMined = useRef(player?.totalMined);

  useEffect(() => {
    if (!player) return;
    
    // Only save if values actually changed
    if (player.tokens !== lastTokens.current || player.totalMined !== lastMined.current) {
      lastTokens.current = player.tokens;
      lastMined.current = player.totalMined;
      
      // Debounce save
      const timeout = setTimeout(saveProgress, 1000);
      return () => clearTimeout(timeout);
    }
  }, [player?.tokens, player?.totalMined, saveProgress]);

  return { saveProgress };
}
