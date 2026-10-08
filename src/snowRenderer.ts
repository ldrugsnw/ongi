import { advanceFlakes, createFlakes, flakeX, snowOptions, type SnowOptions } from './snow.ts';
import { startWindowParticles, type Geometry, type ParticleEnvironment } from './windowParticles.ts';
export type SnowEnvironment = ParticleEnvironment;

function sprite(near: boolean, variant: number, makeCanvas: SnowEnvironment['createCanvas']) {
  const canvas = makeCanvas();
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const gradient = ctx.createRadialGradient(29, 27, 1, 32, 32, 25);
  gradient.addColorStop(0, 'rgba(255,246,224,0.96)');
  gradient.addColorStop(.35, 'rgba(244,239,223,0.84)');
  gradient.addColorStop(.72, 'rgba(189,202,208,0.45)');
  gradient.addColorStop(1, 'rgba(171,190,202,0)');
  ctx.save();
  ctx.beginPath();
  if (near) {
    const points = Array.from({ length: 12 }, (_, i) => {
      const angle = i * Math.PI / 6;
      const radius = 23 + Math.sin(i * 2.7 + variant * 1.9) * 2;
      return { x: 32 + Math.cos(angle) * radius, y: 32 + Math.sin(angle) * radius };
    });
    const last = points[points.length - 1], first = points[0];
    ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
    points.forEach((point, i) => {
      const next = points[(i + 1) % points.length];
      ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
    });
  } else ctx.arc(32, 32, 25, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  if (near) {
    ctx.strokeStyle = 'rgba(120,143,157,0.10)';
    ctx.lineWidth = .6;
    for (let i = 0; i < 11; i++) {
      const x = 16 + ((i * 17 + variant * 7) % 31);
      const y = 15 + ((i * 11 + variant * 3) % 33);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3.5, y - 2); ctx.stroke();
    }
  }
  ctx.restore();
  return canvas;
}
export function startSnow(canvas: HTMLCanvasElement, geometry: Geometry, options: SnowOptions = snowOptions, env?: ParticleEnvironment) {
  return startWindowParticles(canvas, geometry, environment => {
    const sprites = [sprite(false, 0, environment.createCanvas), ...Array.from({ length: 4 }, (_, i) => sprite(true, i, environment.createCanvas))];
    const flakes = createFlakes(options);
    return {
      advance: seconds => advanceFlakes(flakes, seconds),
      draw(ctx) {
        for (const flake of flakes) {
          ctx.globalAlpha = flake.opacity;
          const size = flake.radius * 2;
          ctx.drawImage(sprites[flake.near ? flake.sprite + 1 : 0], flakeX(flake) - flake.radius, flake.y - flake.radius, size, size);
        }
      },
    };
  }, env);
}
