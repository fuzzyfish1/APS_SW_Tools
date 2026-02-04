import React, { useState, useRef } from 'react'

const WIDTH = 8
const HEIGHT = 8

/**
 * NeoPixel Bitmap Creator
 * Designed for Electron + Vite + Vercel
 */
function App(): React.JSX.Element {
  const [colorPicker, setColorPicker] = useState<string>('#ffff00')
  const [gridColors, setGridColors] = useState<string[][]>(
    Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('#000000'))
  )
  const isDragging = useRef<boolean>(false)

  // Logic: Updates a specific cell in the grid
  const handleCellClick = (x: number, y: number): void => {
    setGridColors((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row])
      newGrid[y][x] = colorPicker
      return newGrid
    })
  }

  const handleMouseDown = (x: number, y: number): void => {
    isDragging.current = true
    handleCellClick(x, y)
  }

  const handleMouseEnter = (x: number, y: number): void => {
    if (isDragging.current) {
      handleCellClick(x, y)
    }
  }

  const handleMouseUp = (): void => {
    isDragging.current = false
  }

  // Generates the C++ style array for NeoPixel matrices
  const generateBitmap = (): string => {
    const rows = gridColors.map((row) => {
      const colors = row.map((c) => {
        const bigint = parseInt(c.slice(1), 16)
        const r = (bigint >> 16) & 255
        const g = (bigint >> 8) & 255
        const b = bigint & 255
        return `matrix.Color(${r}, ${g}, ${b})`
      })
      return `{ ${colors.join(', ')} }`
    })
    return `uint32_t bitmap[8][8] = {\n  ${rows.join(',\n  ')}\n};`
  }

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(generateBitmap())
      alert('Bitmap copied to clipboard!')
    } catch (err) {
      alert('Failed to copy bitmap')
    }
  }

  return (
    <div
      style={{ 
        padding: '20px', 
        fontFamily: 'system-ui, sans-serif', 
        userSelect: 'none', 
        color: '#ffffff',
        minHeight: '100vh'
      }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Prevents "stuck" dragging if mouse leaves window
    >
      <h2 style={{ marginTop: 0 }}>8×8 NeoPixel Bitmap Creator</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="color-picker">Active Color:</label>
        <input
          id="color-picker"
          type="color"
          value={colorPicker}
          onChange={(e): void => setColorPicker(e.target.value)}
          style={{ cursor: 'pointer', border: 'none', background: 'none' }}
        />
        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{colorPicker.toUpperCase()}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${WIDTH}, 30px)`,
          gridTemplateRows: `repeat(${HEIGHT}, 30px)`,
          gap: '4px',
          marginBottom: '20px',
          background: '#333',
          padding: '8px',
          borderRadius: '8px',
          width: 'fit-content'
        }}
      >
        {gridColors.map((row, y) =>
          row.map((color, x) => (
            <div
              key={`${x}-${y}`}
              onMouseDown={(): void => handleMouseDown(x, y)}
              onMouseEnter={(): void => handleMouseEnter(x, y)}
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: color,
                borderRadius: '4px',
                border: '1px solid #111',
                cursor: 'crosshair',
                transition: 'background-color 0.1s'
              }}
            />
          ))
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
        <button
          onClick={copyToClipboard}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            borderRadius: '6px',
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Copy uint32_t Bitmap
        </button>

        <textarea
          readOnly
          value={generateBitmap()}
          spellCheck={false}
          style={{ 
            width: '100%', 
            height: '180px', 
            backgroundColor: '#121212',
            color: '#00ff00',
            fontFamily: 'monospace',
            fontSize: '12px',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #444',
            resize: 'none'
          }}
        />
      </div>
    </div>
  )
}

export default App
