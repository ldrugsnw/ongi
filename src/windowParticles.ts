import { containTransform, parsePolygon } from './windowGeometry.ts';

export type Geometry = { width: number; height: number; panes: string[]; foreground: string[] };
export type ParticleEnvironment = {
  createCanvas: () => HTMLCanvasElement;
  createPath: () => Path2D;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
  observeSize: (callback: () => void) => () => void;
  onResize: (callback: () => void) => () => void;
  onVisibility: (callback: () => void) => () => void;
  hidden: () => boolean;
  pixelRatio: () => number;
};
function browserEnvironment(canvas: HTMLCanvasElement): ParticleEnvironment {
  return {
    createCanvas: () => document.createElement('canvas'), createPath: () => new Path2D(),
    requestFrame: callback => requestAnimationFrame(callback), cancelFrame: id => cancelAnimationFrame(id),
    observeSize: callback => { const observer = new ResizeObserver(callback); observer.observe(canvas); return () => observer.disconnect(); },
    onResize: callback => { window.addEventListener('resize', callback); return () => window.removeEventListener('resize', callback); },
    onVisibility: callback => { document.addEventListener('visibilitychange', callback); return () => document.removeEventListener('visibilitychange', callback); },
    hidden: () => document.hidden, pixelRatio: () => window.devicePixelRatio || 1,
  };
}
function addPolygon(path: Path2D, coordinates: string) {
  const points = parsePolygon(coordinates);
  path.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(point => path.lineTo(point.x, point.y));
  path.closePath();
}

export type ParticlePainter = { advance: (seconds: number) => void; draw: (ctx: CanvasRenderingContext2D) => void };
export function startWindowParticles(canvas: HTMLCanvasElement, geometry: Geometry, setup: (env: ParticleEnvironment) => ParticlePainter, env = browserEnvironment(canvas)) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  // Reuse original-image masks and one frame/resize lifecycle for each effect.
  const panes = env.createPath();
  geometry.panes.forEach(points => addPolygon(panes, points));
  const indoors = env.createPath();
  indoors.rect(0, 0, geometry.width, geometry.height);
  geometry.foreground.forEach(points => addPolygon(indoors, points));
  const painter = setup(env);
  let frame: number | null = null;
  let stopped = false;
  let lastTime: number | null = null;
  let transform = { scale: 1, x: 0, y: 0 };
  let pixelRatio = 1;

  function draw() {
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.save();
    ctx!.setTransform(transform.scale * pixelRatio, 0, 0, transform.scale * pixelRatio, transform.x * pixelRatio, transform.y * pixelRatio);
    ctx!.clip(panes);
    ctx!.clip(indoors, 'evenodd');
    painter.draw(ctx!);
    ctx!.restore();
  }
  function resize() {
    if (stopped) return;
    const box = canvas.getBoundingClientRect();
    pixelRatio = Math.min(2, Math.max(1, env.pixelRatio()));
    canvas.width = Math.max(1, Math.round(box.width * pixelRatio));
    canvas.height = Math.max(1, Math.round(box.height * pixelRatio));
    transform = containTransform(box.width, box.height, geometry.width, geometry.height);
    draw();
  }
  function animate(time: number) {
    frame = null;
    if (stopped || env.hidden()) return;
    if (lastTime !== null) painter.advance((time - lastTime) / 1000);
    lastTime = time;
    draw();
    frame = env.requestFrame(animate);
  }
  function visibility() {
    if (frame !== null) env.cancelFrame(frame);
    frame = null;
    lastTime = null;
    if (!stopped && !env.hidden()) frame = env.requestFrame(animate);
  }
  resize();
  const stopObserving = env.observeSize(resize);
  const stopResize = env.onResize(resize);
  const stopVisibility = env.onVisibility(visibility);
  visibility();
  return () => {
    stopped = true;
    if (frame !== null) env.cancelFrame(frame);
    stopObserving(); stopResize(); stopVisibility();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
