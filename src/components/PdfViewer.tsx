import { useState, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker path - it's served from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = '/fly-form/pdf.worker.min.js'

interface PdfViewerProps {
  pdfUrl: string
  onClose: () => void
  fileName: string
}

export function PdfViewer({ pdfUrl, onClose, fileName }: PdfViewerProps) {
  const [pageImages, setPageImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const renderPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise
        const images: string[] = []

        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          try {
            const page = await pdf.getPage(i)
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            if (!context) throw new Error('Could not get canvas context')

            const viewport = page.getViewport({ scale: 2 })
            canvas.width = viewport.width
            canvas.height = viewport.height

            await page.render({
              canvasContext: context,
              viewport: viewport,
            } as any).promise

            const imageData = canvas.toDataURL('image/png')
            images.push(imageData)
          } catch (pageErr) {
            console.error(`Error rendering page ${i}:`, pageErr)
          }
        }

        if (images.length === 0) {
          setError('לא הצלח לטעון את הטופס')
        } else {
          setPageImages(images)
        }
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError('שגיאה בטעינת הטופס: ' + String(err))
      } finally {
        setLoading(false)
      }
    }

    renderPdf()
  }, [pdfUrl])

  const shareToWhatsApp = async (url: string, name: string) => {
    try {
      // Fetch the PDF blob
      const response = await fetch(url)
      const blob = await response.blob()

      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          files: [new File([blob], name, { type: 'application/pdf' })],
          title: 'טופס היתר יציאה',
          text: 'הטופס שלי לאישור יציאה לחו"ל',
        })
      } else {
        // Fallback: WhatsApp web link
        const message = encodeURIComponent('הטופס שלי לאישור יציאה לחו"ל')
        window.open(`https://wa.me/?text=${message}`)
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
    }}>
      <div style={{
        background: 'white',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        margin: '1rem',
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1rem', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>הטופס שלך</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#f3f4f6',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          {loading && <p style={{ color: '#6b7280' }}>טוען PDF...</p>}
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
          {pageImages.map((imageSrc, i) => (
            <img
              key={i}
              src={imageSrc}
              style={{
                maxWidth: '100%',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                background: 'white',
              }}
              alt={`Page ${i + 1}`}
            />
          ))}
        </div>

        <div style={{ padding: '1rem', background: '#f3f4f6', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={pdfUrl}
            download={fileName}
            style={{
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            הורד קובץ
          </a>
          <button
            onClick={() => shareToWhatsApp(pdfUrl, fileName)}
            style={{
              padding: '0.5rem 1rem',
              background: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            שתף ב-WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
