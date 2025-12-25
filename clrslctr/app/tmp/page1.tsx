// pages/index.tsx
"use client";
import { useState } from 'react';

const WIDTH = 8;
const HEIGHT = 8;

export default function Home() {
  const [colorPicker, setColorPicker] = useState('#ffff00');
  const [gridColors, setGridColors] = useState<string[][]>(
    Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('#000000'))
  );

  const handleCellClick = (x: number, y: number) => {
    const newGrid = gridColors.map(row => [...row]);
    newGrid[y][x] = colorPicker;
    setGridColors(newGrid);
  };

  const generateBitmap = () => {
    const rows = gridColors.map(row => {
      const colors = row.map(c => {
        const bigint = parseInt(c.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `matrix.Color(${r}, ${g}, ${b})`;
      });
      return `{ ${colors.join(', ')} }`;
    });
    return `uint32_t bitmap[8][8] = {
  ${rows.join(',\n  ')}
};`;
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>8×8 NeoPixel Bitmap Creator</h2>
      <input
        type="color"
        value={colorPicker}
        onChange={(e) => setColorPicker(e.target.value)}
        style={{ marginBottom: 20 }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${WIDTH}, 30px)`,
          gridTemplateRows: `repeat(${HEIGHT}, 30px)`,
          gap: 4,
          marginBottom: 20
        }}
      >
        {gridColors.map((row, y) =>
          row.map((color, x) => (
            <div
              key={`${x}-${y}`}
              onClick={() => handleCellClick(x, y)}
              style={{ width: 30, height: 30, backgroundColor: color, borderRadius: 4, border: '1px solid #444', cursor: 'pointer' }}
            />
          ))
        )}
      </div>
      <button
        onClick={() => navigator.clipboard.writeText(generateBitmap())}
        style={{ marginBottom: 10 }}
      >
        Copy uint32_t Bitmap
      </button>
      <textarea
        readOnly
        value={generateBitmap()}
        style={{ width: '90%', height: 200 }}
      />
    </div>
  );
}
