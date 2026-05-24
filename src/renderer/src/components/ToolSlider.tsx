import React from 'react'
import { Box, Typography, Slider, IconButton, Stack } from '@mui/material'
import { Add, Remove } from '@mui/icons-material'

interface ToolSliderProps {
  label: string
  value: number
  unit?: string
  min?: number
  max?: number
  step?: number
  onChange: (newValue: number) => void
}

const ToolSlider: React.FC<ToolSliderProps> = ({
  label,
  value,
  unit = '',
  min = 0,
  max = 100,
  step = 1, // Default step to 1
  onChange
}) => {
  // Handlers to increment/decrement while staying within bounds
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }

  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      {/* Header Row: Label and Current Value */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 'medium' }}>
          {value}
          {unit}
        </Typography>
      </Box>

      {/* Control Row: Minus Button -> Slider -> Plus Button */}
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton
          size="small"
          onClick={handleDecrement}
          disabled={value <= min}
          sx={{ color: 'text.secondary', p: 0.5 }}
        >
          <Remove fontSize="small" />
        </IconButton>

        <Slider
          size="small"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(_, val) => onChange(val as number)}
          sx={{
            flexGrow: 1,
            color: 'primary.main',
            '& .MuiSlider-rail': { bgcolor: '#333' },
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              transition: '0.2s',
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0px 0px 0px 8px rgba(25, 118, 210, 0.16)'
              }
            }
          }}
        />

        <IconButton
          size="small"
          onClick={handleIncrement}
          disabled={value >= max}
          sx={{ color: 'text.secondary', p: 0.5 }}
        >
          <Add fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  )
}

export default ToolSlider
