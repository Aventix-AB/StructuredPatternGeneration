import { mmToPx } from "@/lib/units"

import type { PatternDefinition } from "../types"
import thumbnail from "./concentric-rings_10x10mm_300dpi.webp"

type ConcentricRingsSettings = {
    periodMm: number
    ringSpaceMm: number
    ringWidthMm: number
}

export const concentricRingsPattern: PatternDefinition<ConcentricRingsSettings> = {
    id: "concentric-rings",
    label: "Concentric Rings",
    description: "Tiled concentric ring pattern with configurable period, spacing, and line width",
    thumbnail,
    defaultSettings: {
        periodMm: 9.0,
        ringSpaceMm: 0.8,
        ringWidthMm: 0.12,
    },
    controls: [
        {
            type: "number",
            id: "periodMm",
            label: "Tile Period",
            unit: "mm",
            min: 1,
            max: 30,
            step: 0.5,
        },
        {
            type: "number",
            id: "ringSpaceMm",
            label: "Ring Spacing",
            unit: "mm",
            min: 0.05,
            max: 5,
            step: 0.05,
        },
        {
            type: "number",
            id: "ringWidthMm",
            label: "Ring Width",
            unit: "mm",
            min: 0.02,
            max: 1,
            step: 0.01,
        },
    ],
    generate: ({ widthPx, heightPx, dpi }, settings) => {
        const periodPx = Math.max(2, mmToPx(settings.periodMm, dpi))
        const ringSpPx = Math.max(0.5, mmToPx(settings.ringSpaceMm, dpi))
        const halfWidthPx = Math.max(0.3, mmToPx(settings.ringWidthMm, dpi) / 2)

        // Precompute ring radii within one tile
        const maxR = periodPx / 2
        const rings: number[] = []
        for (let n = 1; n * ringSpPx <= maxR; n += 1) {
            rings.push(n * ringSpPx)
        }

        const buffer = new Uint8ClampedArray(widthPx * heightPx)
        buffer.fill(255)

        for (let y = 0; y < heightPx; y += 1) {
            const row = y * widthPx
            const yMod = (y % periodPx) - periodPx / 2
            for (let x = 0; x < widthPx; x += 1) {
                const xMod = (x % periodPx) - periodPx / 2
                const dist = Math.sqrt(xMod * xMod + yMod * yMod)
                for (const rN of rings) {
                    if (Math.abs(dist - rN) <= halfWidthPx) {
                        buffer[row + x] = 0
                        break
                    }
                }
            }
        }

        return buffer
    },
}
