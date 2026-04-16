export async function svgToPng(svgString: string): Promise<Uint8Array> {
  if (!svgString.trim()) throw new Error('Empty SVG')

  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || 200
      canvas.height = img.naturalHeight || 80
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Could not get 2D context')); return }
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { reject(new Error('Canvas toBlob failed')); return }
        pngBlob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject)
      }, 'image/png')
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG image'))
    }

    img.src = url
  })
}
