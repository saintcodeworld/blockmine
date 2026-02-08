import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  color: string;
  timestamp: number;
}

const PLAYER_COLORS = [
  '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1',
];

export function useChat() {
  const player = useGameStore((state) => state.player);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const colorRef = useRef(PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]);

  useEffect(() => {
    if (!player) return;

    let cleanup: (() => void) | undefined;

    const initChat = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
        
        if (!supabase) {
          console.log('Backend not available, chat disabled');
          return;
        }

        const chatChannel = supabase.channel('game-chat', {
          config: {
            broadcast: {
              self: false, // Don't receive own messages (we add them locally)
            },
          },
        });

        channelRef.current = chatChannel;

        chatChannel
          .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
            const msg = payload as ChatMessage;
            setMessages((prev) => {
              const newMessages = [...prev, msg];
              return newMessages.slice(-50);
            });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
            }
          });

        cleanup = () => {
          chatChannel.unsubscribe();
          channelRef.current = null;
          setIsConnected(false);
        };
      } catch (error) {
        console.log('Chat not available:', error);
      }
    };

    initChat();

    return () => {
      if (cleanup) cleanup();
    };
  }, [player?.id]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!channelRef.current || !player || !text.trim()) return;

      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: player.username,
        message: text.trim(),
        color: colorRef.current,
        timestamp: Date.now(),
      };

      // Add locally immediately
      setMessages((prev) => {
        const newMessages = [...prev, message];
        return newMessages.slice(-50);
      });

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'chat-message',
          payload: message,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [player]
  );

  return {
    messages,
    sendMessage,
    isConnected,
  };
}
