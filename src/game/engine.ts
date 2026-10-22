/**
 * Core 60fps Game Engine for Climb & Learn: The Scholar's Spire
 * Handles physics simulation, camera dampening, platform behaviors, and canvas rendering.
 */

import { PlatformConfig, CollectibleItem, BiomeConfig, GameMode, SubjectCategory } from './types';
import { PHYSICS, checkAABB, calculateJumpImpulse, calculateBouncyImpulse, getCampaignBiomes, createCampaignSpire, generateProceduralSpire } from './rules';
import { ParticleSystem } from './particleSystem';
import { sound } from './audio';

export interface EngineCallbacks {
  onScoreUpdate: (scoreDelta: number, reason: string) => void;
  onAltitudeChange: (altitudeMeters: number, maxAltitude: number) => void;
  onCheckpointReached: (checkpointIndex: number) => void;
  onKnowledgePrompt: (checkpointIndex?: number) => void;
  onGemCollected: (count: number) => void;
  onKeyFound: () => void;
  onFall: (fallCount: number) => void;
  onVictory: (timeSeconds: number) => void;
  onToast: (message: string) => void;
}

export class SpireGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Viewport & Scale
  public width: number = 640;
  public height: number = 720;
  private cameraY: number = 200;
  private cameraTargetY: number = 200;

  // World Data
  public mode: GameMode = 'campaign';
  public category: SubjectCategory = 'all';
  public platforms: PlatformConfig[] = [];
  public collectibles: CollectibleItem[] = [];
  public biomes: BiomeConfig[] = [];
  public particles: ParticleSystem;

  // Player State
  public player = {
    x: 320,
    y: 320,
    w: 24,
    h: 30,
    vx: 0,
    vy: 0,
    fx: 0,
    fy: 0,
    facing: 1, // 1 = right, -1 = left
    charge: 0, // 0..1
    isCharging: false,
    grounded: false,
    groundPlat: null as PlatformConfig | null,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    lastDirHeld: 0,
    lastDirFrame: 0,
    lastLandedY: 320,
    squashX: 1,
    squashY: 1,
    hasKey: false,
    hasFeather: false,
    parachuteActive: false,
    lastCheckpoint: null as { x: number; y: number; index: number } | null,
    trail: [] as { x: number; y: number; alpha: number }[],
  };

  // Run Stats
  public stats = {
    altitude: 0,
    maxAltitude: 0,
    gemsCollected: 0,
    falls: 0,
    safetiesUsed: 0,
    startTime: 0,
    elapsedTime: 0,
    victory: false,
  };

  // Input Tracking
  private keysHeld = new Set<string>();
  private edgePressed = new Set<string>();
  private virtualInputs = {
    left: false,
    right: false,
    jumpCharge: false,
  };

  // Companion Robot NPC (Team Mechatrons buddy)
  public npc = {
    x: 430,
    y: 330,
    speechIndex: 0,
    dialogues: [
      'Mecha: Team Mechatrons welcomes you! Hold W or Space to leap!',
      'Mecha: Flags hold study recall tips. Answer questions for blessings!',
      'Mecha: Find the golden key to unlock the Summit Gateway above!',
      'Mecha: Don\'t worry about falling—press R anytime to return to your last flag!',
      'Mecha: We built this spire for you, scholar. You can reach the top!'
    ]
  };

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.callbacks = callbacks;
    this.particles = new ParticleSystem(700);
    this.biomes = getCampaignBiomes();

    this.setupListeners();
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  public resize(displayWidth: number, displayHeight: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Keep internal logical aspect ratio optimal for vertical platformer
    this.width = 640;
    this.height = Math.round((640 * displayHeight) / Math.max(1, displayWidth));
    if (this.height < 600) this.height = 600;
    if (this.height > 960) this.height = 960;

    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.particles.reset();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const code = e.code;
    if (!this.keysHeld.has(code)) {
      this.edgePressed.add(code);
    }
    this.keysHeld.add(code);

    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(code)) {
      // Prevent browser default window scrolling
      e.preventDefault();
    }

    if (code === 'KeyE') {
      this.talkToNPC();
    }
  };

  public talkToNPC() {
    const dist = Math.hypot(this.player.x - this.npc.x, this.player.y - this.npc.y);
    if (dist < 90) {
      const line = this.npc.dialogues[this.npc.speechIndex % this.npc.dialogues.length];
      this.npc.speechIndex++;
      this.callbacks.onToast(line);
      sound.playGem();
      this.particles.burst(this.npc.x, this.npc.y - 15, 12, 1.8, 255, 215, 80, 'sparkle');
    }
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private handleBlur = () => {
    this.keysHeld.clear();
    this.edgePressed.clear();
    this.virtualInputs.left = false;
    this.virtualInputs.right = false;
    this.virtualInputs.jumpCharge = false;
    this.player.isCharging = false;
    sound.stopChargeHum();
  };

  // Virtual inputs for mobile touch controls
  public setVirtualInput(control: 'left' | 'right' | 'jumpCharge', active: boolean) {
    this.virtualInputs[control] = active;
  }

  public startRun(mode: GameMode, category: SubjectCategory, seed: number = Date.now()) {
    this.mode = mode;
    this.category = category;
    this.particles.reset();

    if (mode === 'campaign') {
      const spire = createCampaignSpire(this.width);
      this.platforms = spire.platforms;
      this.collectibles = spire.collectibles;
    } else if (mode === 'daily') {
      // Deterministic daily seed (YYYYMMDD)
      const d = new Date();
      const dailySeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      const spire = generateProceduralSpire(dailySeed, 3400, this.width);
      this.platforms = spire.platforms;
      this.collectibles = spire.collectibles;
    } else {
      // Endless procedural mode
      const spire = generateProceduralSpire(seed, 4000, this.width);
      this.platforms = spire.platforms;
      this.collectibles = spire.collectibles;
    }

    // Reset player
    this.player.x = this.width / 2;
    this.player.y = 320;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.fx = 0;
    this.player.fy = 0;
    this.player.facing = 1;
    this.player.charge = 0;
    this.player.isCharging = false;
    this.player.grounded = true;
    this.player.coyoteTimer = 0;
    this.player.jumpBufferTimer = 0;
    this.player.lastLandedY = 320;
    this.player.squashX = 1;
    this.player.squashY = 1;
    this.player.hasKey = false;
    this.player.hasFeather = false;
    this.player.parachuteActive = false;
    this.player.lastCheckpoint = null;
    this.player.trail = [];

    // Reset stats
    this.stats.altitude = 0;
    this.stats.maxAltitude = 0;
    this.stats.gemsCollected = 0;
    this.stats.falls = 0;
    this.stats.safetiesUsed = 0;
    this.stats.startTime = performance.now();
    this.stats.elapsedTime = 0;
    this.stats.victory = false;

    this.cameraY = 200;
    this.cameraTargetY = 200;

    sound.startAmbience();
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.loop(this.lastTime);
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      sound.stopChargeHum();
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    sound.stopChargeHum();
  }

  public respawnAtCheckpoint() {
    const cp = this.player.lastCheckpoint;
    const targetX = cp ? cp.x : this.width / 2;
    const targetY = cp ? cp.y - this.player.h / 2 - 4 : 320;

    this.player.x = targetX;
    this.player.y = targetY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.fx = 0;
    this.player.fy = 0;
    this.player.charge = 0;
    this.player.isCharging = false;
    this.player.parachuteActive = false;

    this.particles.burst(targetX, targetY, 20, 2.5, 140, 210, 255);
    sound.playLand(false);
    this.callbacks.onToast(cp ? `Returned to Checkpoint ${cp.index + 1}` : 'Returned to Spire base');
  }

  public unlockGate() {
    this.platforms = this.platforms.filter(p => !p.locked);
    this.particles.burst(this.width / 2, -1750, 45, 3.5, 255, 220, 80);
    sound.playKeyUnlock();
    this.callbacks.onToast('The Celestial Gateway has unlocked!');
  }

  public grantBonus(type: 'feather' | 'score' | 'super_jump') {
    if (type === 'feather') {
      this.player.hasFeather = true;
      this.callbacks.onToast('Safety Feather equipped! 1 Fall Parachute granted.');
      sound.playGem();
    } else if (type === 'score') {
      this.callbacks.onScoreUpdate(500, 'Quiz Mastery');
      sound.playCorrect();
    } else if (type === 'super_jump') {
      this.player.vy = -19;
      this.player.squashX = 0.7;
      this.player.squashY = 1.4;
      this.particles.burst(this.player.x, this.player.y, 25, 3.0, 100, 255, 200);
      sound.playBounce();
      this.callbacks.onToast('Super Jump launched!');
    }
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    // Clamped dt to prevent tunneling
    const dt = Math.min(rawDt, 0.05);

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    this.edgePressed.clear();
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const p = this.player;
    this.stats.elapsedTime = (performance.now() - this.stats.startTime) / 1000;

    // --- Inputs ---
    const leftHeld = this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft') || this.virtualInputs.left;
    const rightHeld = this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight') || this.virtualInputs.right;
    const jumpHeld = this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp') || this.keysHeld.has('Space') || this.virtualInputs.jumpCharge;
    const jumpJustPressed = this.edgePressed.has('KeyW') || this.edgePressed.has('ArrowUp') || this.edgePressed.has('Space');

    const inputDir = (rightHeld ? 1 : 0) - (leftHeld ? 1 : 0);
    if (inputDir !== 0) {
      p.facing = inputDir;
      p.lastDirHeld = inputDir;
      p.lastDirFrame = 0;
    } else {
      p.lastDirFrame++;
    }

    if (jumpJustPressed) {
      p.jumpBufferTimer = PHYSICS.JUMP_BUFFER_FRAMES;
    } else if (p.jumpBufferTimer > 0) {
      p.jumpBufferTimer--;
    }

    // --- Grounded & Charging Logic ---
    if (p.grounded) {
      p.coyoteTimer = PHYSICS.COYOTE_FRAMES;
      p.parachuteActive = false;

      // Jump charging
      if (jumpHeld) {
        p.isCharging = true;
        p.charge = Math.min(1.0, p.charge + PHYSICS.CHARGE_RATE);
        sound.updateChargeHum(p.charge);
        p.vx *= 0.55; // Crouch friction while charging

        // Charge sparks
        if (Math.random() < p.charge * 0.7) {
          this.particles.spawn(
            p.x + (Math.random() - 0.5) * p.w,
            p.y + p.h / 2,
            (Math.random() - 0.5) * 1.5,
            -Math.random() * 2,
            0,
            0.05,
            16,
            2,
            255,
            Math.floor(200 - p.charge * 120),
            70,
            'sparkle'
          );
        }
      } else {
        // Released jump
        if (p.isCharging) {
          // If held enough, use full charge; if tapped quickly, grant responsive tap jump
          if (p.charge < PHYSICS.MIN_JUMP_CHARGE) {
            p.charge = 0.42; // Responsive tap jump
          }
          this.executeJump();
        } else if (p.jumpBufferTimer > 0) {
          // Tap jump from buffer
          p.charge = 0.42;
          this.executeJump();
        }
        p.charge = 0;
        p.isCharging = false;
        sound.stopChargeHum();

        // Walking on ground
        if (inputDir !== 0) {
          p.vx = inputDir * PHYSICS.WALK_SPEED;
          // Footstep dust
          if (Math.random() < 0.2) {
            this.particles.spawnDust(p.x, p.y + p.h / 2, p.facing);
          }
        } else {
          p.vx *= 0.72; // Ground friction
          if (Math.abs(p.vx) < 0.05) p.vx = 0;
        }
      }
    } else {
      // Airborne
      p.charge = 0;
      p.isCharging = false;
      sound.stopChargeHum();

      if (p.coyoteTimer > 0) {
        p.coyoteTimer--;
        if (jumpHeld && p.charge === 0) {
          p.charge = 0.45;
          this.executeJump();
        }
      }

      // Responsive Air control
      p.vx += inputDir * PHYSICS.AIR_CONTROL;

      // Parachute deployment if falling fast with feather
      if (p.hasFeather && p.vy > 8 && !p.parachuteActive) {
        p.parachuteActive = true;
        p.hasFeather = false;
        this.stats.safetiesUsed++;
        this.callbacks.onToast('Safety Feather deployed! Gliding safely...');
        sound.playGem();
      }

      if (p.parachuteActive) {
        p.vy = Math.min(p.vy, 2.2); // Glide speed cap
        // Floating feather particles
        if (Math.random() < 0.3) {
          this.particles.spawn(p.x, p.y - 15, (Math.random() - 0.5) * 1.2, 0.4, 0, 0.02, 35, 3, 240, 245, 255);
        }
      }
    }

    // --- Physics Integration ---
    const grav = p.parachuteActive ? 0.15 : PHYSICS.GRAVITY;
    p.vy += grav;
    p.vx += p.fx;
    p.vy += p.fy;
    p.fx *= PHYSICS.FORCE_DECAY;
    p.fy *= PHYSICS.FORCE_DECAY;

    p.vx = Math.max(-PHYSICS.MAX_SPEED, Math.min(PHYSICS.MAX_SPEED, p.vx));
    p.vy = Math.max(-PHYSICS.MAX_SPEED, Math.min(PHYSICS.MAX_SPEED, p.vy));

    const wasGrounded = p.grounded;
    p.grounded = false;
    p.groundPlat = null;

    // Move on X and resolve horizontal collisions
    p.x += p.vx;

    // Screen border wrap/clamp
    if (p.x - p.w / 2 < 20) {
      p.x = 20 + p.w / 2;
      p.vx = 0;
    } else if (p.x + p.w / 2 > this.width - 20) {
      p.x = this.width - 20 - p.w / 2;
      p.vx = 0;
    }

    // Move on Y and resolve platform collisions
    const preVy = p.vy;
    p.y += p.vy;

    for (const plat of this.platforms) {
      if (plat.crumbled) continue;

      const pBox = { x: p.x, y: p.y, w: p.w, h: p.h };
      const platBox = { x: plat.x, y: plat.y, w: plat.w, h: plat.h };

      if (!checkAABB(pBox, platBox)) continue;

      if (plat.type === 'wind') {
        // Wind thermal column pushes player upward
        p.vy -= 1.1;
        this.particles.spawn(plat.x + (Math.random() - 0.5) * plat.w, plat.y, 0, -2.5, 0, -0.05, 30, 2, 200, 240, 255);
        continue;
      }

      // Check landing on top
      const platTop = plat.y - plat.h / 2;
      const prevBottom = p.y - p.vy + p.h / 2;

      if (p.vy > 0 && prevBottom <= platTop + 8) {
        if (plat.type === 'bouncy') {
          // Bouncy mushroom trampoline!
          p.y = platTop - p.h / 2;
          p.vy = calculateBouncyImpulse(preVy, plat.bouncyStrength);
          p.squashX = 1.35;
          p.squashY = 0.65;
          this.particles.burst(p.x, platTop, 16, 2.8, 120, 230, 150);
          sound.playBounce();
          continue;
        }

        // Standard landing
        p.y = platTop - p.h / 2;
        p.grounded = true;
        p.groundPlat = plat;
        p.vy = 0;
        p.fy = 0;

        // Check crumbling
        if (plat.type === 'crumbling' && !plat.crumbled) {
          plat.crumbleTimer = (plat.crumbleTimer || 0) + 1;
          if (plat.crumbleTimer > 45) {
            plat.crumbled = true;
            this.particles.burst(plat.x, plat.y, 25, 2.0, 140, 100, 80);
            this.callbacks.onToast('Platform collapsed!');
            // Respawn after 3.5s
            setTimeout(() => {
              plat.crumbled = false;
              plat.crumbleTimer = 0;
            }, 3500);
          }
        }

        // Checkpoint flag landing
        if (plat.type === 'checkpoint' && plat.checkpointIndex !== undefined) {
          if (!p.lastCheckpoint || plat.checkpointIndex > p.lastCheckpoint.index) {
            p.lastCheckpoint = { x: plat.x, y: platTop, index: plat.checkpointIndex };
            this.particles.burst(plat.x, platTop - 25, 32, 3.2, 255, 215, 60, 'sparkle');
            sound.playCheckpoint();
            this.callbacks.onCheckpointReached(plat.checkpointIndex);
            this.callbacks.onKnowledgePrompt(plat.checkpointIndex);
          }
        }

        if (!wasGrounded) {
          this.onLand(preVy);
        }
      } else if (p.vy < 0 && p.y - p.h / 2 < plat.y + plat.h / 2 && p.y + p.h / 2 > plat.y + plat.h / 2) {
        // Head bump
        p.y = plat.y + plat.h / 2 + p.h / 2 + 1;
        p.vy = 0;
        p.fy = 0;
      }
    }

    // Moving platforms update
    for (const plat of this.platforms) {
      if (plat.type === 'moving' && plat.vx && plat.rangeX) {
        plat.x += plat.vx;
        if (plat.x < plat.rangeX[0]) {
          plat.x = plat.rangeX[0];
          plat.vx = Math.abs(plat.vx);
        } else if (plat.x > plat.rangeX[1]) {
          plat.x = plat.rangeX[1];
          plat.vx = -Math.abs(plat.vx);
        }
        // Carry player if standing on it
        if (p.grounded && p.groundPlat === plat) {
          p.x += plat.vx;
        }
      }
    }

    // Collectibles collection
    for (const item of this.collectibles) {
      if (item.collected) continue;

      const dist = Math.hypot(p.x - item.x, p.y - item.y);
      if (dist < 26) {
        item.collected = true;
        if (item.type === 'gem') {
          this.stats.gemsCollected++;
          this.callbacks.onGemCollected(this.stats.gemsCollected);
          this.particles.burst(item.x, item.y, 16, 2.2, 80, 220, 255, 'sparkle');
          sound.playGem();
        } else if (item.type === 'key') {
          p.hasKey = true;
          this.unlockGate();
          this.callbacks.onKeyFound();
        } else if (item.type === 'feather') {
          p.hasFeather = true;
          this.particles.burst(item.x, item.y, 20, 2.5, 255, 255, 200);
          this.callbacks.onToast('Safety Feather acquired!');
          sound.playGem();
        }
      }
    }

    // Altitude calculation
    const currentAlt = Math.max(0, Math.floor((320 - p.y) / 10));
    this.stats.altitude = currentAlt;
    if (currentAlt > this.stats.maxAltitude) {
      this.stats.maxAltitude = currentAlt;
    }
    this.callbacks.onAltitudeChange(this.stats.altitude, this.stats.maxAltitude);

    // Audio ambience altitude scaling
    sound.updateAmbienceAltitude(Math.min(1, currentAlt / 250));

    // Fall below bottom recovery
    if (p.y > 440) {
      this.stats.falls++;
      this.callbacks.onFall(this.stats.falls);
      this.respawnAtCheckpoint();
    }

    // Victory check at summit
    if (p.y < -2300 && !this.stats.victory) {
      this.stats.victory = true;
      this.particles.spawnConfetti(this.width / 2, this.cameraY + 100, 60);
      sound.playVictory();
      this.callbacks.onVictory(this.stats.elapsedTime);
    }

    // Update Particles
    this.particles.update(1);

    // Update squash & stretch decay
    p.squashX += (1 - p.squashX) * 0.18;
    p.squashY += (1 - p.squashY) * 0.18;

    // Trail buffer for high velocity
    if (Math.abs(p.vx) > 5 || Math.abs(p.vy) > 8) {
      p.trail.push({ x: p.x, y: p.y, alpha: 0.65 });
      if (p.trail.length > 5) p.trail.shift();
    } else if (p.trail.length > 0) {
      p.trail.shift();
    }

    // Camera dampening smoothly centering player with upper vertical look-ahead
    const targetY = p.y - this.height * 0.42 + p.vy * 6;
    this.cameraTargetY = targetY;
    this.cameraY += (this.cameraTargetY - this.cameraY) * 0.12;
  }

  private executeJump() {
    const p = this.player;
    // Determine aim direction: held key or recently released within 8 frames
    let aim = 0;
    const leftHeld = this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft') || this.virtualInputs.left;
    const rightHeld = this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight') || this.virtualInputs.right;
    const activeDir = (rightHeld ? 1 : 0) - (leftHeld ? 1 : 0);

    if (activeDir !== 0) {
      aim = activeDir;
    } else if (p.lastDirFrame <= 8) {
      aim = p.lastDirHeld;
    }

    const impulse = calculateJumpImpulse(p.charge, aim);
    p.vx = impulse.vx;
    p.vy = impulse.vy;
    p.grounded = false;
    p.coyoteTimer = 0;
    p.jumpBufferTimer = 0;

    // Squash on launch
    p.squashX = 0.82;
    p.squashY = 1.25;

    // Launch dust & audio
    this.particles.spawnDust(p.x, p.y + p.h / 2, aim || p.facing);
    sound.playJump(p.charge);
  }

  private onLand(impactVelocity: number) {
    const p = this.player;
    p.squashX = 1.22;
    p.squashY = 0.78;

    if (impactVelocity > 4.5) {
      sound.playLand(impactVelocity > 10);
      this.particles.burst(p.x, p.y + p.h / 2, 10, 1.6, 210, 205, 195);
    }
  }

  // --- Rendering ---
  private render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Determine current biome based on camera altitude
    const currentBiome = this.getCurrentBiome(this.cameraY);

    // Draw Parallax Sky Background
    this.drawSkyBackground(ctx, w, h, currentBiome);

    // World Space Transformations
    ctx.save();
    ctx.translate(0, -this.cameraY);

    // Parallax Mountain / Spire Silhouettes
    this.drawParallaxBackdrop(ctx, w, h, currentBiome);

    // Platforms
    this.drawPlatforms(ctx);

    // Collectibles & Flags
    this.drawCollectibles(ctx);

    // Companion Robot NPC (Mecha)
    this.drawMechaNPC(ctx);

    // Particles (in world space)
    this.particles.draw(ctx);

    // Player
    this.drawPlayer(ctx);

    ctx.restore();
  }

  private getCurrentBiome(camY: number): BiomeConfig {
    for (const b of this.biomes) {
      if (camY >= b.minY && camY <= b.maxY) {
        return b;
      }
    }
    return this.biomes[this.biomes.length - 1];
  }

  private drawSkyBackground(ctx: CanvasRenderingContext2D, w: number, h: number, biome: BiomeConfig) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `rgb(${biome.skyTop.join(',')})`);
    grad.addColorStop(1, `rgb(${biome.skyBottom.join(',')})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Twinkling stars in higher altitudes
    const altitudeFactor = Math.max(0, Math.min(1, (300 - this.cameraY) / 2500));
    if (altitudeFactor > 0.15) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.6 * altitudeFactor).toFixed(2)})`;
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 12345) % w);
        const sy = ((i * 67890 + (performance.now() * 0.005)) % h);
        const size = (i % 3 === 0) ? 2 : 1.2;
        ctx.fillRect(sx, sy, size, size);
      }
    }
  }

  private drawParallaxBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, biome: BiomeConfig) {
    // Parallax factor: 0.25x
    const bgY = this.cameraY * 0.75;

    ctx.save();
    ctx.fillStyle = `rgba(${biome.skyTop[0] + 15}, ${biome.skyTop[1] + 20}, ${biome.skyTop[2] + 35}, 0.45)`;

    // Academy towers / Gothic arches silhouette in distance
    ctx.beginPath();
    ctx.moveTo(0, bgY + h);
    ctx.lineTo(0, bgY + h - 140);
    ctx.lineTo(80, bgY + h - 210);
    ctx.lineTo(130, bgY + h - 160);
    ctx.lineTo(240, bgY + h - 290);
    ctx.lineTo(310, bgY + h - 190);
    ctx.lineTo(440, bgY + h - 260);
    ctx.lineTo(520, bgY + h - 180);
    ctx.lineTo(w, bgY + h - 230);
    ctx.lineTo(w, bgY + h);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D) {
    const camTop = this.cameraY - 40;
    const camBottom = this.cameraY + this.height + 40;

    for (const p of this.platforms) {
      if (p.crumbled) continue;
      if (p.y + p.h / 2 < camTop || p.y - p.h / 2 > camBottom) continue;

      ctx.save();
      const left = p.x - p.w / 2;
      const top = p.y - p.h / 2;

      if (p.type === 'bouncy') {
        // Bouncy Mushroom Platform
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.roundRect(left, top, p.w, p.h, 8);
        ctx.fill();

        // Spring polka dots
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(p.x - p.w * 0.25, p.y - 1, 3.5, 0, Math.PI * 2);
        ctx.arc(p.x + p.w * 0.25, p.y - 1, 3.5, 0, Math.PI * 2);
        ctx.arc(p.x, p.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Glowing spring rim
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(left, top, p.w, 4);
      } else if (p.type === 'moving') {
        // Golden Gear Moving Platform
        ctx.fillStyle = '#243048';
        ctx.beginPath();
        ctx.roundRect(left, top, p.w, p.h, 5);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(left, top, p.w, 3);

        // Center kinetic chevron
        ctx.fillStyle = '#7dd3fc';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◄ ►', p.x, p.y + 1);
      } else if (p.type === 'crumbling') {
        // Cracked Sandstone Platform
        const shake = (p.crumbleTimer || 0) > 0 ? (Math.random() - 0.5) * 4 : 0;
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(left + shake, top, p.w, p.h, 4);
        ctx.fill();

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CRUMBLING', p.x + shake, p.y);
      } else if (p.type === 'gate') {
        // Locked Gate
        ctx.fillStyle = '#334155';
        ctx.fillRect(left, top, p.w, p.h);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(left, top, p.w, p.h);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒 SCHOLAR KEY REQUIRED', p.x, p.y);
      } else if (p.type === 'checkpoint') {
        // Checkpoint Platform with Flag Shrine
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(left, top, p.w, p.h, 6);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(left, top, p.w, 4);

        // Flag banner pole
        const poleX = p.x;
        const poleBaseY = top;
        const poleTopY = poleBaseY - 42;

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(poleX, poleBaseY);
        ctx.lineTo(poleX, poleTopY);
        ctx.stroke();

        // Flag cloth with active waving
        const reached = this.player.lastCheckpoint && this.player.lastCheckpoint.index >= (p.checkpointIndex || 0);
        const wave = sinWave(performance.now() * 0.008 + (p.checkpointIndex || 0)) * 4;

        ctx.fillStyle = reached ? '#10b981' : '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(poleX, poleTopY);
        ctx.lineTo(poleX + 22 + wave, poleTopY + 8);
        ctx.lineTo(poleX, poleTopY + 16);
        ctx.closePath();
        ctx.fill();

        // Gold finial on top
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(poleX, poleTopY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Checkpoint index label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`CHKP ${((p.checkpointIndex || 0) + 1)}`, p.x, top - 46);
      } else {
        // Standard Stone Spire Platform
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(left, top, p.w, p.h, 4);
        ctx.fill();

        // Lush moss/crystal trim
        ctx.fillStyle = '#10b981';
        ctx.fillRect(left, top, p.w, 4);
      }

      ctx.restore();
    }
  }

  private drawCollectibles(ctx: CanvasRenderingContext2D) {
    const time = performance.now() * 0.005;

    for (const item of this.collectibles) {
      if (item.collected) continue;

      const bob = Math.sin(time + item.x) * 4;
      const cy = item.y + bob;

      ctx.save();
      if (item.type === 'gem') {
        // Knowledge Spark Gem (Rotating Diamond with Aura)
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(item.x, cy - 8);
        ctx.lineTo(item.x + 7, cy);
        ctx.lineTo(item.x, cy + 8);
        ctx.lineTo(item.x - 7, cy);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(item.x - 1, cy - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'key') {
        // Scholar's Master Key
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(item.x, cy - 4, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillRect(item.x - 1.5, cy, 3, 12);
        ctx.fillRect(item.x + 1.5, cy + 7, 4, 2.5);
      } else if (item.type === 'feather') {
        // Safety Parachute Feather
        ctx.fillStyle = '#f1f5f9';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.ellipse(item.x, cy, 5, 10, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawMechaNPC(ctx: CanvasRenderingContext2D) {
    if (this.cameraY < -300) return; // Only visible around base

    const nx = this.npc.x;
    const ny = this.npc.y;
    const distToPlayer = Math.hypot(this.player.x - nx, this.player.y - ny);
    const time = performance.now() * 0.004;

    ctx.save();
    // Warm Campfire Lantern beside Mecha
    const flicker = Math.sin(time * 3) * 1.5;
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(nx + 18, ny + 4 + flicker, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(nx + 15, ny + 1, 6, 8);
    ctx.shadowBlur = 0;

    // Mecha Robot Body
    ctx.fillStyle = '#0f766e';
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(nx - 11, ny - 16, 22, 22, 5);
    ctx.fill();
    ctx.stroke();

    // Antenna & LED
    ctx.beginPath();
    ctx.moveTo(nx, ny - 16);
    ctx.lineTo(nx, ny - 24);
    ctx.stroke();

    ctx.fillStyle = Math.sin(time * 2) > 0 ? '#38bdf8' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(nx, ny - 25, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Visor Screen & Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(nx - 7, ny - 12, 14, 7);

    // Blinking Cyan Eyes
    const blink = Math.sin(time * 0.8) > 0.95;
    ctx.fillStyle = '#38bdf8';
    if (!blink) {
      const lookDir = this.player.x > nx ? 1 : -1;
      ctx.fillRect(nx - 5 + lookDir, ny - 10, 3, 3);
      ctx.fillRect(nx + 1 + lookDir, ny - 10, 3, 3);
    } else {
      ctx.fillRect(nx - 5, ny - 9, 3, 1);
      ctx.fillRect(nx + 1, ny - 9, 3, 1);
    }

    // Name Tag
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MECHA', nx, ny + 12);

    // Proximity Interaction Speech Prompt
    if (distToPlayer < 85) {
      const bubbleY = ny - 36 + Math.sin(time * 2) * 2;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(nx - 42, bubbleY - 14, 84, 18, 5);
      ctx.fill();
      ctx.stroke();

      // Speech pointer tail
      ctx.beginPath();
      ctx.moveTo(nx - 3, bubbleY + 4);
      ctx.lineTo(nx, bubbleY + 8);
      ctx.lineTo(nx + 3, bubbleY + 4);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('[E] Talk to Mecha', nx, bubbleY - 5);
    }

    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;

    ctx.save();

    // Render Trail Ghosting during high velocity
    for (const t of p.trail) {
      ctx.fillStyle = `rgba(56, 189, 248, ${t.alpha * 0.4})`;
      ctx.fillRect(t.x - p.w / 2, t.y - p.h / 2, p.w, p.h);
      t.alpha *= 0.8;
    }

    // Pivot at feet for squash and stretch
    const feetY = p.y + p.h / 2;
    ctx.translate(p.x, feetY);
    ctx.scale(p.squashX, p.squashY);

    // Scholar Adventurer Body
    // Robe / Coat
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(-p.w / 2, -p.h, p.w, p.h - 4, 6);
    ctx.fill();

    // Belt & Buckle
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-p.w / 2, -12, p.w, 4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2, -12, 4, 4);

    // Adventurer Backpack
    ctx.fillStyle = '#92400e';
    const backpackOffset = p.facing === 1 ? -p.w / 2 - 4 : p.w / 2;
    ctx.beginPath();
    ctx.roundRect(backpackOffset, -p.h + 8, 5, 14, 2);
    ctx.fill();

    // Wind Scarf (flutters behind player based on movement velocity)
    const scarfFlutter = Math.sin(performance.now() * 0.015) * 3;
    const scarfDir = -p.facing;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -p.h + 10);
    ctx.quadraticCurveTo(
      scarfDir * (12 + Math.abs(p.vx)),
      -p.h + 12 + scarfFlutter,
      scarfDir * (20 + Math.abs(p.vx) * 1.5),
      -p.h + 16 + scarfFlutter * 1.5
    );
    ctx.lineTo(scarfDir * (16 + Math.abs(p.vx)), -p.h + 20);
    ctx.closePath();
    ctx.fill();

    // Scholar Headband / Cap
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-p.w / 2, -p.h - 2, p.w, 4);

    // Expressive Eyes (follow movement direction)
    ctx.fillStyle = '#ffffff';
    const eyeX = p.facing * 4;
    ctx.fillRect(eyeX - 3, -p.h + 6, 4, 4);
    ctx.fillRect(eyeX + 2, -p.h + 6, 4, 4);

    ctx.fillStyle = '#0f172a';
    const pupilLook = p.facing * 1.2;
    ctx.fillRect(eyeX - 2 + pupilLook, -p.h + 7, 2, 2);
    ctx.fillRect(eyeX + 3 + pupilLook, -p.h + 7, 2, 2);

    ctx.restore();

    // Parachute visual if active
    if (p.parachuteActive) {
      ctx.save();
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;

      // Canopy dome
      ctx.beginPath();
      ctx.arc(p.x, p.y - 42, 28, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Suspension cords
      ctx.beginPath();
      ctx.moveTo(p.x - 26, p.y - 42);
      ctx.lineTo(p.x, p.y - p.h / 2);
      ctx.moveTo(p.x + 26, p.y - 42);
      ctx.lineTo(p.x, p.y - p.h / 2);
      ctx.stroke();
      ctx.restore();
    }

    // Dynamic Jump Charge HUD Bar over character
    if (p.charge > 0) {
      this.drawChargeGauge(ctx, p.x, p.y - p.h / 2 - 16, p.charge);
    }
  }

  private drawChargeGauge(ctx: CanvasRenderingContext2D, cx: number, cy: number, charge: number) {
    const p = this.player;
    const barW = 44;
    const barH = 6;
    const x = cx - barW / 2;
    const y = cy;

    ctx.save();
    // Background bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x - 2, y - 2, barW + 4, barH + 4, 4);
    ctx.fill();

    // Color gradient from emerald to electric gold to fiery coral
    let fillCol = '#10b981';
    if (charge > 0.75) fillCol = '#ef4444';
    else if (charge > 0.4) fillCol = '#fbbf24';

    ctx.fillStyle = fillCol;
    ctx.beginPath();
    ctx.roundRect(x, y, barW * charge, barH, 2);
    ctx.fill();

    // Minimum jump tick line
    const minX = x + barW * PHYSICS.MIN_JUMP_CHARGE;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(minX, y - 2);
    ctx.lineTo(minX, y + barH + 2);
    ctx.stroke();

    // Trajectory Prediction Arc (Parabolic Kinematics preview)
    let aim = 0;
    const leftHeld = this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft') || this.virtualInputs.left;
    const rightHeld = this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight') || this.virtualInputs.right;
    const activeDir = (rightHeld ? 1 : 0) - (leftHeld ? 1 : 0);
    if (activeDir !== 0) aim = activeDir;
    else if (p.lastDirFrame <= 8) aim = p.lastDirHeld;
    else aim = p.facing;

    const impulse = calculateJumpImpulse(charge, aim);
    let simX = p.x;
    let simY = p.y;
    let simVx = impulse.vx;
    let simVy = impulse.vy;

    for (let step = 1; step <= 9; step++) {
      simX += simVx * 3;
      simVy += PHYSICS.GRAVITY * 3;
      simY += simVy * 3;

      const dotRadius = Math.max(1.5, 4.2 - step * 0.3);
      const alpha = Math.max(0.2, 0.95 - step * 0.08);

      ctx.fillStyle = fillCol;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(simX, simY, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function sinWave(val: number): number {
  return Math.sin(val);
}
