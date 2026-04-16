import { useRef, useEffect, useState } from 'react'

interface Props {
  onSave: (svgString: string) => void
}

export function SignaturePad({ onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const pathPoints = useRef<[number, number][]>([])
  const allPaths = useRef<[number, number][][]>([])
  const [hasSig, setHasSig] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent): [number, number] {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top]
    }
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = true
    pathPoints.current = [getPos(e)]
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    const [x, y] = pathPoints.current[0]
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const [x, y] = getPos(e)
    pathPoints.current.push([x, y])
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSig(true)
  }

  function stopDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing.current) return
    drawing.current = false
    allPaths.current.push([...pathPoints.current])
    pathPoints.current = []
  }

  function clear() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    allPaths.current = []
    setHasSig(false)
  }

  function save() {
    const canvas = canvasRef.current!
    const w = canvas.width
    const h = canvas.height
    const paths = allPaths.current

    const pathStrings = paths.map((pts) => {
      if (pts.length === 0) return ''
      const [start, ...rest] = pts
      const d = `M${start[0]},${start[1]} ` + rest.map(([x, y]) => `L${x},${y}`).join(' ')
      return `<path d="${d}" stroke="black" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    }).join('\n')

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">\n${pathStrings}\n</svg>`
    onSave(svg)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        className="signature-area"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <div className="signature-actions">
        <button type="button" className="btn-secondary" onClick={clear}>נקה</button>
        {hasSig && (
          <button type="button" className="btn-secondary" onClick={save}>שמור חתימה</button>
        )}
      </div>
    </div>
  )
}
