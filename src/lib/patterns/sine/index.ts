import { mmToPx } from "@/lib/units"

import type { PatternDefinition } from "../types"
import thumbnail from "./sine_10x10mm_300dpi.webp"

type SineSettings = {
    frequencyMm: number
    phaseDeg: number
    orientation: "horizontal" | "vertical"
}

export const sinePattern: PatternDefinition<SineSettings> = {
    id: "sine",
    label: "Sin Grating",
    description: "Continuous sinusoidal grating",
    thumbnail,
    defaultSettings: {
        frequencyMm: 5,
        phaseDeg: 0,
        orientation: "horizontal",
    },
    controls: [
        {
            type: "number",
            id: "frequencyMm",
            label: "Frequency",
            unit: "mm",
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
