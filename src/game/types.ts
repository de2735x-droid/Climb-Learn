/**
 * Core type definitions for Climb & Learn: The Scholar's Spire
 */

export type GameMode = 'campaign' | 'procedural' | 'daily';

export type SubjectCategory = 'all' | 'study_skills' | 'stem' | 'general_science';

export type PlatformType = 
  | 'normal' 
  | 'bouncy' 
  | 'moving' 
  | 'crumbling' 
  | 'ice' 
  | 'wind' 
  | 'gate' 
  | 'checkpoint';

export interface PlatformConfig {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: PlatformType;
  // Specific properties
  vx?: number;
  rangeX?: [number, number];
  crumbleTimer?: number;
  crumbled?: boolean;
  bouncyStrength?: number;
  locked?: boolean;
  checkpointIndex?: number;
}

export interface CollectibleItem {
  id: string;
  x: number;
  y: number;
  type: 'gem' | 'key' | 'feather' | 'scroll';
  collected: boolean;
  value?: number;
  scrollId?: string;
}

export interface StudyTip {
  id: string;
  title: string;
  category: string;
  summary: string;
  deepDive: string;
  actionableStep: string;
  iconName: string;
}

export interface KnowledgeQuestion {
  id: string;
  category: SubjectCategory;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedTipId?: string;
  difficulty: 1 | 2 | 3;
}

export interface GameStats {
  altitude: number; // in meters / units
  maxAltitude: number;
  score: number;
  gemsCollected: number;
  tipsCollected: number;
  totalTips: number;
  questionsAnswered: number;
  questionsCorrect: number;
  falls: number;
  safetiesUsed: number;
  timeElapsed: number; // seconds
  combo: number;
  bestCombo: number;
  grade?: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C';
}

export interface RunSummary {
  mode: GameMode;
  date: string;
  altitude: number;
  maxAltitude: number;
  score: number;
  grade: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C';
  timeSeconds: number;
  falls: number;
  questionsCorrect: number;
  totalQuestions: number;
  tipsDiscovered: number;
  victory: boolean;
}

export interface BiomeConfig {
  id: string;
  name: string;
  minY: number; // in world coordinates (negative = higher)
  maxY: number;
  skyTop: [number, number, number];
  skyBottom: [number, number, number];
  platformColor: [number, number, number];
  platformTrim: [number, number, number];
  ambientParticles: 'petals' | 'leaves' | 'stars' | 'crystals' | 'aurora';
  bgElements: 'mountains' | 'library_pillars' | 'observatory' | 'celestial_rings';
}
