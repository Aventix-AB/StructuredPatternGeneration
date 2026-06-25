export type SizeUnit = "mm" | "in"
export type ResolutionUnit = "dpi" | "pxPerMm"

export const PAPER_FORMAT_ID = {
    CUSTOM: "custom",
    MICROPLATE: "microplate",
    A4_PORTRAIT: "a4-portrait",
    A4_LANDSCAPE: "a4-landscape",
    A5_PORTRAIT: "a5-portrait",
    LETTER_PORTRAIT: "letter-portrait",
    LETTER_LANDSCAPE: "letter-landscape",
} as const

export type PaperFormatId = (typeof PAPER_FORMAT_ID)[keyof typeof PAPER_FORMAT_ID]

export const CUSTOM_FORMAT_ID = PAPER_FORMAT_ID.CUSTOM

export interface PaperFormat {
    id: PaperFormatId
    label: string
    widthMm: number
    heightMm: number
}

export const PAPER_FORMATS: PaperFormat[] = [
    {
        id: PAPER_FORMAT_ID.MICROPLATE,
        label: "Microplate (127.76 x 85.48 mm)",
        widthMm: 127.76,
        heightMm: 85.48,
    },
    { id: PAPER_FORMAT_ID.A4_PORTRAIT, label: "A4 Portrait", widthMm: 210, heightMm: 297 },
    { id: PAPER_FORMAT_ID.A4_LANDSCAPE, label: "A4 Landscape", widthMm: 297, heightMm: 210 },
    { id: PAPER_FORMAT_ID.A5_PORTRAIT, label: "A5 Portrait", widthMm: 148, heightMm: 210 },
    {
        id: PAPER_FORMAT_ID.LETTER_PORTRAIT,
        label: "Letter Portrait",
        widthMm: 215.9,
        heightMm: 279.4,
    },
    {
        id: PAPER_FORMAT_ID.LETTER_LANDSCAPE,
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

export function findFormatById(id: string): PaperFormat | undefined {
    return PAPER_FORMATS.find((format) => format.id === id)
}
