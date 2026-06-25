export function downloadCanvasAsJpeg(
    canvas: HTMLCanvasElement,
    fileName: string,
    quality = 0.95,
): Promise<void> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Failed to encode JPEG image."))
                    return
                }

                const url = URL.createObjectURL(blob)
                const anchor = document.createElement("a")
                anchor.href = url
                anchor.download = fileName
                anchor.click()
                URL.revokeObjectURL(url)
                resolve()
            },
            "image/jpeg",
            quality,
        )
    })
}

export function printCanvas(canvas: HTMLCanvasElement, title: string): void {
    const dataUrl = canvas.toDataURL("image/png")
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
        throw new Error("Unable to open print preview window.")
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 8mm; }
    html, body { margin: 0; background: white; }
    main { display: grid; place-items: center; min-height: 100vh; }
    img { max-width: 100%; height: auto; image-rendering: crisp-edges; }
  </style>
</head>
<body>
  <main>
    <img alt="Pattern" src="${dataUrl}" />
  </main>
  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`)

    printWindow.document.close()
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")
}
