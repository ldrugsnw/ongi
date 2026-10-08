import type { ParticleEnvironment, Geometry } from '../src/windowParticles.ts';
export function particleHarness() {
  let hidden = false, frameId = 0, gradients = 0, draws = 0, clears = 0;
  let width = 834, height = 469.4;
  const frames = new Map<number, FrameRequestCallback>();
  const callbacks: Record<string, () => void> = {};
  const disposed: string[] = [];
  const clips: { path: unknown; rule: string }[] = [];
  const matrices: number[][] = [];
  const context = new Proxy({
    createRadialGradient() { gradients++; return { addColorStop() {} }; },
    createLinearGradient() { gradients++; return { addColorStop() {} }; },
    drawImage() { draws++; }, clearRect() { clears++; },
    setTransform(...values: number[]) { matrices.push(values); },
    clip(path: unknown, rule?: string) { clips.push({ path, rule: rule ?? 'nonzero' }); },
  }, { get(target, key) { return key in target ? target[key as keyof typeof target] : () => {}; } });
  const canvas = {
    width: 0, height: 0, getContext: () => context,
    getBoundingClientRect: () => ({ width, height }),
  } as unknown as HTMLCanvasElement;
  const subscribe = (key: string, callback: () => void) => { callbacks[key] = callback; return () => { disposed.push(key); delete callbacks[key]; }; };
  const env: ParticleEnvironment = {
    createCanvas: () => ({ getContext: () => context }) as unknown as HTMLCanvasElement,
    createPath: () => ({ moveTo() {}, lineTo() {}, closePath() {}, rect() {} }) as unknown as Path2D,
    requestFrame(callback) { const id = ++frameId; frames.set(id, callback); return id; },
    cancelFrame(id) { frames.delete(id); },
    observeSize: callback => subscribe('observer', callback), onResize: callback => subscribe('resize', callback),
    onVisibility: callback => subscribe('visibility', callback), hidden: () => hidden, pixelRatio: () => 2,
  };
  return {
    canvas, env, frames, callbacks, disposed, clips, matrices,
    stats: () => ({ gradients, draws, clears }),
    tick(time: number) { const [id, callback] = [...frames.entries()][0]; frames.delete(id); callback(time); },
    visibility(value: boolean) { hidden = value; callbacks.visibility(); },
    resize(w: number, h: number) { width = w; height = h; callbacks.observer(); },
  };
}
export const geometry: Geometry = {
  width: 1672, height: 941,
  panes: ['1180,0 1383,0 1383,147 1180,189', '1427,0 1617,0 1617,99 1427,140', '1181,222 1382,180 1382,481 1181,453', '1427,173 1617,132 1617,516 1427,489'],
  foreground: ['1160,0 1234,0 1234,45 1279,68 1318,126 1280,149 1160,158'],
};
