import React, { useState, useEffect } from 'react'
import { Alert, Button } from '@mui/material'
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt'

/**
 * Floats at the top of the screen when an update has been downloaded and is
 * ready to install.  Only visible in the desktop (Electron) build.
 */
const UpdateBanner: React.FC = () => {
  const [state, setState] = useState<'idle' | 'available' | 'ready'>('idle')

  useEffect(() => {
    if (!window.api) return // web build — no updater

    window.api.onUpdateAvailable(() => setState('available'))
    window.api.onUpdateDownloaded(() => setState('ready'))
  }, [])

  if (state === 'idle') return null

  return (
    <Alert
      icon={<SystemUpdateAltIcon fontSize="small" />}
      severity="info"
      sx={{
        borderRadius: 0,
        py: 0.5,
        bgcolor: '#1a1a2e',
        color: 'primary.main',
        '& .MuiAlert-icon': { color: 'primary.main' }
      }}
      action={
        state === 'ready' ? (
          <Button
            size="small"
            color="primary"
            variant="outlined"
            onClick={() => window.api.installUpdate()}
            sx={{ fontSize: '11px' }}
          >
            Restart &amp; Install
          </Button>
        ) : undefined
      }
    >
      {state === 'available'
        ? 'Update available — downloading…'
        : 'Update downloaded. Restart to apply.'}
    </Alert>
  )
}

export default UpdateBanner
