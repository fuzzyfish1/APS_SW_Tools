import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, Tabs, Tab, Typography, Box, Chip } from '@mui/material'
import GridOnIcon from '@mui/icons-material/GridOn'
import ShowChartIcon from '@mui/icons-material/ShowChart'

const ROUTES = ['/', '/plotter'] as const

const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Normalize — HashRouter paths always start with /
  const currentTab = ROUTES.indexOf(pathname as (typeof ROUTES)[number])
  const tabValue = currentTab < 0 ? 0 : currentTab

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar variant="dense" sx={{ gap: 2, minHeight: 48 }}>
        {/* Brand */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap'
          }}
        >
          APS SW Tools
        </Typography>

        {/* Version badge */}
        <Chip
          label={`V${__APP_VERSION__}`}
          size="small"
          sx={{
            height: 18,
            fontSize: '9px',
            bgcolor: '#1e1e1e',
            color: 'secondary.main',
            border: '1px solid',
            borderColor: 'divider',
            fontFamily: 'inherit'
          }}
        />

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Navigation tabs */}
        <Tabs
          value={tabValue}
          onChange={(_e, idx) => navigate(ROUTES[idx])}
          textColor="primary"
          indicatorColor="primary"
          sx={{ minHeight: 48 }}
        >
          <Tab
            icon={<GridOnIcon sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="Matrix"
            sx={{ minHeight: 48, py: 0 }}
          />
          <Tab
            icon={<ShowChartIcon sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="Serial Plotter"
            sx={{ minHeight: 48, py: 0 }}
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
