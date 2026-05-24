import { createTheme } from '@mui/material/styles'

/**
 * Colour palette
 *  #BB86FC  violet   — primary / accent
 *  #3700B3  blue     — (available for variants)
 *  #03DAC5  teal     — secondary / default text
 *  #121212  black    — background
 *  #CF6679  red      — errors
 */
export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#BB86FC' // violet
    },
    secondary: {
      main: '#03DAC5' // teal
    },
    error: {
      main: '#CF6679'
    },
    background: {
      default: '#121212',
      paper: '#1a1a1a'
    },
    divider: '#333333',
    text: {
      primary: '#03DAC5',
      secondary: '#BB86FC'
    }
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Roboto Mono", monospace'
  },
  components: {
    MuiDivider: {
      styleOverrides: {
        root: { backgroundColor: '#333' }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0d0d0d',
          borderBottom: '1px solid #333'
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '0.05em'
        }
      }
    }
  }
})
