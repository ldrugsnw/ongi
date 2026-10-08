import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceLeaves, createLeaves, leafX, leafOptions } from '../src/leaves.ts';
import { startLeaves } from '../src/leafRenderer.ts';
import { seasonalEffect, startSeasonalParticles } from '../src/particleSeason.ts';
import { containTransform } from '../src/windowGeometry.ts';
import { geometry, particleHarness } from './particleHarness.ts';

function seededRandom() { let seed = 123; return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
test('12 leaves mix silhouettes, palettes, depths, slow opposing rotations and diagonal wind', () => {
  const leaves = createLeaves(leafOptions, seededRandom());
  assert.equal(leaves.length, 12);
  assert.equal(new Set(leaves.map(l => l.sprite)).size, 8);
  assert.ok(leaves.some(l => l.near) && leaves.some(l => !l.near));
  assert.ok(leaves.some(l => l.drift > 0) && leaves.some(l => l.drift < 0));
  assert.ok(leaves.some(l => l.spin > 0) && leaves.some(l => l.spin < 0));
  for (const leaf of leaves) {
    assert.ok(leaf.radius >= 8 && leaf.radius <= 19);
    assert.ok(leaf.speed >= 8 && leaf.speed <= 17);
    assert.ok(Math.abs(leaf.spin) <= .17 && Math.abs(leaf.drift) <= 3);
    assert.ok(leaf.sway <= 16 && leaf.opacity >= .28 && leaf.opacity <= .76);
  }
});
test('leaf falling, wind, sway and rotation stay continuous across frame rates', () => {
  const a = createLeaves(leafOptions, seededRandom()), b = structuredClone(a);
  const before = structuredClone(a);
  for (let i = 0; i < 60; i++) advanceLeaves(a, 1 / 60);
  for (let i = 0; i < 120; i++) advanceLeaves(b, 1 / 120);
  a.forEach((leaf, i) => {
    for (const key of ['x', 'y', 'angle', 'phase'] as const) assert.ok(Math.abs(leaf[key] - b[i][key]) < 1e-8);
    assert.ok(leaf.y > before[i].y);
    assert.ok(Math.abs(leaf.angle - before[i].angle) <= .17 + 1e-8);
    assert.ok(Math.abs(leafX(leaf) - leaf.x) <= leaf.sway);
  });
});
test('leaf recycling takes place outside the glass and suspended tabs cannot cause jumps', () => {
  const leaf = createLeaves(leafOptions, seededRandom())[0];
  leaf.y = 100;
  advanceLeaves([leaf], 60);
  assert.ok(leaf.y - 100 <= leaf.speed * .05 + 1e-8);
  leaf.y = 551 + leaf.radius;
  leaf.x += 25;
  advanceLeaves([leaf], 1 / 60);
  assert.equal(leaf.y, -16 - leaf.radius * 2);
  assert.equal(leaf.x, leaf.originX);
});
test('only autumn and snowy winter run effects; reduced motion disables both', () => {
  assert.equal(seasonalEffect('autumn', false), 'leaves');
  assert.equal(seasonalEffect('snowy-winter', false), 'snow');
  for (const season of ['early-autumn', 'early-winter', 'unknown']) assert.equal(seasonalEffect(season, false), null);
  for (const season of ['autumn', 'snowy-winter']) assert.equal(seasonalEffect(season, true), null);
});
test('leaf renderer caches artwork and uses shared clipping and contain scaling on mobile/desktop', () => {
  const h = particleHarness();
  const stop = startLeaves(h.canvas, geometry, leafOptions, h.env);
  assert.equal(h.stats().gradients, 16);
  h.tick(16); h.tick(32);
  assert.equal(h.stats().gradients, 16);
  assert.equal(h.stats().draws, 36);
  for (const [width, height] of [[390, 219.5], [1194, 672], [1440, 810.43]]) {
    h.resize(width, height);
    const t = containTransform(width, height, 1672, 941);
    assert.deepEqual(h.matrices.at(-1), [t.scale * 2, 0, 0, t.scale * 2, t.x * 2, t.y * 2]);
    const clips = h.clips.slice(-2);
    assert.equal(clips[0].rule, 'nonzero'); assert.equal(clips[1].rule, 'evenodd');
    const originalMasks = h.clips.filter(clip => clip.path !== undefined).slice(0, 2);
    assert.equal(clips[0].path, originalMasks[0].path); assert.equal(clips[1].path, originalMasks[1].path);
  }
  h.visibility(true); assert.equal(h.frames.size, 0);
  h.visibility(false); assert.equal(h.frames.size, 1);
  stop(); assert.equal(h.frames.size, 0);
  assert.deepEqual(h.disposed.sort(), ['observer', 'resize', 'visibility']);
});
test('repeated season changes clear old particles and never retain duplicate loops or listeners', () => {
  const h = particleHarness();
  let stop = () => {};
  for (let i = 0; i < 3; i++) {
    for (const season of ['autumn', 'snowy-winter', 'early-autumn', 'early-winter']) {
      const staleFrame = [...h.frames.values()][0];
      stop();
      assert.equal(h.frames.size, 0);
      assert.equal(Object.keys(h.callbacks).length, 0);
      const draws = h.stats().draws;
      staleFrame?.(100); assert.equal(h.stats().draws, draws);
      stop = startSeasonalParticles(h.canvas, geometry, season, false, h.env);
      const active = seasonalEffect(season, false) !== null;
      assert.equal(h.frames.size, active ? 1 : 0);
      assert.equal(Object.keys(h.callbacks).length, active ? 3 : 0);
      if (active) h.tick(16);
    }
  }
  stop();
  const gradients = h.stats().gradients;
  startSeasonalParticles(h.canvas, geometry, 'autumn', true, h.env)();
  assert.equal(h.stats().gradients, gradients);
  assert.equal(h.frames.size, 0);
  assert.ok(h.stats().clears > 0);
});
