import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { MessageCircle, Send, X } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { ScrollArea } from './scroll-area';

interface GameChatProps {
  isPointerLocked: boolean;
  onChatFocus: () => void;
  onChatBlur: () => void;
}

export function GameChat({ isPointerLocked, onChatFocus, onChatBlur }: GameChatProps) {
  const { messages, sendMessage, isConnected } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Open chat with T key
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        if (!isOpen && isPointerLocked) {
          e.preventDefault();
          setIsOpen(true);
          onChatFocus();
          // Exit pointer lock when opening chat
          document.exitPointerLock();
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        onChatBlur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPointerLocked, onChatFocus, onChatBlur]);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onChatBlur();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="absolute bottom-4 left-4 z-40 pointer-events-auto font-sans">
      {/* Collapsed chat button */}
      {!isOpen && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(true);
            onChatFocus();
            document.exitPointerLock();
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="mc-panel bg-[#C6C6C6] text-black hover:bg-[#D6D6D6] flex items-center gap-2 h-auto py-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-bold">Chat (T)</span>
          {messages.length > 0 && (
            <span className="bg-[#555555] text-white text-xs px-1.5 rounded-full">
              {messages.length}
            </span>
          )}
        </Button>
      )}

      {/* Expanded chat panel */}
      {isOpen && (
        <div className="mc-panel w-80 flex flex-col overflow-hidden animate-fade-in bg-[#C6C6C6]">
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-2 border-b-2 border-[#8B8B8B] bg-[#A0A0A0] text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-white" />
              <span className="text-sm font-bold">World Chat</span>
              {isConnected ? (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              ) : (
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 hover:bg-white/20 text-white"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="h-48 p-2 bg-[#000000]/20">
            <div ref={scrollRef} className="space-y-1">
              {messages.length === 0 ? (
                <p className="text-xs text-[#555555] text-center py-4 font-bold">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} formatTime={formatTime} />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex items-center gap-2 p-2 border-t-2 border-[#8B8B8B] bg-[#C6C6C6]">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 h-8 text-sm bg-white border-2 border-[#555555] text-black rounded-none focus:ring-0"
              maxLength={200}
            />
            <Button
              size="icon"
              className="w-8 h-8 rounded-none bg-[#555555] hover:bg-[#373737] text-white"
              onClick={handleSend}
              disabled={!inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, formatTime }: { message: ChatMessage; formatTime: (t: number) => string }) {
  return (
    <div className="text-xs group">
      <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        {formatTime(message.timestamp)}{' '}
      </span>
      <span style={{ color: message.color }} className="font-semibold">
        {message.username}:
      </span>{' '}
      <span className="text-foreground">{message.message}</span>
    </div>
  );
}
