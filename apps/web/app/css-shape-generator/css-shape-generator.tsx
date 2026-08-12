"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  POLYGON_PRESETS,
  buildBoxShadow,
  buildCircleClipPath,
  buildEllipseClipPath,
  buildInsetClipPath,
  buildLinearGradient,
  buildPolygonClipPath,
  buildRadialGradient,
  type BoxShadowLayer,
  type GradientStop,
  type RadialShape,
} from "./lib";

const TABS = ["Gradient", "Box Shadow", "Clip Path"] as const;
type Tab = (typeof TABS)[number];

const RADIAL_POSITIONS = ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"];

function numberField() {
  return "w-20 rounded-md border border-border bg-secondary px-2 py-1 text-sm text-secondary-foreground";
}

function CopyCssButton({ css }: { css: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      {copied ? "Copied!" : "Copy CSS"}
    </button>
  );
}

export function CssShapeGenerator() {
  const [tab, setTab] = useState<Tab>("Gradient");

  // --- Gradient state ---
  const [gradientType, setGradientType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(90);
  const [radialShape, setRadialShape] = useState<RadialShape>("circle");
  const [radialPosition, setRadialPosition] = useState("center");
  const [stops, setStops] = useState<GradientStop[]>([
    { color: "#6366f1", position: 0 },
    { color: "#ec4899", position: 100 },
  ]);

  const updateStop = (i: number, patch: Partial<GradientStop>) =>
    setStops((s) => s.map((stop, idx) => (idx === i ? { ...stop, ...patch } : stop)));
  const addStop = () => setStops((s) => [...s, { color: "#ffffff", position: 50 }]);
  const removeStop = (i: number) => setStops((s) => (s.length > 2 ? s.filter((_, idx) => idx !== i) : s));

  const gradientValue = useMemo(
    () => (gradientType === "linear" ? buildLinearGradient(angle, stops) : buildRadialGradient(radialShape, radialPosition, stops)),
    [gradientType, angle, radialShape, radialPosition, stops],
  );
  const gradientCss = `background: ${gradientValue};`;

  // --- Box shadow state ---
  const [layers, setLayers] = useState<BoxShadowLayer[]>([
    { x: 0, y: 4, blur: 12, spread: 0, color: "rgba(0, 0, 0, 0.35)", inset: false },
  ]);

  const updateLayer = (i: number, patch: Partial<BoxShadowLayer>) =>
    setLayers((l) => l.map((layer, idx) => (idx === i ? { ...layer, ...patch } : layer)));
  const addLayer = () => setLayers((l) => [...l, { x: 0, y: 4, blur: 12, spread: 0, color: "rgba(0, 0, 0, 0.35)", inset: false }]);
  const removeLayer = (i: number) => setLayers((l) => (l.length > 1 ? l.filter((_, idx) => idx !== i) : l));

  const shadowValue = useMemo(() => buildBoxShadow(layers), [layers]);
  const shadowCss = `box-shadow: ${shadowValue};`;

  // --- Clip path state ---
  const [clipType, setClipType] = useState<"circle" | "ellipse" | "inset" | "polygon">("polygon");
  const [circleRadius, setCircleRadius] = useState(50);
  const [circleX, setCircleX] = useState(50);
  const [circleY, setCircleY] = useState(50);
  const [ellipseRx, setEllipseRx] = useState(50);
  const [ellipseRy, setEllipseRy] = useState(40);
  const [ellipseX, setEllipseX] = useState(50);
  const [ellipseY, setEllipseY] = useState(50);
  const [insetTop, setInsetTop] = useState(10);
  const [insetRight, setInsetRight] = useState(10);
  const [insetBottom, setInsetBottom] = useState(10);
  const [insetLeft, setInsetLeft] = useState(10);
  const [insetRound, setInsetRound] = useState(0);
  const [polygonPreset, setPolygonPreset] = useState(POLYGON_PRESETS[0].name);

  const clipValue = useMemo(() => {
    if (clipType === "circle") return buildCircleClipPath({ radius: circleRadius, x: circleX, y: circleY });
    if (clipType === "ellipse") return buildEllipseClipPath({ rx: ellipseRx, ry: ellipseRy, x: ellipseX, y: ellipseY });
    if (clipType === "inset") return buildInsetClipPath({ top: insetTop, right: insetRight, bottom: insetBottom, left: insetLeft, round: insetRound });
    const preset = POLYGON_PRESETS.find((p) => p.name === polygonPreset) ?? POLYGON_PRESETS[0];
    return buildPolygonClipPath(preset.points);
  }, [clipType, circleRadius, circleX, circleY, ellipseRx, ellipseRy, ellipseX, ellipseY, insetTop, insetRight, insetBottom, insetLeft, insetRound, polygonPreset]);
  const clipCss = `clip-path: ${clipValue};`;

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          CSS Gradient / Box-Shadow / Clip-Path Generator
        </h1>
        <p className="mt-2 text-muted-foreground">
          Build gradients, shadows, and clip-path shapes with a live preview, then copy the CSS.
        </p>

        <div className="mt-6 flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Gradient" && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex gap-1">
              {(["linear", "radial"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGradientType(type)}
                  className={`rounded-md border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    gradientType === type
                      ? "border-primary/50 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {gradientType === "linear" ? (
              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                Angle
                <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="flex-1" />
                <span className={numberField()}>{angle}°</span>
              </label>
            ) : (
              <div className="flex items-center gap-3">
                <select
                  className="rounded-md border border-border bg-secondary px-2 py-1 text-sm text-secondary-foreground"
                  value={radialShape}
                  onChange={(e) => setRadialShape(e.target.value as RadialShape)}
                >
                  <option value="circle">Circle</option>
                  <option value="ellipse">Ellipse</option>
                </select>
                <select
                  className="rounded-md border border-border bg-secondary px-2 py-1 text-sm text-secondary-foreground"
                  value={radialPosition}
                  onChange={(e) => setRadialPosition(e.target.value)}
                >
                  {RADIAL_POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Color stops</span>
              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={stop.color} onChange={(e) => updateStop(i, { color: e.target.value })} className="h-8 w-10 rounded border border-border bg-secondary" />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={stop.position}
                    onChange={(e) => updateStop(i, { position: Number(e.target.value) })}
                    className={numberField()}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <button
                    type="button"
                    onClick={() => removeStop(i)}
                    disabled={stops.length <= 2}
                    className="ml-auto text-xs text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addStop}
                className="self-start rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                + Add stop
              </button>
            </div>

            <div className="h-40 w-full rounded-md border border-border" style={{ background: gradientValue }} />

            <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2">
              <code className="overflow-x-auto whitespace-nowrap font-mono text-xs text-secondary-foreground">{gradientCss}</code>
              <CopyCssButton css={gradientCss} />
            </div>
          </div>
        )}

        {tab === "Box Shadow" && (
          <div className="mt-6 flex flex-col gap-4">
            {layers.map((layer, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    X
                    <input type="number" value={layer.x} onChange={(e) => updateLayer(i, { x: Number(e.target.value) })} className={numberField()} />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    Y
                    <input type="number" value={layer.y} onChange={(e) => updateLayer(i, { y: Number(e.target.value) })} className={numberField()} />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    Blur
                    <input type="number" min={0} value={layer.blur} onChange={(e) => updateLayer(i, { blur: Number(e.target.value) })} className={numberField()} />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    Spread
                    <input type="number" value={layer.spread} onChange={(e) => updateLayer(i, { spread: Number(e.target.value) })} className={numberField()} />
                  </label>
                  <input
                    type="text"
                    value={layer.color}
                    onChange={(e) => updateLayer(i, { color: e.target.value })}
                    className="w-36 rounded-md border border-border bg-secondary px-2 py-1 text-sm text-secondary-foreground"
                  />
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input type="checkbox" checked={layer.inset} onChange={(e) => updateLayer(i, { inset: e.target.checked })} />
                    Inset
                  </label>
                  <button
                    type="button"
                    onClick={() => removeLayer(i)}
                    disabled={layers.length <= 1}
                    className="ml-auto text-xs text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addLayer}
              className="self-start rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              + Add shadow layer
            </button>

            <div className="flex h-40 w-full items-center justify-center rounded-md border border-border bg-card">
              <div className="h-20 w-20 rounded-md bg-secondary" style={{ boxShadow: shadowValue }} />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2">
              <code className="overflow-x-auto whitespace-nowrap font-mono text-xs text-secondary-foreground">{shadowCss}</code>
              <CopyCssButton css={shadowCss} />
            </div>
          </div>
        )}

        {tab === "Clip Path" && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap gap-1">
              {(["polygon", "circle", "ellipse", "inset"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setClipType(type)}
                  className={`rounded-md border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    clipType === type
                      ? "border-primary/50 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {clipType === "polygon" && (
              <select
                className="rounded-md border border-border bg-secondary px-2 py-1 text-sm text-secondary-foreground"
                value={polygonPreset}
                onChange={(e) => setPolygonPreset(e.target.value)}
              >
                {POLYGON_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {clipType === "circle" && (
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Radius
                  <input type="number" min={0} max={100} value={circleRadius} onChange={(e) => setCircleRadius(Number(e.target.value))} className={numberField()} />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  X
                  <input type="number" min={0} max={100} value={circleX} onChange={(e) => setCircleX(Number(e.target.value))} className={numberField()} />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Y
                  <input type="number" min={0} max={100} value={circleY} onChange={(e) => setCircleY(Number(e.target.value))} className={numberField()} />
                </label>
              </div>
            )}

            {clipType === "ellipse" && (
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  RX
                  <input type="number" min={0} max={100} value={ellipseRx} onChange={(e) => setEllipseRx(Number(e.target.value))} className={numberField()} />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  RY
                  <input type="number" min={0} max={100} value={ellipseRy} onChange={(e) => setEllipseRy(Number(e.target.value))} className={numberField()} />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  X
                  <input type="number" min={0} max={100} value={ellipseX} onChange={(e) => setEllipseX(Number(e.target.value))} className={numberField()} />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Y
                  <input type="number" min={0} max={100} value={ellipseY} onChange={(e) => setEllipseY(Number(e.target.value))} className={numberField()} />
                </label>
              </div>
            )}

            {clipType === "inset" && (
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Top
                  <input type="number" min={0} max={100} value={insetTop} onChange={(e) => setInsetTop(Number(e.target.value))} className={numberField()} />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Right
                  <input type="number" min={0} max={100} value={insetRight} onChange={(e) => setInsetRight(Number(e.target.value))} className={numberField()} />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Bottom
                  <input type="number" min={0} max={100} value={insetBottom} onChange={(e) => setInsetBottom(Number(e.target.value))} className={numberField()} />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Left
                  <input type="number" min={0} max={100} value={insetLeft} onChange={(e) => setInsetLeft(Number(e.target.value))} className={numberField()} />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Round
                  <input type="number" min={0} value={insetRound} onChange={(e) => setInsetRound(Number(e.target.value))} className={numberField()} />
                </label>
              </div>
            )}

            <div
              className="h-40 w-full bg-gradient-to-br from-primary to-accent-purple"
              style={{ clipPath: clipValue }}
            />

            <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2">
              <code className="overflow-x-auto whitespace-nowrap font-mono text-xs text-secondary-foreground">{clipCss}</code>
              <CopyCssButton css={clipCss} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
