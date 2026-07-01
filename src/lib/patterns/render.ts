import type { RgbColor } from "./types"

const DEFAULT_COLOR1: RgbColor = { r: 0, g: 0, b: 0 }
const DEFAULT_COLOR2: RgbColor = { r: 255, g: 255, b: 255 }

/**
 * Convert a grayscale buffer to RGBA ImageData, blending between two colors.
 * Grayscale 0 maps to color1 (foreground), 255 maps to color2 (background).
 * Intermediate values are linearly interpolated, giving gradients for free.
 */
export function grayscaleToImageData(
    widthPx: number,
    heightPx: number,
    grayscale: Uint8ClampedArray,
    color1: RgbColor = DEFAULT_COLOR1,
    color2: RgbColor = DEFAULT_COLOR2,
): ImageData {
    const rgba = new Uint8ClampedArray(widthPx * heightPx * 4)

    for (let i = 0; i < grayscale.length; i += 1) {
        const t = grayscale[i] / 255
        const offset = i * 4
        rgba[offset] = Math.round(color1.r + t * (color2.r - color1.r))
        rgba[offset + 1] = Math.round(color1.g + t * (color2.g - color1.g))
        rgba[offset + 2] = Math.round(color1.b + t * (color2.b - color1.b))
        rgba[offset + 3] = 255
    }

    return new ImageData(rgba, widthPx, heightPx)
}

export function createPatternImageData(
    renderer: () => Uint8ClampedArray,
    widthPx: number,
    heightPx: number,
): ImageData {
    const grayscale = renderer()
    return grayscaleToImageData(widthPx, heightPx, grayscale)
}

export function drawImageDataToCanvas(canvas: HTMLCanvasElement, imageData: ImageData): void {
    canvas.width = imageData.width
    canvas.height = imageData.height
    const context = canvas.getContext("2d")

    if (!context) {
        throw new Error("2D canvas context is not available.")
    }

    context.putImageData(imageData, 0, 0)
}

export function createCanvasFromImageData(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement("canvas")
    drawImageDataToCanvas(canvas, imageData)
    return canvas
}
