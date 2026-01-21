import { useGameStore } from '@/store/gameStore';
import { RegisterScreen } from '@/components/ui/RegisterScreen';
import { GameScene } from './GameScene';
import { GameHUD } from '@/components/ui/GameHUD';

export function GameWorld() {
  const isRegistered = useGameStore((state) => state.isRegistered);

  if (!isRegistered) {
    return <RegisterScreen />;
  }

  return (
    <div className="relative w-full h-screen void-bg overflow-hidden">
      <GameScene />
      <GameHUD />
    </div>
  );
}
