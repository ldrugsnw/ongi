import { advanceLeaves, createLeaves, leafX, leafOptions, type LeafOptions } from './leaves.ts';
import { startWindowParticles, type Geometry, type ParticleEnvironment } from './windowParticles.ts';

const palette = [
  ['#dbb56a', '#b18d4b', '#806741'],
  ['#cb9560', '#ae7046', '#79583d'],
  ['#b97c60', '#965c48', '#6a4b3e'],
  ['#b19a77', '#8e7658', '#695944'],
];
function leafSprite(variant: number, near: boolean, makeCanvas: ParticleEnvironment['createCanvas']) {
  const canvas = makeCanvas();
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const maple = variant % 2 === 0;
  const colors = palette[Math.floor(variant / 2)];
  const shade = ctx.createLinearGradient(17, 15, 49, 48);
  shade.addColorStop(0, colors[0]); shade.addColorStop(.5, colors[1]); shade.addColorStop(1, colors[2]);
  ctx.save();
  ctx.beginPath();
  if (maple) {
    ctx.moveTo(32, 50);
    ctx.bezierCurveTo(25, 49, 20, 45, 16, 40);
    ctx.quadraticCurveTo(14, 36, 8, 33);
    ctx.lineTo(18, 30); ctx.quadraticCurveTo(15, 25, 11, 20);
    ctx.lineTo(24, 24); ctx.lineTo(23, 12); ctx.lineTo(29, 19);
    ctx.quadraticCurveTo(30, 12, 32, 6);
    ctx.quadraticCurveTo(35, 12, 37, 19);
    ctx.lineTo(44, 12); ctx.lineTo(41, 25); ctx.lineTo(54, 20);
    ctx.quadraticCurveTo(51, 27, 47, 31); ctx.lineTo(56, 33);
    ctx.bezierCurveTo(48, 39, 45, 49, 32, 50);
  } else {
    ctx.moveTo(32, 7);
    ctx.bezierCurveTo(25, 14, 17, 20, 18, 30);
    ctx.bezierCurveTo(18, 41, 25, 48, 31, 52);
    ctx.bezierCurveTo(39, 46, 46, 38, 45, 28);
    ctx.bezierCurveTo(44, 18, 37, 12, 32, 7);
  }
  ctx.closePath(); ctx.clip();
  ctx.globalAlpha = near ? .91 : .72;
  ctx.fillStyle = shade; ctx.fillRect(0, 0, 64, 64);
  ctx.lineWidth = near ? .8 : .55;
  ctx.strokeStyle = 'rgba(83,65,43,0.27)';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(32, 50); ctx.quadraticCurveTo(30, 30, 32, 12); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const y = 24 + i * 8;
    ctx.beginPath(); ctx.moveTo(31, y + 4);
    ctx.quadraticCurveTo(25, y + 1, maple ? 19 : 22, y - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(32, y + 4);
    ctx.quadraticCurveTo(38, y + 1, maple ? 45 : 42, y - 4); ctx.stroke();
  }
  // Small low-contrast pencil strokes soften the cached artwork without blur.
  ctx.strokeStyle = 'rgba(248,224,173,0.15)'; ctx.lineWidth = .7;
  for (let i = 0; i < 24; i++) {
    const x = 13 + (i * 13 + variant * 7) % 39;
    const y = 10 + (i * 17 + variant * 3) % 43;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2.3, y - 1.6); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(101,77,48,0.48)'; ctx.lineWidth = .8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(32, 49); ctx.quadraticCurveTo(31, 53, 30, 57); ctx.stroke();
  return canvas;
}
export function startLeaves(canvas: HTMLCanvasElement, geometry: Geometry, options: LeafOptions = leafOptions, env?: ParticleEnvironment) {
  return startWindowParticles(canvas, geometry, environment => {
    // Both shapes in four colors, cached at two depths; no artwork work per frame.
    const sprites = [false, true].map(near => Array.from({ length: 8 }, (_, i) => leafSprite(i, near, environment.createCanvas)));
    const leaves = createLeaves(options);
    return {
      advance: seconds => advanceLeaves(leaves, seconds),
      draw(ctx) {
        for (const leaf of leaves) {
          ctx.save();
          ctx.globalAlpha = leaf.opacity;
          ctx.translate(leafX(leaf), leaf.y);
          ctx.rotate(leaf.angle);
          ctx.drawImage(sprites[leaf.near ? 1 : 0][leaf.sprite], -leaf.radius, -leaf.radius, leaf.radius * 2, leaf.radius * 2);
          ctx.restore();
        }
      },
    };
  }, env);
}
