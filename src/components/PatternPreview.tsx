import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mmToInches } from "@/lib/units";

const RULER_SIZE = 22; // px — ruler strip thickness

// ---------------------------------------------------------------------------
// Ruler tick spacing
// ---------------------------------------------------------------------------

function getTickSpacing(lengthMm: number): { major: number; minor: number } {
  if (lengthMm <= 50) return { major: 10, minor: 5 };
  if (lengthMm <= 120) return { major: 20, minor: 5 };
  if (lengthMm <= 350) return { major: 50, minor: 10 };
  return { major: 100, minor: 25 };
}

// ---------------------------------------------------------------------------
// Canvas ruler draw helpers
// ---------------------------------------------------------------------------

const RULER_BG = "hsl(0,0%,96%)";
const TICK_MAJOR = "hsl(0,0%,36%)";
const TICK_MINOR = "hsl(0,0%,72%)";
const BORDER = "hsl(0,0%,84%)";

function drawHRuler(
  canvas: HTMLCanvasElement,
  lengthMm: number,
  w: number,
  h: number,
): void {
  if (w <= 0 || h <= 0) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = RULER_BG;
  ctx.fillRect(0, 0, w, h);

  const { major, minor } = getTickSpacing(lengthMm);

  for (let mm = 0; mm <= lengthMm; mm += minor) {
    const x = (mm / lengthMm) * w;
    const isMajor = mm % major === 0;
    const tickH = isMajor ? h * 0.52 : h * 0.28;

    ctx.strokeStyle = isMajor ? TICK_MAJOR : TICK_MINOR;
    ctx.lineWidth = isMajor ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x, h - tickH);
    ctx.stroke();

    if (isMajor) {
      ctx.fillStyle = TICK_MAJOR;
      ctx.font = `9px system-ui, sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign =
        mm === 0 ? "left" : mm >= lengthMm - major * 0.4 ? "right" : "center";
      ctx.fillText(String(mm), x, 1);
    }
  }

  // Bottom border
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h - 0.5);
  ctx.lineTo(w, h - 0.5);
  ctx.stroke();
}

function drawVRuler(
  canvas: HTMLCanvasElement,
  lengthMm: number,
  w: number,
  h: number,
): void {
  if (w <= 0 || h <= 0) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = RULER_BG;
  ctx.fillRect(0, 0, w, h);

  const { major, minor } = getTickSpacing(lengthMm);

  for (let mm = 0; mm <= lengthMm; mm += minor) {
    const y = (mm / lengthMm) * h;
    const isMajor = mm % major === 0;
    const tickW = isMajor ? w * 0.52 : w * 0.28;

    ctx.strokeStyle = isMajor ? TICK_MAJOR : TICK_MINOR;
    ctx.lineWidth = isMajor ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(w, y);
    ctx.lineTo(w - tickW, y);
    ctx.stroke();

    if (isMajor && mm > 0 && mm < lengthMm + major * 0.4) {
      // Rotated label reading downward along the ruler
      ctx.save();
      ctx.translate(w / 2, y);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = TICK_MAJOR;
      ctx.font = "8px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(mm), 0, -1);
      ctx.restore();
    }
  }

  // Right border
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w - 0.5, 0);
  ctx.lineTo(w - 0.5, h);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// PatternPreview component
// ---------------------------------------------------------------------------

export interface PatternPreviewProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  widthMm: number;
  heightMm: number;
  dpi: number;
  fullWidthPx: number;
  fullHeightPx: number;
  status: string;
  patternLabel: string;
  onSaveJpg: () => Promise<void>;
  onPrint: () => void;
}

export function PatternPreview({
  canvasRef,
  widthMm,
  heightMm,
  dpi,
  fullWidthPx,
  fullHeightPx,
  status,
  patternLabel,
  onSaveJpg,
  onPrint,
}: PatternPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hRulerRef = useRef<HTMLCanvasElement>(null);
  const vRulerRef = useRef<HTMLCanvasElement>(null);

  // Measure both width and height of the flex-1 container
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerSize({
        w: Math.floor(entry.contentRect.width),
        h: Math.floor(entry.contentRect.height),
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Fit canvas inside the measured container while preserving paper aspect ratio
  const aspectRatio = widthMm / heightMm;
  const availW = Math.max(1, containerSize.w - RULER_SIZE);
  const availH = Math.max(1, containerSize.h - RULER_SIZE);
  // Try width-constrained first; fall back to height-constrained
  const byWidthH = availW / aspectRatio;
  const [canvasW, canvasH] =
    byWidthH <= availH
      ? [Math.round(availW), Math.round(byWidthH)]
      : [Math.round(availH * aspectRatio), Math.round(availH)];

  // (Re-)draw rulers whenever dimensions or physical size changes
  useEffect(() => {
    if (hRulerRef.current && canvasW > 0) {
      drawHRuler(hRulerRef.current, widthMm, canvasW, RULER_SIZE);
    }
  }, [canvasW, widthMm]);

  useEffect(() => {
    if (vRulerRef.current && canvasH > 0) {
      drawVRuler(vRulerRef.current, heightMm, RULER_SIZE, canvasH);
    }
  }, [canvasH, heightMm]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Preview</CardTitle>
        <CardDescription>{patternLabel}</CardDescription>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground pt-1">
          <span>
            {widthMm.toFixed(1)} × {heightMm.toFixed(1)} mm
          </span>
          <span>
            {mmToInches(widthMm).toFixed(2)} × {mmToInches(heightMm).toFixed(2)}
             in
          </span>
          <span>{dpi.toFixed(0)} DPI</span>
          <span>
            {fullWidthPx} × {fullHeightPx} px
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 min-h-0">
        {/* Ruler + pattern canvas grid — grows to fill card, rulers+canvas fit inside */}
        <div ref={containerRef} className="flex-1 min-h-0 w-full">
          {containerSize.w > 0 && containerSize.h > 0 && (
            <div
              className="grid"
              style={{
                gridTemplateColumns: `${RULER_SIZE}px ${canvasW}px`,
                gridTemplateRows: `${RULER_SIZE}px ${canvasH}px`,
              }}
            >
              {/* Corner */}
              <div
                className="rounded-tl-sm"
                style={{
                  background: RULER_BG,
                  borderRight: `1px solid ${BORDER}`,
                  borderBottom: `1px solid ${BORDER}`,
                }}
              />

              {/* Horizontal ruler */}
              <canvas
                ref={hRulerRef}
                style={{ display: "block", width: canvasW, height: RULER_SIZE }}
              />

              {/* Vertical ruler */}
              <canvas
                ref={vRulerRef}
                style={{ display: "block", width: RULER_SIZE, height: canvasH }}
              />

              {/* Pattern canvas */}
              <div
                className="overflow-hidden border border-border bg-white"
                style={{ width: canvasW, height: canvasH }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    imageRendering: "pixelated",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void onSaveJpg()}>Save JPG</Button>
          <Button variant="outline" onClick={onPrint}>
            Print
          </Button>
        </div>

        {status ? <p className="text-sm text-destructive">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
