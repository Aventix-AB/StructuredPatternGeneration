export type SizeUnit = "mm" | "in"
export type ResolutionUnit = "dpi" | "pxPerMm"

export interface PaperPreset {
    id: string
    label: string
    widthMm: number
    heightMm: number
}

export const CUSTOM_PRESET_ID = "custom"

export const PAPER_PRESETS: PaperPreset[] = [
    {
        id: "microplate",
        label: "Microplate (127.76 x 85.48 mm)",
        widthMm: 127.76,
        heightMm: 85.48,
    },
    { id: "a4-portrait", label: "A4 Portrait", widthMm: 210, heightMm: 297 },
    { id: "a4-landscape", label: "A4 Landscape", widthMm: 297, heightMm: 210 },
    { id: "a5-portrait", label: "A5 Portrait", widthMm: 148, heightMm: 210 },
    {
        id: "letter-portrait",
        label: "Letter Portrait",
        widthMm: 215.9,
        heightMm: 279.4,
    },
    {
        id: "letter-landscape",
        label: "Letter Landscape",
        widthMm: 279.4,
        heightMm: 215.9,
    },
]

export const MM_PER_INCH = 25.4

export function mmToInches(mm: number): number {
    return mm / MM_PER_INCH
}

export function inchesToMm(inches: number): number {
    return inches * MM_PER_INCH
}

export function mmToPx(mm: number, dpi: number): number {
    return Math.max(1, Math.round((mm / MM_PER_INCH) * dpi))
}

export function dpiToPxPerMm(dpi: number): number {
    return dpi / MM_PER_INCH
}

export function pxPerMmToDpi(pxPerMm: number): number {
    return pxPerMm * MM_PER_INCH
}

export function toDisplaySize(mm: number, unit: SizeUnit): number {
    return unit === "mm" ? mm : mmToInches(mm)
}

export function fromDisplaySize(value: number, unit: SizeUnit): number {
    return unit === "mm" ? value : inchesToMm(value)
}

export function findPresetById(id: string): PaperPreset | undefined {
    return PAPER_PRESETS.find((preset) => preset.id === id)
}
