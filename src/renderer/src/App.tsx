/**
 * App — top-level layout shell.
 *
 * Renders the persistent chrome (UpdateBanner + Navbar) and delegates all
 * page content to the router.  Nothing page-specific lives here.
 */
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'

import Navbar from './components/Navbar'
import UpdateBanner from './components/UpdateBanner'
import MatrixPage from './pages/MatrixPage'
import PlotterPage from './pages/PlotterPage'

const App: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      bgcolor: 'background.default',
      color: 'text.primary',
    }}
  >
    {/* Auto-updater banner — hidden unless an update event fires */}
    <UpdateBanner />

    {/* Top navigation bar */}
    <Navbar />

    {/* Page content — fills the remaining vertical space */}
    <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/" element={<MatrixPage />} />
        <Route path="/plotter" element={<PlotterPage />} />
      </Routes>
    </Box>
  </Box>
)

export default App
