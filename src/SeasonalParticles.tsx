import { useEffect, useRef } from 'react';
import { scene } from './scene';
import { seasonalEffect, startSeasonalParticles } from './particleSeason.ts';

export function SeasonalParticles({ season, reduced }: { season: string; reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // React cleans up and clears the previous effect before starting the next one.
    return startSeasonalParticles(canvas, scene, season, reduced);
  }, [season, reduced]);
  return <canvas className="window-particles" ref={canvasRef} hidden={!seasonalEffect(season, reduced)} aria-hidden="true" />;
}
