import React, { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'

/**
 * Shows the app version (V3) prominently plus low-level runtime versions
 * (Electron / Chromium / Node) when running in the desktop build.
 */
const Versions: React.FC = () => {
  const [appVersion, setAppVersion] = useState<string>(__APP_VERSION__)

  useEffect(() => {
    // In Electron, ask the main process for the authoritative version
    if (window.api?.getVersion) {
      window.api.getVersion().then(setAppVersion).catch(() => {
        // fallback to build-time constant — already set above
      })
    }
  }, [])

  const runtimeVersions =
    window.electron?.process?.versions ?? null

  const tiny = {
    fontSize: '9px',
    lineHeight: 1.6,
    letterSpacing: '0.02em',
    opacity: 0.6
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="caption"
        sx={{ color: 'primary.main', fontWeight: 700, fontSize: '11px' }}
      >
        V{appVersion}
      </Typography>

      {runtimeVersions && (
        <ul style={{ ...tiny, paddingLeft: 14, margin: '4px 0 0 0' }}>
          <li>Electron v{runtimeVersions.electron}</li>
          <li>Chromium v{runtimeVersions.chrome}</li>
          <li>Node v{runtimeVersions.node}</li>
        </ul>
      )}
    </Box>
  )
}

export default Versions
