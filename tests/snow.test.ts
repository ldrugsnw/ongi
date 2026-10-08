import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advanceFlakes, containTransform, containsPoint, createFlakes, flakeX, parsePolygon, snowOptions } from '../src/snow.ts';
import { startSnow, type SnowEnvironment } from '../src/snowRenderer.ts';

function seededRandom() {
  let seed = 123;
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
test('22 flakes vary in depth, transparency, size and speed within calm bounds', () => {
  const flakes = createFlakes(snowOptions, seededRandom());
  assert.equal(flakes.length, 22);
  assert.ok(flakes.some(f => f.near) && flakes.some(f => !f.near));
  assert.ok(new Set(flakes.map(f => f.speed)).size > 10);
  for (const flake of flakes) {
    assert.ok(flake.radius >= 1.7 && flake.radius <= 5.6);
    assert.ok(flake.opacity >= .34 && flake.opacity <= .78);
    assert.ok(flake.speed >= 13 && flake.speed <= 28);
    assert.ok(flake.sway <= 7);
  }
});
test('fall and sine sway are time-based and smooth across frame rates', () => {
  const a = createFlakes(snowOptions, seededRandom());
  const b = structuredClone(a);
  const before = structuredClone(a);
  for (let i = 0; i < 60; i++) advanceFlakes(a, 1 / 60);
  for (let i = 0; i < 120; i++) advanceFlakes(b, 1 / 120);
  for (let i = 0; i < a.length; i++) {
    assert.ok(Math.abs(a[i].y - b[i].y) < 1e-8);
    assert.ok(Math.abs(flakeX(a[i]) - flakeX(b[i])) < 1e-8);
    assert.ok(a[i].y > before[i].y || a[i].y < 0);
    assert.ok(Math.abs(flakeX(a[i]) - a[i].baseX) <= a[i].sway);
  }
});
test('resuming after a long interruption does not jump; wraps below all panes', () => {
  const flake = createFlakes(snowOptions, seededRandom())[0];
  flake.y = 100;
  advanceFlakes([flake], 60);
  assert.ok(flake.y - 100 <= flake.speed * .05 + 1e-8);
  flake.y = 551 + flake.radius;
  advanceFlakes([flake], 1 / 60);
  assert.equal(flake.y, -16 - flake.radius);
});
test('actual glass mask excludes frames, the indoor plant, wall and cup', () => {
  const source = readFileSync(new URL('../src/scene.ts', import.meta.url), 'utf8');
  const polygons = (key: string) => [...source.match(new RegExp(`${key}: \\[([\\s\\S]*?)\\]`))![1].matchAll(/'([^']+)'/g)].map(m => parsePolygon(m[1]));
  const panes = polygons('panes'), foreground = polygons('foreground');
  const visible = (x: number, y: number) => panes.some(p => containsPoint(p, { x, y })) && !foreground.some(p => containsPoint(p, { x, y }));
  assert.equal(visible(1330, 80), true);
  assert.equal(visible(1450, 200), true);
  for (const point of [[1400, 250], [1200, 400], [1210, 95], [1555, 350], [1000, 350], [1174, 700]]) {
    assert.equal(visible(point[0], point[1]), false, `${point} must be masked`);
  }
});
test('contain transform aligns original coordinates at desktop and iPad sizes', () => {
  for (const [width, height] of [[1440, 810.43], [1194, 672], [834, 469.4], [1024, 576.3], [1000, 1000]]) {
    const t = containTransform(width, height, 1672, 941);
    assert.ok(t.x >= -1e-8 && t.y >= -1e-8);
    assert.ok(1672 * t.scale <= width + 1e-8 && 941 * t.scale <= height + 1e-8);
    const rendered = { x: 1400 * t.scale + t.x, y: 250 * t.scale + t.y };
    assert.ok(Math.abs((rendered.x - t.x) / t.scale - 1400) < 1e-8);
    assert.ok(Math.abs((rendered.y - t.y) / t.scale - 250) < 1e-8);
  }
});
test('renderer caches sprites, pauses hidden tabs and disposes all observers/listeners/frames', () => {
  let gradients = 0, draws = 0, hidden = false, frameId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const callbacks: Record<string, () => void> = {};
  const disposed: string[] = [];
  const clips: string[] = [];
  const context = new Proxy({
    createRadialGradient() { gradients++; return { addColorStop() {} }; },
    drawImage() { draws++; },
    clip(_path: unknown, rule?: string) { clips.push(rule ?? 'nonzero'); },
  }, { get(target, key) { return key in target ? target[key as keyof typeof target] : () => {}; } });
  const canvas = {
    width: 0, height: 0,
    getContext: () => context,
    getBoundingClientRect: () => ({ width: 834, height: 469.4 }),
  } as unknown as HTMLCanvasElement;
  const subscribe = (key: string, callback: () => void) => { callbacks[key] = callback; return () => { disposed.push(key); }; };
  const env: SnowEnvironment = {
    createCanvas: () => ({ getContext: () => context }) as unknown as HTMLCanvasElement,
    createPath: () => ({ moveTo() {}, lineTo() {}, closePath() {}, rect() {} }) as unknown as Path2D,
    requestFrame(callback) { const id = ++frameId; frames.set(id, callback); return id; },
    cancelFrame(id) { frames.delete(id); },
    observeSize: callback => subscribe('observer', callback),
    onResize: callback => subscribe('resize', callback),
    onVisibility: callback => subscribe('visibility', callback),
    hidden: () => hidden, pixelRatio: () => 3,
  };
  const stop = startSnow(canvas, { width: 1672, height: 941, panes: ['1180,0 1383,0 1383,147'], foreground: [] }, snowOptions, env);
  assert.equal(gradients, 5);
  assert.equal(canvas.width, 1668); // DPR capped at 2.
  assert.ok(clips.includes('evenodd'));
  const tick = (time: number) => { const [id, callback] = [...frames.entries()][0]; frames.delete(id); callback(time); };
  tick(16); tick(32);
  assert.equal(gradients, 5);
  assert.ok(draws >= 66);
  assert.equal(frames.size, 1);
  hidden = true; callbacks.visibility();
  assert.equal(frames.size, 0);
  hidden = false; callbacks.visibility();
  assert.equal(frames.size, 1);
  const lateCallback = [...frames.values()][0];
  stop();
  assert.equal(frames.size, 0);
  assert.deepEqual(disposed.sort(), ['observer', 'resize', 'visibility']);
  const drawCount = draws;
  lateCallback(100); callbacks.observer();
  assert.equal(draws, drawCount);
  assert.equal(frames.size, 0);
});
