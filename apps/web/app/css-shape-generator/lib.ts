export interface GradientStop {
  color: string;
  position: number;
}

function stopsCss(stops: GradientStop[]): string {
  return stops.map((s) => `${s.color} ${s.position}%`).join(", ");
}

export function buildLinearGradient(angleDeg: number, stops: GradientStop[]): string {
  return `linear-gradient(${angleDeg}deg, ${stopsCss(stops)})`;
}

export type RadialShape = "circle" | "ellipse";

export function buildRadialGradient(shape: RadialShape, position: string, stops: GradientStop[]): string {
  return `radial-gradient(${shape} at ${position}, ${stopsCss(stops)})`;
}

export interface BoxShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}

function layerCss(layer: BoxShadowLayer): string {
  const parts = [`${layer.x}px`, `${layer.y}px`, `${layer.blur}px`, `${layer.spread}px`, layer.color];
  return layer.inset ? `inset ${parts.join(" ")}` : parts.join(" ");
}

export function buildBoxShadow(layers: BoxShadowLayer[]): string {
  return layers.map(layerCss).join(", ");
}

export interface CircleClipPath {
  radius: number;
  x: number;
  y: number;
}

export function buildCircleClipPath({ radius, x, y }: CircleClipPath): string {
  return `circle(${radius}% at ${x}% ${y}%)`;
}

export interface EllipseClipPath {
  rx: number;
  ry: number;
  x: number;
  y: number;
}

export function buildEllipseClipPath({ rx, ry, x, y }: EllipseClipPath): string {
  return `ellipse(${rx}% ${ry}% at ${x}% ${y}%)`;
}

export interface InsetClipPath {
  top: number;
  right: number;
  bottom: number;
  left: number;
  round: number;
}

export function buildInsetClipPath({ top, right, bottom, left, round }: InsetClipPath): string {
  const base = `inset(${top}% ${right}% ${bottom}% ${left}%`;
  return round > 0 ? `${base} round ${round}px)` : `${base})`;
}

export function buildPolygonClipPath(points: string): string {
  return `polygon(${points})`;
}

// Fixed point lists for common shapes — free-form point editing would need a
// drag-to-place canvas, out of scope here; presets cover the shapes people
// actually reach for a clip-path generator to avoid hand-computing.
export const POLYGON_PRESETS: { name: string; points: string }[] = [
  { name: "Triangle", points: "50% 0%, 0% 100%, 100% 100%" },
  { name: "Rhombus", points: "50% 0%, 100% 50%, 50% 100%, 0% 50%" },
  { name: "Trapezoid", points: "20% 0%, 80% 0%, 100% 100%, 0% 100%" },
  { name: "Parallelogram", points: "25% 0%, 100% 0%, 75% 100%, 0% 100%" },
  { name: "Pentagon", points: "50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%" },
  { name: "Hexagon", points: "25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%" },
  {
    name: "Star",
    points:
      "50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%",
  },
  { name: "Arrow (right)", points: "0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%" },
  { name: "Message bubble", points: "0% 0%, 100% 0%, 100% 75%, 25% 75%, 12% 100%, 12% 75%, 0% 75%" },
  { name: "Cross", points: "35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%" },
];
