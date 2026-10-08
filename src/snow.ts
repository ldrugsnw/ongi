export const snowOptions = {
  count: 22,
  minRadius: 1.7,
  maxRadius: 5.6,
  minSpeed: 13,
  maxSpeed: 28,
  maxSway: 7,
};
export type SnowOptions = typeof snowOptions;
export { parsePolygon, containsPoint, containTransform } from './windowGeometry.ts';
export type { Point } from './windowGeometry.ts';
export type Snowflake = {
  baseX: number; y: number; radius: number; opacity: number; speed: number;
  sway: number; phase: number; frequency: number; near: boolean; sprite: number;
};
export function createFlakes(options = snowOptions, random = Math.random): Snowflake[] {
  return Array.from({ length: options.count }, (_, i) => {
    const depth = random();
    return {
      baseX: (i % 2 ? 1438 : 1190) + random() * (i % 2 ? 167 : 184),
      y: random() * 560 - 16,
      radius: options.minRadius + depth * (options.maxRadius - options.minRadius),
      opacity: .34 + depth * .44,
      speed: options.minSpeed + depth * (options.maxSpeed - options.minSpeed),
      sway: 2 + random() * Math.max(0, options.maxSway - 2),
      phase: random() * Math.PI * 2,
      frequency: .22 + random() * .24,
      near: depth > .65,
      sprite: i % 4,
    };
  });
}
export function advanceFlakes(flakes: Snowflake[], seconds: number) {
  // Clamp interruptions so returning to a suspended tab cannot cause a jump.
  const delta = Math.max(0, Math.min(seconds, .05));
  for (const flake of flakes) {
    flake.y += flake.speed * delta;
    flake.phase = (flake.phase + flake.frequency * delta) % (Math.PI * 2);
    if (flake.y > 550 + flake.radius) flake.y = -16 - flake.radius;
  }
}
export function flakeX(flake: Snowflake) { return flake.baseX + Math.sin(flake.phase) * flake.sway; }
