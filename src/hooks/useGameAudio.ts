import { useRef, useCallback, useEffect } from 'react';

// Singleton audio context to avoid creating multiple
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Resume audio context on user interaction (required by browsers)
function ensureAudioContext(): AudioContext {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

export function useGameAudio() {
  const lastFootstepTime = useRef(0);
  const lastMiningHitTime = useRef(0);
  const miningLoopNode = useRef<OscillatorNode | null>(null);
  const miningGainNode = useRef<GainNode | null>(null);

  // Footstep sound - earthy crunch
  const playFootstep = useCallback(() => {
    const now = Date.now();
    if (now - lastFootstepTime.current < 300) return; // Limit frequency
    lastFootstepTime.current = now;

    try {
      const ctx = ensureAudioContext();
      const currentTime = ctx.currentTime;

      // Create noise for footstep texture
      const bufferSize = ctx.sampleRate * 0.08;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Brown noise for earthy sound
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Low-pass filter for muffled ground sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800 + Math.random() * 400;

      // Gain envelope
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.15, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.08);

      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseSource.start(currentTime);
      noiseSource.stop(currentTime + 0.1);
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  // Mining hit sound - metallic pickaxe on stone
  const playMiningHit = useCallback(() => {
    const now = Date.now();
    if (now - lastMiningHitTime.current < 180) return;
    lastMiningHitTime.current = now;

    try {
      const ctx = ensureAudioContext();
      const currentTime = ctx.currentTime;

      // Metallic ping
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, currentTime + 0.1);

      // Stone crunch noise
      const bufferSize = ctx.sampleRate * 0.1;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Bandpass for stone texture
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1500 + Math.random() * 500;
      filter.Q.value = 2;

      // Mix gains
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.08, currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.start(currentTime);
      osc.stop(currentTime + 0.15);
      noiseSource.start(currentTime);
      noiseSource.stop(currentTime + 0.12);
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  // Block break sound - satisfying crumble
  const playBlockBreak = useCallback((blockType: string) => {
    try {
      const ctx = ensureAudioContext();
      const currentTime = ctx.currentTime;

      // Crumble noise burst
      const bufferSize = ctx.sampleRate * 0.25;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        // Layered decay for crumble effect
        output[i] = (Math.random() * 2 - 1) *
          (Math.exp(-t * 4) + 0.3 * Math.exp(-t * 8) * Math.sin(t * 50));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Filter sweep
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, currentTime);
      filter.frequency.exponentialRampToValueAtTime(500, currentTime + 0.2);

      // Gain
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.25, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.25);

      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseSource.start(currentTime);
      noiseSource.stop(currentTime + 0.3);
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  // Token collect sound
  const playTokenCollect = useCallback(() => {
    try {
      const ctx = ensureAudioContext();
      const currentTime = ctx.currentTime;

      // Ascending arpeggio
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        const noteStart = currentTime + i * 0.05;
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.08, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.2);
      });
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (miningLoopNode.current) {
        try { miningLoopNode.current.stop(); } catch (e) { }
      }
    };
  }, []);

  return {
    playFootstep,
    playMiningHit,
    playBlockBreak,
    playTokenCollect,
  };
}
