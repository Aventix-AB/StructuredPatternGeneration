import { mmToPx } from "@/lib/units"

import type { PatternDefinition } from "../types"
import thumbnail from "./checkerboard_10x10mm_300dpi.webp"

type CheckerboardSettings = {
    squareSizeMm: number
}

export const checkerboardPattern: PatternDefinition<CheckerboardSettings> = {
    id: "checkerboard",
    label: "Checkerboard",
    description: "Alternating square grid",
    thumbnail,
    defaultSettings: {
        squareSizeMm: 1,
    },
    controls: [
        {
            type: "number",
            id: "squareSizeMm",
            label: "Square Size",
            unit: "mm",
            min: 0.1,
            max: 10,
            step: 0.05,
        },
    ],
    generate: ({ widthPx, heightPx, dpi }, settings) => {
        const squarePx = Math.max(1, mmToPx(settings.squareSizeMm, dpi))
        const buffer = new Uint8ClampedArray(widthPx * heightPx)

        for (let y = 0; y < heightPx; y += 1) {
            const gy = Math.floor(y / squarePx)
            const row = y * widthPx
            for (let x = 0; x < widthPx; x += 1) {
                const gx = Math.floor(x / squarePx)
                buffer[row + x] = (gx + gy) % 2 === 0 ? 0 : 255
            }
        }

        return buffer
    },
}
