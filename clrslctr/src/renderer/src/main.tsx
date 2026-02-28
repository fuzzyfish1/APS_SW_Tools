import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { appTheme } from './theme';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      {/* CssBaseline resets CSS and sets the background color to theme.palette.background.default */}
      <CssBaseline /> 
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
