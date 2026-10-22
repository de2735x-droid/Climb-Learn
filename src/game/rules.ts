/**
 * Pure logic and math rules for Climb & Learn: The Scholar's Spire
 * Decoupled from rendering for unit testing and deterministic simulation.
 */

import { PlatformConfig, CollectibleItem, BiomeConfig } from './types';

export const PHYSICS = {
  GRAVITY: 0.46,
  WALK_SPEED: 3.6,
  AIR_CONTROL: 0.16,
  FORCE_DECAY: 0.91,
  MAX_SPEED: 18.0,
  MIN_JUMP_CHARGE: 0.12,
  CHARGE_RATE: 0.038,
  MAX_VERTICAL_REACH: 280,
  MAX_HORIZONTAL_REACH: 300,
  COYOTE_FRAMES: 8,
  JUMP_BUFFER_FRAMES: 10,
};

export interface Rect {
  x: number; // center x
  y: number; // center y
  w: number;
  h: number;
}

export function checkAABB(a: Rect, b: Rect): boolean {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2
  );
}

export function calculateJumpImpulse(charge: number, aimDir: number) {
  const clampedCharge = Math.max(0, Math.min(1, charge));
  const power = Math.pow(clampedCharge, 1.05);
  return {
    vx: (power > 0 ? (2.8 + power * 7.4) : 0) * aimDir,
    vy: -(8.0 + power * 15.5),
  };
}

export function calculateBouncyImpulse(currentVy: number, bounceMultiplier: number = 1.35) {
  const baseBounce = 16.5;
  const reflected = Math.abs(currentVy) * bounceMultiplier;
  return -Math.max(baseBounce, Math.min(22, reflected));
}

export function calculateScore(params: {
  maxAltitude: number;
  gemsCollected: number;
  questionsCorrect: number;
  falls: number;
  timeSeconds: number;
  victory: boolean;
}): number {
  const altitudePoints = Math.floor(Math.max(0, params.maxAltitude) * 10);
  const gemPoints = params.gemsCollected * 150;
  const questionPoints = params.questionsCorrect * 400;
  const victoryBonus = params.victory ? 3000 : 0;
  
  // Time bonus (faster gives more if made good progress)
  const timeBonus = params.victory ? Math.max(0, 5000 - Math.floor(params.timeSeconds * 12)) : 0;
  
  // Fall penalty (capped so score never goes below 0)
  const fallPenalty = params.falls * 75;

  return Math.max(0, altitudePoints + gemPoints + questionPoints + victoryBonus + timeBonus - fallPenalty);
}

export function calculateGrade(score: number, victory: boolean, accuracy: number): 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' {
  if (victory && score >= 12000 && accuracy >= 0.85) return 'SSS';
  if (victory && score >= 9000) return 'SS';
  if (score >= 7000 || (victory && accuracy >= 0.7)) return 'S';
  if (score >= 4500) return 'A';
  if (score >= 2500) return 'B';
  return 'C';
}

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getCampaignBiomes(): BiomeConfig[] {
  return [
    {
      id: 'campus',
      name: 'Campus Grounds & Fountain',
      minY: -450,
      maxY: 450,
      skyTop: [18, 30, 68],
      skyBottom: [56, 92, 160],
      platformColor: [78, 56, 38],
      platformTrim: [48, 168, 88],
      ambientParticles: 'petals',
      bgElements: 'mountains',
    },
    {
      id: 'library',
      name: 'Clocktower Archives',
      minY: -1100,
      maxY: -450,
      skyTop: [28, 20, 54],
      skyBottom: [92, 60, 110],
      platformColor: [62, 48, 76],
      platformTrim: [198, 156, 88],
      ambientParticles: 'leaves',
      bgElements: 'library_pillars',
    },
    {
      id: 'observatory',
      name: 'Starseeker Observatory',
      minY: -1850,
      maxY: -1100,
      skyTop: [12, 18, 48],
      skyBottom: [40, 56, 120],
      platformColor: [44, 52, 78],
      platformTrim: [110, 210, 240],
      ambientParticles: 'stars',
      bgElements: 'observatory',
    },
    {
      id: 'summit',
      name: 'Zenith of Scholarly Mastery',
      minY: -2600,
      maxY: -1850,
      skyTop: [8, 10, 26],
      skyBottom: [84, 46, 114],
      platformColor: [60, 48, 82],
      platformTrim: [255, 215, 80],
      ambientParticles: 'aurora',
      bgElements: 'celestial_rings',
    },
  ];
}

/**
 * Procedural Spire Generator:
 * Generates an ascent path with guaranteed reachability between platforms.
 */
export function generateProceduralSpire(seed: number, heightSpan: number = 3000, worldWidth: number = 640): {
  platforms: PlatformConfig[];
  collectibles: CollectibleItem[];
} {
  const rng = createPRNG(seed);
  const platforms: PlatformConfig[] = [];
  const collectibles: CollectibleItem[] = [];

  // Ground base platform
  platforms.push({
    id: 'ground',
    x: worldWidth / 2,
    y: 360,
    w: worldWidth - 60,
    h: 40,
    type: 'normal',
  });

  let currentY = 320;
  let currentX = worldWidth / 2;
  let stepIndex = 0;
  let cpCount = 0;

  while (currentY > -heightSpan) {
    stepIndex++;
    // Altitude-scaled difficulty [0..1]
    const difficulty = Math.min(1, Math.abs(currentY) / heightSpan);

    // Vertical step: gentle 60-80px at bottom, scaling smoothly up to 135px at high altitude
    const isEarlyStep = stepIndex <= 2;
    const stepHeight = isEarlyStep 
      ? (60 + rng() * 20) 
      : (68 + rng() * (45 + difficulty * 25));
    currentY -= stepHeight;

    // Platform width: generous at bottom (150-180px), narrowing gently at top
    const platWidth = Math.max(75, Math.floor(165 - difficulty * 55 + rng() * 25));
    const platHeight = 22;

    // Platform X within comfortable leaping reach
    const maxDx = isEarlyStep ? (50 + rng() * 40) : (70 + rng() * 65);
    const dir = rng() > 0.5 ? 1 : -1;
    let nextX = currentX + dir * maxDx;

    // Keep within world borders with safe margin
    const minX = 65 + platWidth / 2;
    const maxX = worldWidth - 65 - platWidth / 2;
    if (nextX < minX || nextX > maxX) {
      nextX = Math.max(minX, Math.min(maxX, currentX - dir * (60 + rng() * 50)));
    }
    currentX = nextX;

    // Platform type variety based on difficulty
    let type: PlatformConfig['type'] = 'normal';
    const roll = rng();

    // Checkpoint every ~450px
    const isCheckpoint = stepIndex % 5 === 0 && cpCount < 6;

    if (isCheckpoint) {
      type = 'checkpoint';
      cpCount++;
    } else if (difficulty > 0.25 && roll < 0.22) {
      type = 'bouncy'; // mushroom spring
    } else if (difficulty > 0.35 && roll < 0.44) {
      type = 'moving';
    } else if (difficulty > 0.5 && roll < 0.62) {
      type = 'crumbling';
    } else if (difficulty > 0.65 && roll < 0.74) {
      type = 'wind';
    }

    const platConfig: PlatformConfig = {
      id: `p_${stepIndex}`,
      x: currentX,
      y: currentY,
      w: isCheckpoint ? Math.max(100, platWidth) : platWidth,
      h: platHeight,
      type,
    };

    if (type === 'moving') {
      const travel = 80 + rng() * 100;
      platConfig.rangeX = [
        Math.max(50 + platWidth / 2, currentX - travel / 2),
        Math.min(worldWidth - 50 - platWidth / 2, currentX + travel / 2),
      ];
      platConfig.vx = (rng() > 0.5 ? 1 : -1) * (1.2 + difficulty * 0.8);
    } else if (type === 'bouncy') {
      platConfig.bouncyStrength = 1.35;
    } else if (type === 'crumbling') {
      platConfig.crumbleTimer = 0;
      platConfig.crumbled = false;
    }

    if (isCheckpoint) {
      platConfig.checkpointIndex = cpCount - 1;
    }

    platforms.push(platConfig);

    // Place Knowledge Gems or Items
    if (rng() < 0.65) {
      const gemY = currentY - 26 - rng() * 20;
      collectibles.push({
        id: `gem_${stepIndex}`,
        x: currentX + (rng() - 0.5) * (platWidth * 0.6),
        y: gemY,
        type: 'gem',
        collected: false,
        value: 150,
      });
    }

    // Occasional safety feather parachute
    if (difficulty > 0.4 && rng() < 0.12) {
      collectibles.push({
        id: `feather_${stepIndex}`,
        x: currentX,
        y: currentY - 32,
        type: 'feather',
        collected: false,
      });
    }
  }

  // Summit Victory Platform
  platforms.push({
    id: 'summit_platform',
    x: worldWidth / 2,
    y: currentY - 110,
    w: 260,
    h: 30,
    type: 'normal',
  });

  return { platforms, collectibles };
}

/**
 * Creates the Curated Campaign Spire with balanced progression and landmark gates.
 */
export function createCampaignSpire(worldWidth: number = 640): {
  platforms: PlatformConfig[];
  collectibles: CollectibleItem[];
  lockedGate: PlatformConfig;
  keyItem: CollectibleItem;
} {
  const { platforms, collectibles } = generateProceduralSpire(42, 2200, worldWidth);

  // Locked Gate at altitude ~-1750
  const lockedGate: PlatformConfig = {
    id: 'campaign_gate',
    x: worldWidth / 2,
    y: -1750,
    w: 160,
    h: 32,
    type: 'gate',
    locked: true,
  };
  platforms.push(lockedGate);

  // Key item situated on a side platform around -1150
  const keyItem: CollectibleItem = {
    id: 'scholar_key',
    x: 120,
    y: -1180,
    type: 'key',
    collected: false,
  };
  collectibles.push(keyItem);

  return { platforms, collectibles, lockedGate, keyItem };
}
