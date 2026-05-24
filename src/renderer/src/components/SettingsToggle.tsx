import React, { useState } from 'react'
import { Switch, FormControlLabel, Box, Typography } from '@mui/material'

interface SettingsToggleProps {
  label: string
  initState?: boolean
  handleToggle?: (checked: boolean) => void
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  initState = false,
  handleToggle
}) => {
  const [isToggled, setIsToggled] = useState<boolean>(initState)

  const onChange = (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean): void => {
    setIsToggled(checked)
    handleToggle?.(checked)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <FormControlLabel
        control={<Switch checked={isToggled} onChange={onChange} color="primary" />}
        label=""
        sx={{ m: 0 }}
      />
      <Typography variant="caption" sx={{ color: 'text.primary' }}>
        {label}
      </Typography>
    </Box>
  )
}

export default SettingsToggle
