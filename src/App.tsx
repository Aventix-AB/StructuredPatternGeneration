import { useEffect, useMemo, useRef, useState } from "react";

import { PatternControls } from "@/components/PatternControls";
import { PatternPreview } from "@/components/PatternPreview";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { downloadCanvasAsJpeg, printCanvas } from "@/lib/export";
import {
  createDefaultSettingsMap,
  getPatternById,
  renderPatternById,
} from "@/lib/patterns";
import {
  createCanvasFromImageData,
  grayscaleToImageData,
} from "@/lib/patterns/render";
import {
  CUSTOM_PRESET_ID,
  findPresetById,
  mmToPx,
  type ResolutionUnit,
  type SizeUnit,
} from "@/lib/units";

import "./App.css";

const MAX_PREVIEW_PIXELS = 1_600_000;

function App() {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [presetId, setPresetId] = useState<string>("a4-portrait");
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>("mm");
  const [resolutionUnit, setResolutionUnit] = useState<ResolutionUnit>("dpi");
  const [widthMm, setWidthMm] = useState<number>(210);
  const [heightMm, setHeightMm] = useState<number>(297);
  const [dpi, setDpi] = useState<number>(300);

  const [patternId, setPatternId] = useState<string>("speckle");
  const [seed, setSeed] = useState<number>(42);
  const [settingsMap, setSettingsMap] = useState<
    Record<string, Record<string, number | string>>
  >(createDefaultSettingsMap);
  const [status, setStatus] = useState<string>("");

  const activePattern = getPatternById(patternId);

  const fullWidthPx = useMemo(() => mmToPx(widthMm, dpi), [widthMm, dpi]);
  const fullHeightPx = useMemo(() => mmToPx(heightMm, dpi), [heightMm, dpi]);

  const previewSize = useMemo(() => {
    const total = fullWidthPx * fullHeightPx;
    if (total <= MAX_PREVIEW_PIXELS) {
      return { widthPx: fullWidthPx, heightPx: fullHeightPx, previewDpi: dpi };
    }
    const scale = Math.sqrt(MAX_PREVIEW_PIXELS / total);
    return {
      widthPx: Math.max(1, Math.round(fullWidthPx * scale)),
      heightPx: Math.max(1, Math.round(fullHeightPx * scale)),
      previewDpi: Math.max(20, dpi * scale),
    };
  }, [dpi, fullWidthPx, fullHeightPx]);

  // Re-render preview whenever relevant state changes
  useEffect(() => {
    if (!activePattern || !previewCanvasRef.current) return;
    try {
      const grayscale = renderPatternById(
        patternId,
        {
          widthPx: previewSize.widthPx,
          heightPx: previewSize.heightPx,
          dpi: previewSize.previewDpi,
          seed,
        },
        settingsMap,
      );
      const imageData = grayscaleToImageData(
        previewSize.widthPx,
        previewSize.heightPx,
        grayscale,
      );
      const canvas = previewCanvasRef.current;
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.putImageData(imageData, 0, 0);
      setStatus("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Render failed.");
    }
  }, [
    activePattern,
    patternId,
    previewSize.heightPx,
    previewSize.previewDpi,
    previewSize.widthPx,
    seed,
    settingsMap,
  ]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handlePresetChange(id: string): void {
    setPresetId(id);
    if (id === CUSTOM_PRESET_ID) return;
    const preset = findPresetById(id);
    if (!preset) return;
    setWidthMm(preset.widthMm);
    setHeightMm(preset.heightMm);
  }

  function handleSizeChange(mmValue: number, axis: "width" | "height"): void {
    if (axis === "width") setWidthMm(mmValue);
    else setHeightMm(mmValue);
    // Any manual size edit switches to custom preset
    setPresetId(CUSTOM_PRESET_ID);
  }

  function handleResolutionChange(newDpi: number): void {
    setDpi(Math.max(1, newDpi));
  }

  function handlePatternSettingChange(
    key: string,
    value: number | string,
  ): void {
    setSettingsMap((prev) => ({
      ...prev,
      [patternId]: { ...prev[patternId], [key]: value },
    }));
  }

  function renderFullRes(): HTMLCanvasElement {
    const grayscale = renderPatternById(
      patternId,
      { widthPx: fullWidthPx, heightPx: fullHeightPx, dpi, seed },
      settingsMap,
    );
    const imageData = grayscaleToImageData(
      fullWidthPx,
      fullHeightPx,
      grayscale,
    );
    return createCanvasFromImageData(imageData);
  }

  async function handleSaveJpg(): Promise<void> {
    try {
      const canvas = renderFullRes();
      const fileName = `${patternId}_${Math.round(widthMm)}x${Math.round(heightMm)}mm_${Math.round(dpi)}dpi.jpg`;
      await downloadCanvasAsJpeg(canvas, fileName);
      setStatus("Saved JPG successfully.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed.");
    }
  }

  function handlePrint(): void {
    try {
      printCanvas(
        renderFullRes(),
        `${activePattern?.label ?? "Pattern"} Print Preview`,
      );
      setStatus("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Print failed.");
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left – controls (fixed width, scrollable) */}
        <aside className="w-80 flex-none overflow-y-auto border-r p-4">
          <PatternControls
            presetId={presetId}
            sizeUnit={sizeUnit}
            resolutionUnit={resolutionUnit}
            widthMm={widthMm}
            heightMm={heightMm}
            dpi={dpi}
            seed={seed}
            patternId={patternId}
            settingsMap={settingsMap}
            onPresetChange={handlePresetChange}
            onSizeUnitChange={setSizeUnit}
            onResolutionUnitChange={setResolutionUnit}
            onSizeChange={handleSizeChange}
            onResolutionChange={handleResolutionChange}
            onSeedChange={setSeed}
            onPatternChange={setPatternId}
            onPatternSettingChange={handlePatternSettingChange}
          />
        </aside>

        {/* Right – preview (fills remaining space, no scroll) */}
        <main className="min-w-0 flex-1 overflow-hidden flex flex-col p-4">
          <PatternPreview
            canvasRef={previewCanvasRef}
            widthMm={widthMm}
            heightMm={heightMm}
            dpi={dpi}
            fullWidthPx={fullWidthPx}
            fullHeightPx={fullHeightPx}
            status={status}
            patternLabel={activePattern?.label ?? ""}
            onSaveJpg={handleSaveJpg}
            onPrint={handlePrint}
          />
        </main>
      </div>

      <AppFooter />
    </div>
  );
}

export default App;
