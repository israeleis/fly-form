import { PDFDocument } from 'pdf-lib'

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89

/**
 * Appends files (images and PDFs) as additional pages to the PDF document.
 * Mutates pdfDoc in place. Processes each file independently with per-file error handling.
 */
export async function appendAttachments(pdfDoc: PDFDocument, files: File[]): Promise<void> {
  for (const file of files) {
    try {
      if (file.type === 'application/pdf') {
        await addPdfPages(pdfDoc, file)
      } else if (file.type === 'image/jpeg' || file.type === 'image/png') {
        await addImagePage(pdfDoc, file)
      }
    } catch (error) {
      throw new Error(`קובץ '${file.name}' פגום או לא נתמך`)
    }
  }
}

/**
 * Compresses an image file to JPEG and returns the bytes.
 * Uses canvas with scaling to fit A4 dimensions without upscaling.
 */
async function compressImageToJpeg(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const blob = file
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      try {
        const w = img.naturalWidth || 200
        const h = img.naturalHeight || 200

        // Scale to fit within A4 without upscaling
        const scale = Math.min(A4_WIDTH / w, A4_HEIGHT / h, 1)
        const scaledW = Math.round(w * scale)
        const scaledH = Math.round(h * scale)

        const canvas = document.createElement('canvas')
        canvas.width = scaledW
        canvas.height = scaledH
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(url)
          reject(new Error('Could not get canvas 2D context'))
          return
        }

        ctx.drawImage(img, 0, 0, scaledW, scaledH)
        URL.revokeObjectURL(url)

        canvas.toBlob(
          (jpegBlob) => {
            if (!jpegBlob) {
              reject(new Error('Canvas toBlob failed'))
              return
            }
            jpegBlob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject)
          },
          'image/jpeg',
          0.85
        )
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    img.src = url
  })
}

/**
 * Adds an image file as a new page to the PDF.
 * Images are compressed and centered on the page.
 */
async function addImagePage(pdfDoc: PDFDocument, file: File): Promise<void> {
  const jpegBytes = await compressImageToJpeg(file)
  const image = await pdfDoc.embedJpg(jpegBytes)

  // Calculate dimensions to fit on A4 while maintaining aspect ratio
  const imgWidth = image.width
  const imgHeight = image.height
  const scale = Math.min(A4_WIDTH / imgWidth, A4_HEIGHT / imgHeight, 1)
  const drawWidth = imgWidth * scale
  const drawHeight = imgHeight * scale

  // Center the image on the page
  const x = (A4_WIDTH - drawWidth) / 2
  const y = (A4_HEIGHT - drawHeight) / 2

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
  page.drawImage(image, {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  })
}

/**
 * Adds all pages from a PDF file to the document.
 */
async function addPdfPages(pdfDoc: PDFDocument, file: File): Promise<void> {
  const pdfBytes = await file.arrayBuffer()
  const donorDoc = await PDFDocument.load(pdfBytes)

  // Copy all pages from the donor PDF
  const pageIndices = Array.from({ length: donorDoc.getPageCount() }, (_, i) => i)
  const copiedPages = await pdfDoc.copyPages(donorDoc, pageIndices)

  // Add each copied page to the document
  for (const page of copiedPages) {
    pdfDoc.addPage(page)
  }
}
