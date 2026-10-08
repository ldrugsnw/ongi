export type Point = { x: number; y: number };
export function parsePolygon(points: string): Point[] {
  return points.trim().split(/\s+/).map(pair => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  });
}
export function containsPoint(points: Point[], point: Point) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
export function containTransform(width: number, height: number, imageWidth: number, imageHeight: number) {
  const scale = Math.min(width / imageWidth, height / imageHeight);
  return { scale, x: (width - imageWidth * scale) / 2, y: (height - imageHeight * scale) / 2 };
}
