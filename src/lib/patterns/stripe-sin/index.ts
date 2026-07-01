import { mmToPx } from "@/lib/units"

import type { PatternDefinition } from "../types"
import thumbnail from "./stripe-sin_10x10mm_300dpi.webp"

type StripeSinSettings = {
    gapMm: number
    stripeWidthMm: number
    sinFrequencyMm: number
    sinPhaseDeg: number
    orientation: "horizontal" | "vertical"
}

export const stripeSinPattern: PatternDefinition<StripeSinSettings> = {
    id: "stripe-sin",
    label: "Stripe + Sine",
    description: "Solid stripes separated by sinusoidal grating regions",
    thumbnail,
    defaultSettings: {
        gapMm: 7.5,
        stripeWidthMm: 1.5,
        sinFrequencyMm: 1.0,
        sinPhaseDeg: 0,
        orientation: "horizontal",
    },
    controls: [
        {
            type: "number",
            id: "gapMm",
            label: "Gap Width",
            unit: "mm",
            min: 0.5,
            max: 30,
            step: 0.5,
        },
        {
            type: "number",
            id: "stripeWidthMm",
            label: "Stripe Width",
            unit: "mm",
            min: 0.1,
            max: 10,
            step: 0.05,
        },
        {
            type: "number",
            id: "sinFrequencyMm",
            label: "Sin Frequency",
            unit: "mm",
            min: 0.1,
            max: 10,
            step: 0.05,
        },
        {
            type: "number",
            id: "sinPhaseDeg",
            label: "Sin Phase (deg)",
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
        const gapPx = Math.max(2, mmToPx(settings.gapMm, dpi))
        const stripePx = Math.max(1, mmToPx(settings.stripeWidthMm, dpi))
        const periodPx = gapPx + stripePx
        const sinFreqPx = Math.max(2, mmToPx(settings.sinFrequencyMm, dpi))
        const phaseRad = (settings.sinPhaseDeg * Math.PI) / 180
        const horizontal = settings.orientation === "horizontal"

        const buffer = new Uint8ClampedArray(widthPx * heightPx)

        for (let y = 0; y < heightPx; y += 1) {
            const row = y * widthPx
            for (let x = 0; x < widthPx; x += 1) {
                const axis = horizontal ? y : x
                const pos = axis % periodPx
                let value: number
                if (pos < stripePx) {
                    value = 0
                } else {
                    const local = pos - stripePx
                    value = Math.round(
                        0.5 * (1 + Math.sin((2 * Math.PI * local) / sinFreqPx + phaseRad)) * 255,
                    )
                }
                buffer[row + x] = value
            }
        }

        return buffer
    },
}
