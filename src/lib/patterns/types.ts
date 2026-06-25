export type PatternControlType = "number" | "select"

export interface PatternControlNumber {
    type: "number"
    id: string
    label: string
    min: number
    max: number
    step: number
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
    defaultSettings: TSettings
    controls: PatternControl[]
    generate: (context: PatternRenderContext, settings: TSettings) => Uint8ClampedArray
}
