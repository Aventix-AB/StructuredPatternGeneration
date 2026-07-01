import { mmToPx } from "@/lib/units"

import { mulberry32, randomInt } from "../random"
import type { PatternDefinition } from "../types"
import thumbnail from "./speckle_10x10mm_300dpi.webp"

type SpeckleSettings = {
    density: number
    minDotMm: number
    maxDotMm: number
}

function createWhiteBuffer(widthPx: number, heightPx: number): Uint8ClampedArray {
    const buffer = new Uint8ClampedArray(widthPx * heightPx)
    buffer.fill(255)
    return buffer
}

function drawCircle(
    buffer: Uint8ClampedArray,
    widthPx: number,
    heightPx: number,
    cx: number,
    cy: number,
    radius: number,
    color: number
): void {
    const r2 = radius * radius
    const x0 = Math.max(0, cx - radius)
    const x1 = Math.min(widthPx - 1, cx + radius)
    const y0 = Math.max(0, cy - radius)
    const y1 = Math.min(heightPx - 1, cy + radius)

    for (let y = y0; y <= y1; y += 1) {
        const dy = y - cy
        const row = y * widthPx
        for (let x = x0; x <= x1; x += 1) {
            const dx = x - cx
            if (dx * dx + dy * dy <= r2) {
                buffer[row + x] = color
            }
        }
    }
}

export const specklePattern: PatternDefinition<SpeckleSettings> = {
    id: "speckle",
    label: "Speckle",
    description: "Random circular speckles at a controlled density",
    thumbnail,
    defaultSettings: {
        density: 0.35,
        minDotMm: 0.05,
        maxDotMm: 0.25,
    },
    controls: [
        { type: "number", id: "density", label: "Density", min: 0.05, max: 0.9, step: 0.01 },
        {
            type: "number",
            id: "minDotMm",
            label: "Min Dot",
            unit: "mm",
            min: 0.02,
            max: 0.3,
            step: 0.01,
        },
        {
            type: "number",
            id: "maxDotMm",
            label: "Max Dot",
            unit: "mm",
            min: 0.05,
            max: 0.6,
            step: 0.01,
        },
    ],
    generate: ({ widthPx, heightPx, dpi, seed }, settings) => {
        const next = mulberry32(seed)
        const minRadiusPx = Math.max(1, mmToPx(settings.minDotMm, dpi))
        const maxRadiusPx = Math.max(minRadiusPx + 1, mmToPx(settings.maxDotMm, dpi))

        const areaPx = widthPx * heightPx
        const avgRadiusPx = (minRadiusPx + maxRadiusPx) / 2
        const avgDotArea = Math.PI * avgRadiusPx * avgRadiusPx
        const dots = Math.max(1, Math.floor((areaPx * settings.density) / avgDotArea))

        const buffer = createWhiteBuffer(widthPx, heightPx)

        for (let i = 0; i < dots; i += 1) {
            const x = randomInt(next, 0, widthPx - 1)
            const y = randomInt(next, 0, heightPx - 1)
            const r = randomInt(next, minRadiusPx, maxRadiusPx)
            drawCircle(buffer, widthPx, heightPx, x, y, r, 0)
        }

        return buffer
    },
}
