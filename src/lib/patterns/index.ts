import { PATTERN_REGISTRY } from "./registry"

export type { PatternControl, PatternDefinition, PatternRenderContext, RgbColor } from "./types"
export { PATTERN_REGISTRY } from "./registry"

export function getPatternById(id: string): (typeof PATTERN_REGISTRY)[number] | undefined {
    return PATTERN_REGISTRY.find((pattern) => pattern.id === id)
}

export function createDefaultSettingsMap(): Record<string, Record<string, number | string>> {
    return Object.fromEntries(
        PATTERN_REGISTRY.map((pattern) => [pattern.id, { ...pattern.defaultSettings }])
    )
}

export function renderPatternById(
    patternId: string,
    context: { widthPx: number; heightPx: number; dpi: number; seed: number },
    settingsMap: Record<string, Record<string, number | string>>,
): Uint8ClampedArray {
    const pattern = getPatternById(patternId)

    if (!pattern) {
        throw new Error(`Unknown pattern: ${patternId}`)
    }

    const settings = settingsMap[patternId]

    if (!settings) {
        throw new Error(`Missing settings for pattern: ${patternId}`)
    }

    return pattern.generate(context, settings as never)
}
