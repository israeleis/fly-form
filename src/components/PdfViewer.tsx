import { useState, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface PdfViewerProps {
  pdfUrl: string
  onClose: () => void
  fileName: string
}

export function PdfViewer({ pdfUrl, onClose, fileName }: PdfViewerProps) {
  const [pages, setPages] = useState<HTMLCanvasElement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const renderPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise
        const canvases: HTMLCanvasElement[] = []

        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i)
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')!
          const viewport = page.getViewport({ scale: 1.5 })

          canvas.width = viewport.width
          canvas.height = viewport.height

          await page.render({
            canvasContext: context,
            viewport: viewport,
          } as any).promise

          canvases.push(canvas)
        }

        setPages(canvases)
      } catch (err) {
        console.error('Error rendering PDF:', err)
      } finally {
        setLoading(false)
      }
    }

    renderPdf()
  }, [pdfUrl])

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
          {pages.map((canvas, i) => (
            <div
              key={i}
              ref={(el) => {
                if (el && el.children.length === 0) {
                  el.appendChild(canvas)
                }
              }}
              style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            />
          ))}
        </div>

        <div style={{ padding: '1rem', background: '#f3f4f6', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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
        </div>
      </div>
    </div>
  )
}
