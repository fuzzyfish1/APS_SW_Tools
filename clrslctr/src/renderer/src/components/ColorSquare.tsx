import React from 'react';
import { ButtonBase } from '@mui/material';

interface ColorSquareProps {
  color: string;
  onClick: () => void;
}

const ColorSquare: React.FC<ColorSquareProps> = ({ color, onClick }) => {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: 30, // Fixed 30px
        height: 30, // Fixed 30px
        bgcolor: color,
        borderRadius: '4px', // Slight rounding looks cleaner than sharp 90°
        border: '1px solid rgba(255, 255, 255, 0.1)', // Subtle border for dark mode
        transition: 'transform 0.1s',
        '&:hover': {
          transform: 'scale(1.1)',
          zIndex: 1, // Ensures it pops over neighbors
          boxShadow: '0 0 8px rgba(0,0,0,0.5)',
        },
        '&:active': {
          transform: 'scale(0.9)',
        }
      }}
    />
  );
};

export default ColorSquare;
