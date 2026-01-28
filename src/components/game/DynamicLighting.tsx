import { useDayNightCycle } from '@/hooks/useDayNightCycle';

export function DynamicLighting() {
  const timeOfDay = useDayNightCycle();

  // Sky and ground colors for hemisphere light
  const skyLightColor = timeOfDay.phase === 'night' 
    ? '#1a2744' 
    : timeOfDay.phase === 'dusk' 
      ? '#ff7f50' 
      : timeOfDay.phase === 'dawn' 
        ? '#ffb3a7' 
        : '#87CEEB';

  const groundLightColor = timeOfDay.phase === 'night' 
    ? '#1a4d30' 
    : '#4ade80';

  return (
    <>
      {/* Main ambient light - adjusts with time */}
      <ambientLight 
        intensity={timeOfDay.ambientIntensity} 
        color={timeOfDay.ambientColor} 
      />
      
      {/* Sun/moon directional light */}
      <directionalLight 
        position={timeOfDay.sunPosition} 
        intensity={timeOfDay.sunIntensity} 
        castShadow 
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={400}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0001}
        color={timeOfDay.sunColor}
      />
      
      {/* Soft fill light - dimmer at night */}
      <directionalLight 
        position={[-60, 50, -60]} 
        intensity={timeOfDay.phase === 'night' ? 0.1 : 0.5} 
        color={timeOfDay.phase === 'night' ? '#4a6fa5' : '#e0f0ff'}
      />
      
      {/* Hemisphere light for natural sky/ground bounce */}
      <hemisphereLight 
        args={[skyLightColor, groundLightColor, timeOfDay.phase === 'night' ? 0.3 : 0.7]} 
      />
      
      {/* Subtle rim/fill light */}
      <pointLight 
        position={[0, 50, 0]} 
        intensity={timeOfDay.phase === 'night' ? 0.1 : 0.3} 
        color={timeOfDay.phase === 'night' ? '#4a6fa5' : '#fff5e6'} 
      />

      {/* Moonlight at night */}
      {timeOfDay.phase === 'night' && (
        <directionalLight
          position={[-80, 100, -50]}
          intensity={0.4}
          color="#b0c4de"
        />
      )}
    </>
  );
}
