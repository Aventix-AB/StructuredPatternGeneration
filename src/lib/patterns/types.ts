export type PatternControlType = "number" | "select"

export interface PatternControlNumber {
    type: "number"
    id: string
    label: string
    min: number
    max: number
    step: number
    /** When "mm", values are stored in mm internally and converted to the active sizeUnit for display. */
    unit?: "mm"
}

export interface PatternControlSelect {
    type: "select"
    id: string
    label: string
    options: Array<{ value: string; label: string }>
}

export type PatternControl = PatternControlNumber | PatternControlSelect

export interface PatternRenderContext {
    widthPx: number
    heightPx: number
    dpi: number
    seed: number
}

export interface PatternDefinition<TSettings extends Record<string, number | string>> {
    id: string
    label: string
    description: string
    /**
     * Optional path/URL to a thumbnail image shown in the pattern selector.
     * Place the image in the pattern's own folder (e.g. `speckle/thumbnail.png`)
     * and import it here so Vite bundles it correctly.
     */
    thumbnail?: string
    defaultSettings: TSettings
    controls: PatternControl[]
    generate: (context: PatternRenderContext, settings: TSettings) => Uint8ClampedArray
}
