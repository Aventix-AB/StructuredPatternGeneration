import { mmToPx } from "@/lib/units"

import type { PatternDefinition } from "../types"

type StripeSettings = {
    stripeWidthMm: number
    orientation: "horizontal" | "vertical"
}

export const stripePattern: PatternDefinition<StripeSettings> = {
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
            label: "Stripe Width",
            unit: "mm",
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
