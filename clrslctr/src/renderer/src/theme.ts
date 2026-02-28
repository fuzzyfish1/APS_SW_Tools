import { createTheme } from '@mui/material/styles';

/** colorPallete
#BB86FC <violet>

#3700B3 <Blue>

#03DAC5 <teal>

#121212 <Black/Background>

#CF6679 <red/Errors>
*/

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#BB86FC', // Violet
    },
    secondary: {
      main: '#03DAC5', // Teal
    },
    error: {
      main: '#CF6679', // Red/Errors
    },
    background: {
      default: '#121212', // Black/Background
      paper: '#121212',   // Consistent black for panels
    },
    divider: '#333333',   // Matching your original CSS border color
    text: {
      primary: '#03DAC5', // Making teal your default text color as per your CSS
    },
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Roboto Mono", monospace', // Optional: looks great for dev tools
  },
  components: {
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: '#333',
        },
      },
    },
  },
});
