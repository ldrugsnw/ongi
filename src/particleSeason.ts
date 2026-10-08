import { startSnow } from './snowRenderer.ts';
import { startLeaves } from './leafRenderer.ts';
import type { Geometry, ParticleEnvironment } from './windowParticles.ts';

export function seasonalEffect(season: string, reduced: boolean): 'snow' | 'leaves' | null {
  if (reduced) return null;
  if (season === 'snowy-winter') return 'snow';
  if (season === 'autumn') return 'leaves';
  return null;
}
export function startSeasonalParticles(canvas: HTMLCanvasElement, geometry: Geometry, season: string, reduced: boolean, env?: ParticleEnvironment) {
  const effect = seasonalEffect(season, reduced);
  if (effect === 'snow') return startSnow(canvas, geometry, undefined, env);
  if (effect === 'leaves') return startLeaves(canvas, geometry, undefined, env);
  return () => {};
}
