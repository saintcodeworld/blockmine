import { useState, useEffect, useMemo } from 'react';

export interface TimeOfDay {
  hour: number;
  minute: number;
  normalizedTime: number; // 0-1 representing full day cycle
  phase: 'dawn' | 'day' | 'dusk' | 'night';
  sunPosition: [number, number, number];
  sunIntensity: number;
  ambientIntensity: number;
  skyColor: string;
  fogColor: string;
  sunColor: string;
  ambientColor: string;
  starsOpacity: number;
}

// Time phases (in hours)
const DAWN_START = 5;
const DAWN_END = 7;
const DAY_END = 18;
const DUSK_END = 20;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(lerp(c1.r, c2.r, t));
  const g = Math.round(lerp(c1.g, c2.g, t));
  const b = Math.round(lerp(c1.b, c2.b, t));
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : { r: 135, g: 206, b: 235 };
}

function calculateSunPosition(hour: number): [number, number, number] {
  // Sun arc from east (6am) to west (6pm)
  // At midnight, sun is below horizon
  const dayProgress = ((hour - 6) / 12) * Math.PI; // 0 at 6am, PI at 6pm
  const radius = 100;

  // Clamp sun height based on time
  let height: number;
  if (hour >= 6 && hour <= 18) {
    height = Math.sin(dayProgress) * 150;
  } else if (hour > 18 || hour < 6) {
    // Sun below horizon at night
    height = -50;
  } else {
    height = 0;
  }

  const x = Math.cos(dayProgress) * radius;
  const z = 50;

  return [x, Math.max(-50, height), z];
}

function getPhase(hour: number): 'dawn' | 'day' | 'dusk' | 'night' {
  if (hour >= DAWN_START && hour < DAWN_END) return 'dawn';
  if (hour >= DAWN_END && hour < DAY_END) return 'day';
  if (hour >= DAY_END && hour < DUSK_END) return 'dusk';
  return 'night';
}

export function useDayNightCycle(): TimeOfDay {
  const [currentTime] = useState(() => {
    const date = new Date();
    date.setHours(12, 0, 0, 0); // Always set to noon
    return date;
  });

  // Time update effect removed to keep it always day


  const timeOfDay = useMemo((): TimeOfDay => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const decimalHour = hour + minute / 60;
    const normalizedTime = decimalHour / 24;
    const phase = getPhase(decimalHour);
    const sunPosition = calculateSunPosition(decimalHour);

    // Color palettes for different times
    const colors = {
      night: {
        sky: '#0a1628',
        fog: '#0f1f3d',
        sun: '#4a6fa5',
        ambient: '#1a2744',
      },
      dawn: {
        sky: '#ff7e5f',
        fog: '#feb47b',
        sun: '#ffd89b',
        ambient: '#ff9a76',
      },
      day: {
        sky: '#87CEEB',
        fog: '#87CEEB',
        sun: '#fff8dc',
        ambient: '#fffaf0',
      },
      dusk: {
        sky: '#ff6b6b',
        fog: '#c94b4b',
        sun: '#ff8c42',
        ambient: '#ff7f50',
      },
    };

    let skyColor: string;
    let fogColor: string;
    let sunColor: string;
    let ambientColor: string;
    let sunIntensity: number;
    let ambientIntensity: number;
    let starsOpacity: number;

    switch (phase) {
      case 'dawn': {
        const t = (decimalHour - DAWN_START) / (DAWN_END - DAWN_START);
        skyColor = lerpColor(colors.night.sky, colors.dawn.sky, t);
        fogColor = lerpColor(colors.night.fog, colors.dawn.fog, t);
        sunColor = lerpColor(colors.night.sun, colors.dawn.sun, t);
        ambientColor = lerpColor(colors.night.ambient, colors.dawn.ambient, t);
        sunIntensity = lerp(0.1, 1.5, t);
        ambientIntensity = lerp(0.15, 0.5, t);
        starsOpacity = lerp(0.8, 0, t);

        // Transition dawn to day colors at end
        if (t > 0.7) {
          const t2 = (t - 0.7) / 0.3;
          skyColor = lerpColor(skyColor, colors.day.sky, t2);
          fogColor = lerpColor(fogColor, colors.day.fog, t2);
        }
        break;
      }
      case 'day': {
        skyColor = colors.day.sky;
        fogColor = colors.day.fog;
        sunColor = colors.day.sun;
        ambientColor = colors.day.ambient;
        sunIntensity = 2.5;
        ambientIntensity = 0.6;
        starsOpacity = 0;
        break;
      }
      case 'dusk': {
        const t = (decimalHour - DAY_END) / (DUSK_END - DAY_END);
        skyColor = lerpColor(colors.day.sky, colors.dusk.sky, t * 0.6);
        if (t > 0.5) {
          skyColor = lerpColor(colors.dusk.sky, colors.night.sky, (t - 0.5) * 2);
        }
        fogColor = lerpColor(colors.day.fog, colors.dusk.fog, t);
        if (t > 0.6) {
          fogColor = lerpColor(colors.dusk.fog, colors.night.fog, (t - 0.6) / 0.4);
        }
        sunColor = lerpColor(colors.day.sun, colors.dusk.sun, t);
        ambientColor = lerpColor(colors.day.ambient, colors.dusk.ambient, t);
        sunIntensity = lerp(2.5, 0.3, t);
        ambientIntensity = lerp(0.6, 0.2, t);
        starsOpacity = lerp(0, 0.8, t);
        break;
      }
      case 'night':
      default: {
        skyColor = colors.night.sky;
        fogColor = colors.night.fog;
        sunColor = colors.night.sun;
        ambientColor = colors.night.ambient;
        sunIntensity = 0.1;
        ambientIntensity = 0.15;
        starsOpacity = 1;
        break;
      }
    }

    return {
      hour,
      minute,
      normalizedTime,
      phase,
      sunPosition,
      sunIntensity,
      ambientIntensity,
      skyColor,
      fogColor,
      sunColor,
      ambientColor,
      starsOpacity,
    };
  }, [currentTime]);

  return timeOfDay;
}
