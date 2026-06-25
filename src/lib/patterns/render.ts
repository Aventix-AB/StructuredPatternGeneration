export function grayscaleToImageData(
    widthPx: number,
    heightPx: number,
    grayscale: Uint8ClampedArray,
): ImageData {
    const rgba = new Uint8ClampedArray(widthPx * heightPx * 4)

    for (let i = 0; i < grayscale.length; i += 1) {
        const value = grayscale[i]
        const offset = i * 4
        rgba[offset] = value
        rgba[offset + 1] = value
        rgba[offset + 2] = value
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
