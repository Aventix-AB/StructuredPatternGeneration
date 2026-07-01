import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RgbColorPicker } from "react-colorful";
import { PatternThumbnail } from "@/components/PatternThumbnail";
import {
  getPatternById,
  PATTERN_REGISTRY,
  type RgbColor,
} from "@/lib/patterns";
import {
  CUSTOM_FORMAT_ID,
  dpiToPxPerMm,
  fromDisplaySize,
  PAPER_FORMATS,
  pxPerMmToDpi,
  toDisplaySize,
  type ResolutionUnit,
  type SizeUnit,
} from "@/lib/units";

export interface PatternControlsProps {
  // Canvas config
  formatId: string;
  sizeUnit: SizeUnit;
  resolutionUnit: ResolutionUnit;
  widthMm: number;
  heightMm: number;
  dpi: number;
  seed: number;
  // Pattern config
  patternId: string;
  settingsMap: Record<string, Record<string, number | string>>;
  // Handlers
  onFormatChange: (id: string) => void;
  onSizeUnitChange: (unit: SizeUnit) => void;
  onResolutionUnitChange: (unit: ResolutionUnit) => void;
  onSizeChange: (displayValue: number, axis: "width" | "height") => void;
  onResolutionChange: (displayValue: number) => void;
  onSeedChange: (seed: number) => void;
  onPatternChange: (id: string) => void;
  onPatternSettingChange: (key: string, value: number | string) => void;
  // Colors
  color1: RgbColor;
  color2: RgbColor;
  onColor1Change: (color: RgbColor) => void;
  onColor2Change: (color: RgbColor) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50";

export function PatternControls({
  formatId,
  sizeUnit,
  resolutionUnit,
  widthMm,
  heightMm,
  dpi,
  seed,
  patternId,
  settingsMap,
  onFormatChange,
  onSizeUnitChange,
  onResolutionUnitChange,
  onSizeChange,
  onResolutionChange,
  onSeedChange,
  onPatternChange,
  onPatternSettingChange,
  color1,
  color2,
  onColor1Change,
  onColor2Change,
}: PatternControlsProps) {
  const widthDisplay = toDisplaySize(widthMm, sizeUnit);
  const heightDisplay = toDisplaySize(heightMm, sizeUnit);
  const resolutionDisplay = resolutionUnit === "dpi" ? dpi : dpiToPxPerMm(dpi);

  const isCustom = formatId === CUSTOM_FORMAT_ID;
  const activePattern = getPatternById(patternId);
  const activeSettings = settingsMap[patternId] ?? {};

  function handleSizeChange(
    e: React.ChangeEvent<HTMLInputElement>,
    axis: "width" | "height",
  ) {
    const raw = Number(e.target.value);
    const mmValue = Math.max(1, fromDisplaySize(raw, sizeUnit));
    onSizeChange(mmValue, axis);
  }

  function handleResolutionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Math.max(1, Number(e.target.value));
    onResolutionChange(resolutionUnit === "dpi" ? raw : pxPerMmToDpi(raw));
  }

  return (
    <div className="grid grid-cols-2 items-start gap-4">
      {/* Canvas settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Canvas Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Format">
            <Select value={formatId} onValueChange={onFormatChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAPER_FORMATS.map((format) => (
                  <SelectItem key={format.id} value={format.id}>
                    {format.label}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_FORMAT_ID}>Custom</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Size unit">
              <Select
                value={sizeUnit}
                onValueChange={(v) => onSizeUnitChange(v as SizeUnit)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">Millimeters</SelectItem>
                  <SelectItem value="in">Inches</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Resolution unit">
              <Select
                value={resolutionUnit}
                onValueChange={(v) =>
                  onResolutionUnitChange(v as ResolutionUnit)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dpi">DPI</SelectItem>
                  <SelectItem value="pxPerMm">px / mm</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Width (${sizeUnit})`}>
              <input
                className={inputClass}
                type="number"
                min={1}
                step={sizeUnit === "mm" ? 0.1 : 0.01}
                value={widthDisplay.toFixed(sizeUnit === "mm" ? 1 : 3)}
                onChange={(e) => handleSizeChange(e, "width")}
                disabled={!isCustom}
              />
            </Field>
            <Field label={`Height (${sizeUnit})`}>
              <input
                className={inputClass}
                type="number"
                min={1}
                step={sizeUnit === "mm" ? 0.1 : 0.01}
                value={heightDisplay.toFixed(sizeUnit === "mm" ? 1 : 3)}
                onChange={(e) => handleSizeChange(e, "height")}
                disabled={!isCustom}
              />
            </Field>
          </div>

          <Field
            label={
              resolutionUnit === "dpi"
                ? "Resolution (DPI)"
                : "Resolution (px/mm)"
            }
          >
            <input
              className={inputClass}
              type="number"
              min={1}
              step={resolutionUnit === "dpi" ? 1 : 0.01}
              value={resolutionDisplay.toFixed(
                resolutionUnit === "dpi" ? 0 : 3,
              )}
              onChange={handleResolutionChange}
            />
          </Field>

          <Field label="Seed">
            <input
              className={inputClass}
              type="number"
              value={seed}
              onChange={(e) =>
                onSeedChange(Math.trunc(Number(e.target.value) || 0))
              }
            />
          </Field>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <FieldLabel>Foreground</FieldLabel>
              <div
                className="h-3.5 w-3.5 flex-none rounded-sm border border-border"
                style={{
                  background: `rgb(${color1.r},${color1.g},${color1.b})`,
                }}
              />
            </div>
            <RgbColorPicker
              color={color1}
              onChange={onColor1Change}
              style={{ width: "100%" }}
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <FieldLabel>Background</FieldLabel>
              <div
                className="h-3.5 w-3.5 flex-none rounded-sm border border-border"
                style={{
                  background: `rgb(${color2.r},${color2.g},${color2.b})`,
                }}
              />
            </div>
            <RgbColorPicker
              color={color2}
              onChange={onColor2Change}
              style={{ width: "100%" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pattern settings */}
      <Card className="col-span-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pattern</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Pattern type">
            <Select value={patternId} onValueChange={onPatternChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PATTERN_REGISTRY.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <PatternThumbnail src={p.thumbnail} alt={p.label} />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {activePattern ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {activePattern.description}
              </p>

              {activePattern.controls.map((control) => {
                const rawValue = activeSettings[control.id];

                if (control.type === "number") {
                  // Values with unit:"mm" are stored in mm internally; convert to display unit
                  const isMm = control.unit === "mm";
                  const storedValue =
                    typeof rawValue === "number" ? rawValue : control.min;
                  const dispValue = isMm
                    ? toDisplaySize(storedValue, sizeUnit)
                    : storedValue;
                  const dispMin = isMm
                    ? toDisplaySize(control.min, sizeUnit)
                    : control.min;
                  const dispMax = isMm
                    ? toDisplaySize(control.max, sizeUnit)
                    : control.max;
                  const dispStep = isMm
                    ? toDisplaySize(control.step, sizeUnit)
                    : control.step;
                  const label = isMm
                    ? `${control.label} (${sizeUnit})`
                    : control.label;
                  // Decimal places driven by step; cap at 4 to avoid scientific notation noise
                  const decimals =
                    dispStep < 1
                      ? Math.min(4, String(dispStep).split(".")[1]?.length ?? 2)
                      : 0;

                  function commitChange(raw: number) {
                    const mmValue = isMm ? fromDisplaySize(raw, sizeUnit) : raw;
                    onPatternSettingChange(control.id, mmValue);
                  }

                  return (
                    <div key={control.id} className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <FieldLabel>{label}</FieldLabel>
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {dispValue.toFixed(decimals)}
                        </span>
                      </div>
                      <input
                        type="range"
                        className="w-full accent-primary"
                        min={dispMin}
                        max={dispMax}
                        step={dispStep}
                        value={dispValue}
                        onChange={(e) => commitChange(Number(e.target.value))}
                      />
                      <input
                        className={inputClass}
                        type="number"
                        min={dispMin}
                        max={dispMax}
                        step={dispStep}
                        value={dispValue.toFixed(decimals)}
                        onChange={(e) => commitChange(Number(e.target.value))}
                      />
                    </div>
                  );
                }

                const value =
                  typeof rawValue === "string"
                    ? rawValue
                    : (control.options[0]?.value ?? "");
                return (
                  <Field key={control.id} label={control.label}>
                    <Select
                      value={value}
                      onValueChange={(v) =>
                        onPatternSettingChange(control.id, v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {control.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
