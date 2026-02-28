import React from 'react';
import { Box, Typography, Slider, SliderProps } from '@mui/material';

interface ToolSliderProps {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  // This is the "hook" back to the parent file
  onChange: (newValue: number) => void; 
}

const ToolSlider: React.FC<ToolSliderProps> = ({ 
  label, value, unit = '', min = 0, max = 100, onChange 
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: 'secondary.main' }}>
          {value}{unit}
        </Typography>
      </Box>
      <Slider
        size="small"
        value={value}
        min={min}
        max={max}
        // MUI sends (event, value), we just send the value back to the parent
        onChange={(_, val) => onChange(val as number)}
        sx={{
          color: 'primary.main',
          '& .MuiSlider-rail': { bgcolor: '#333' },
        }}
      />
    </Box>
  );
};

export default ToolSlider;
