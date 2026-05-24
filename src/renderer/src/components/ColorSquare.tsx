import React from 'react'
import { ButtonBase } from '@mui/material'

interface ColorSquareProps {
  color: string
  onClick?: () => void
}

const ColorSquare: React.FC<ColorSquareProps> = ({ color, onClick }) => {
  const isClickable = Boolean(onClick)
  return (
    <ButtonBase
      onClick={onClick}
      disabled={!isClickable}
      sx={{
        width: 30, // Fixed 30px
        height: 30, // Fixed 30px
        bgcolor: color,
        borderRadius: '4px', // Slight rounding looks cleaner than sharp 90°
        border: '2px solid', // Subtle border for dark mode
        borderColor: 'divider',
        /*transition: 'transform 0.1s, box-shadow 0.1s',*/

        // Use the condition to apply or skip hover styles
        cursor: isClickable ? 'pointer' : 'default',

        ...(isClickable && {
          '&:hover': {
            transform: 'scale(1.1)',
            zIndex: 1,
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          },
          '&:active': {
            transform: 'scale(0.9)'
          }
        })
      }}
    />
  )
}

export default ColorSquare
