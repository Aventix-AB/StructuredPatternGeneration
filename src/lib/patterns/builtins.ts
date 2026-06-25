import { mmToPx } from "@/lib/units"

import { mulberry32, randomInt } from "./random"
import type { PatternDefinition } from "./types"

type SpeckleSettings = {
    density: number
    minDotMm: number
    maxDotMm: number
}

type CheckerboardSettings = {
    squareSizeMm: number
}

type PrbaSettings = {
    blockSizeMm: number
}

type StripeSettings = {
    stripeWidthMm: number
    orientation: "horizontal" | "vertical"
}

type SineSettings = {
    frequencyMm: number
    phaseDeg: number
    orientation: "horizontal" | "vertical"
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

const specklePattern: PatternDefinition<SpeckleSettings> = {
    id: "speckle",
    label: "Speckle",
    description: "Random circular speckles at a controlled density",
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
            label: "Min Dot (mm)",
            min: 0.02,
            max: 0.3,
            step: 0.01,
        },
        {
            type: "number",
            id: "maxDotMm",
            label: "Max Dot (mm)",
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

const checkerboardPattern: PatternDefinition<CheckerboardSettings> = {
    id: "checkerboard",
    label: "Checkerboard",
    description: "Alternating square grid",
    defaultSettings: {
        squareSizeMm: 1,
    },
    controls: [
        {
            type: "number",
            id: "squareSizeMm",
            label: "Square Size (mm)",
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

const prbaPattern: PatternDefinition<PrbaSettings> = {
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
            label: "Block Size (mm)",
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

const stripePattern: PatternDefinition<StripeSettings> = {
    id: "stripes",
    label: "Stripes",
    description: "Alternating black and white stripes",
    defaultSettings: {
        stripeWidthMm: 1.5,
        orientation: "horizontal",
    },
    controls: [
        {
            type: "number",
            id: "stripeWidthMm",
            label: "Stripe Width (mm)",
            min: 0.1,
            max: 10,
            step: 0.05,
        },
        {
            type: "select",
            id: "orientation",
            label: "Orientation",
            options: [
                { value: "horizontal", label: "Horizontal" },
                { value: "vertical", label: "Vertical" },
            ],
        },
    ],
    generate: ({ widthPx, heightPx, dpi }, settings) => {
        const stripePx = Math.max(1, mmToPx(settings.stripeWidthMm, dpi))
        const horizontal = settings.orientation === "horizontal"
        const buffer = new Uint8ClampedArray(widthPx * heightPx)

        for (let y = 0; y < heightPx; y += 1) {
            const row = y * widthPx
            for (let x = 0; x < widthPx; x += 1) {
                const axis = horizontal ? y : x
                buffer[row + x] = Math.floor(axis / stripePx) % 2 === 0 ? 0 : 255
            }
        }

        return buffer
    },
}

const sinePattern: PatternDefinition<SineSettings> = {
    id: "sine",
    label: "Sin Grating",
    description: "Continuous sinusoidal grating",
    defaultSettings: {
        frequencyMm: 5,
        phaseDeg: 0,
        orientation: "horizontal",
    },
    controls: [
        {
            type: "number",
            id: "frequencyMm",
            label: "Frequency (mm)",
            min: 0.1,
            max: 20,
            step: 0.05,
        },
        {
            type: "number",
            id: "phaseDeg",
            label: "Phase (deg)",
            min: 0,
            max: 360,
            step: 1,
        },
        {
            type: "select",
            id: "orientation",
            label: "Orientation",
            options: [
                { value: "horizontal", label: "Horizontal" },
                { value: "vertical", label: "Vertical" },
            ],
        },
    ],
    generate: ({ widthPx, heightPx, dpi }, settings) => {
        const periodPx = Math.max(2, mmToPx(settings.frequencyMm, dpi))
        const phaseRad = (settings.phaseDeg * Math.PI) / 180
        const horizontal = settings.orientation === "horizontal"

        const buffer = new Uint8ClampedArray(widthPx * heightPx)

        for (let y = 0; y < heightPx; y += 1) {
            const row = y * widthPx
            for (let x = 0; x < widthPx; x += 1) {
                const axis = horizontal ? y : x
                const value = 0.5 * (1 + Math.sin((2 * Math.PI * axis) / periodPx + phaseRad))
                buffer[row + x] = Math.round(value * 255)
            }
        }

        return buffer
    },
}

export const BUILTIN_PATTERNS = [
    specklePattern,
    checkerboardPattern,
    prbaPattern,
    stripePattern,
    sinePattern,
]
