import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Grid } from '@mui/material';
import CodeSnippet from "./components/CodeSnippet.tsx";
import ToolSlider from "./components/ToolSlider.tsx";
import ColorSquare from "./components/ColorSquare.tsx";

const myCode = "int[] chicken = {1, 2, 3}";

export const rgbToString = (r: number, g: number, b: number): string => {
  // Clamp values between 0 and 255 to prevent CSS errors
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
};

const App: React.FC = () => {

  const [redVal, setRedVal] = useState(80);
  const [greenVal, setGreenVal] = useState(15);
  const [blueVal, setBlueVal] = useState(0);

  const currentColor = rgbToString(redVal, greenVal, blueVal);
  
  return (
    <Box sx={{ 
      display: 'flex', 
      width: '100vw', 
      height: '100vh', 
      bgcolor: 'background.default',
      color: 'text.primary', // This pulls the #03DAC5 from our theme
      overflow: 'hidden' 
    }}>
      <Grid container sx={{ flexGrow: 1 }}>
        
        {/* LEFT PANEL: Tools (Width matches Right) */}
        <Grid size={3} sx={{ 
          borderRight: '1px solid', 
          borderColor: 'divider',
          p: 2 
        }}>
          <Typography variant="h6" sx={{ color: 'primary.main' }}>Tools</Typography>
          <ToolSlider 
                  label="Red" 
                  value={redVal} 
                  min = {0}
                  max = {255} 
                  onChange={setRedVal} 
                />
          
          <ToolSlider 
                  label="Green" 
                  value={greenVal} 
                  min={0} 
                  max={255} 
                  onChange={setGreenVal} 
                />
          <ToolSlider 
                  label="Blue" 
                  value={blueVal} 
                  min={0}
                  max={255}
                  onChange={setBlueVal} 
                />
          <Typography variant="p" sx={{ color: 'primary.main' }}>current Color: </Typography>
          <ColorSquare color={currentColor} onClick={() => console.log('Violet')} />
          <Divider sx={{ my: 2 }} />
          
        </Grid>

        {/* CENTER PANEL: Workspace */}
        <Grid size={6} sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          overflowY: 'auto',
          p: 4 
        }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
            Main Working Area
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              bgcolor: '#1e1e1e', // Slightly lighter black to lift the workspace
              borderColor: 'divider'
            }}
          >
            <CodeSnippet code={myCode} language="c++" />
          </Paper>
        </Grid>

        {/* RIGHT PANEL: History (Width matches Left) */}
        <Grid size={3} sx={{ 
          borderLeft: '1px solid', 
          borderColor: 'divider',
          p: 2 
        }}>
          <Typography variant="h6" sx={{ color: 'primary.main' }}>History</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" sx={{ color: 'text.primary', opacity: 0.8 }}>
            Activity log...
          </Typography>
        </Grid>
        
      </Grid>
    </Box>
  );
};

export default App;
