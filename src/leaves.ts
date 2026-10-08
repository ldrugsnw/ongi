export const leafOptions = {
  count: 12,
  minRadius: 8,
  maxRadius: 19,
  minSpeed: 8,
  maxSpeed: 17,
  maxSway: 16,
};
export type LeafOptions = typeof leafOptions;
export type Leaf = {
  originX: number; x: number; y: number; radius: number; opacity: number; speed: number;
  sway: number; phase: number; frequency: number; drift: number; angle: number; spin: number;
  near: boolean; sprite: number;
};
export function createLeaves(options = leafOptions, random = Math.random): Leaf[] {
  return Array.from({ length: options.count }, (_, i) => {
    const depth = random();
    const x = (i % 2 ? 1444 : 1196) + random() * (i % 2 ? 150 : 170);
    return {
      originX: x, x, y: random() * 550 - 16,
      radius: options.minRadius + depth * (options.maxRadius - options.minRadius),
      opacity: .28 + depth * .48,
      speed: options.minSpeed + depth * (options.maxSpeed - options.minSpeed),
      sway: options.maxSway * (.35 + random() * .65),
      phase: random() * Math.PI * 2,
      frequency: .15 + random() * .16,
      drift: i % 3 === 0 ? (i % 2 ? -1 : 1) * (1.5 + random() * 1.5) : 0,
      angle: random() * Math.PI * 2,
      spin: (i % 2 ? -1 : 1) * (.07 + random() * .1),
      near: depth > .6,
      sprite: i % 8,
    };
  });
}
export function advanceLeaves(leaves: Leaf[], seconds: number) {
  const delta = Math.max(0, Math.min(seconds, .05));
  for (const leaf of leaves) {
    leaf.y += leaf.speed * delta;
    leaf.x += leaf.drift * delta;
    leaf.phase = (leaf.phase + leaf.frequency * delta) % (Math.PI * 2);
    leaf.angle += leaf.spin * delta;
    // Reset only beyond every glass pane, where clipping already hides the leaf.
    if (leaf.y > 550 + leaf.radius || leaf.x < 1150 - leaf.radius * 2 || leaf.x > 1650 + leaf.radius * 2) {
      leaf.y = -16 - leaf.radius * 2;
      leaf.x = leaf.originX;
    }
  }
}
export function leafX(leaf: Leaf) { return leaf.x + Math.sin(leaf.phase) * leaf.sway; }
