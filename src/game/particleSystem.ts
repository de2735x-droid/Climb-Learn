/**
 * Zero-GC Pooled Particle Ring Buffer
 * Pre-allocated particle slots to ensure zero garbage collection spikes during 60fps loops.
 */

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gx: number;
  gy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  shape: 'circle' | 'square' | 'sparkle' | 'rune';
}

export class ParticleSystem {
  private pool: Particle[];
  private maxParticles: number;
  private nextIdx: number = 0;

  constructor(capacity: number = 600) {
    this.maxParticles = capacity;
    this.pool = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.pool[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        gx: 0,
        gy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        r: 255,
        g: 255,
        b: 255,
        shape: 'circle',
      };
    }
  }

  public spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    gx: number,
    gy: number,
    life: number,
    size: number,
    r: number,
    g: number,
    b: number,
    shape: 'circle' | 'square' | 'sparkle' | 'rune' = 'circle'
  ) {
    const p = this.pool[this.nextIdx];
    this.nextIdx = (this.nextIdx + 1) % this.maxParticles;

    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.gx = gx;
    p.gy = gy;
    p.life = life;
    p.maxLife = life;
    p.size = size;
    p.r = r;
    p.g = g;
    p.b = b;
    p.shape = shape;
  }

  public burst(
    x: number,
    y: number,
    count: number,
    speed: number,
    r: number,
    g: number,
    b: number,
    shape: 'circle' | 'square' | 'sparkle' = 'circle'
  ) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spd = speed * (0.4 + Math.random() * 0.9);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd - 0.5;
      const life = 25 + Math.floor(Math.random() * 25);
      const size = 2 + Math.random() * 3.5;
      this.spawn(x, y, vx, vy, 0, 0.08, life, size, r, g, b, shape);
    }
  }

  public spawnDust(x: number, y: number, facing: number) {
    for (let i = 0; i < 6; i++) {
      const vx = -facing * (0.8 + Math.random() * 1.8);
      const vy = -(0.5 + Math.random() * 1.2);
      this.spawn(x, y, vx, vy, 0, 0.05, 20 + Math.random() * 15, 2 + Math.random() * 2.5, 220, 215, 200, 'circle');
    }
  }

  public spawnConfetti(x: number, y: number, count: number = 30) {
    const colors = [
      [255, 99, 132],
      [54, 162, 235],
      [255, 206, 86],
      [75, 192, 192],
      [153, 102, 255],
      [255, 159, 64],
    ];
    for (let i = 0; i < count; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const vx = (Math.random() - 0.5) * 6;
      const vy = -(2 + Math.random() * 7);
      this.spawn(x, y, vx, vy, 0, 0.15, 60 + Math.random() * 60, 4 + Math.random() * 4, col[0], col[1], col[2], 'square');
    }
  }

  public update(dtScale: number = 1) {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.vx += p.gx * dtScale;
      p.vy += p.gy * dtScale;
      p.x += p.vx * dtScale;
      p.y += p.vy * dtScale;
      p.life -= dtScale;

      if (p.life <= 0) {
        p.active = false;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha.toFixed(2)})`;

      if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'sparkle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(p.x - p.size * 1.5, p.y - 0.5, p.size * 3, 1);
        ctx.fillRect(p.x - 0.5, p.y - p.size * 1.5, 1, p.size * 3);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  public reset() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool[i].active = false;
    }
  }
}
