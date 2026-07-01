import { mmToPx } from "@/lib/units"

import { mulberry32 } from "../random"
import type { PatternDefinition } from "../types"

type PrbaSettings = {
    blockSizeMm: number
}

export const prbaPattern: PatternDefinition<PrbaSettings> = {
    id: "prba",
    label: "PRBA",
    description: "Pseudo-random binary array",
    defaultSettings: {
        blockSizeMm: 0.5,
    },
    controls: [
        {
            type: "number",
            id: "blockSizeMm",
            label: "Block Size",
            unit: "mm",
            min: 0.05,
            max: 5,
            step: 0.05,
        },
    ],
    generate: ({ widthPx, heightPx, dpi, seed }, settings) => {
        const next = mulberry32(seed)
        const blockPx = Math.max(1, mmToPx(settings.blockSizeMm, dpi))
        const cols = Math.floor(widthPx / blockPx) + 1
        const rows = Math.floor(heightPx / blockPx) + 1

        const grid = new Uint8Array(rows * cols)
        for (let i = 0; i < grid.length; i += 1) {
            grid[i] = next() >= 0.5 ? 255 : 0
        }

        const buffer = new Uint8ClampedArray(widthPx * heightPx)
        for (let y = 0; y < heightPx; y += 1) {
            const gy = Math.floor(y / blockPx)
            const row = y * widthPx
            const gridRow = gy * cols
            for (let x = 0; x < widthPx; x += 1) {
                const gx = Math.floor(x / blockPx)
                buffer[row + x] = grid[gridRow + gx]
            }
        }

        return buffer
    },
}
