/**
 * MatrixPage — 8×8 LED matrix bitmap editor.
 *
 * Features
 * ────────
 * • Paint cells by clicking/dragging (mouse)
 * • Per-pane undo / redo (Ctrl+Z / Ctrl+Shift+Z)
 * • Multiple "Image Canvases" (panes) in the right panel
 * • Each pane has an independent variable name for code export
 * • Drag-and-drop pane reordering
 * • Single-frame C++ code generation (FastLED CRGB array)
 * • Multi-frame animation code generation (shown when ≥2 panes and
 *   the right panel is scrolled to the top)
 */
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react'
import {
  Box,
  Grid,
  Typography,
  Divider,
  Paper,
  Stack,
  Tooltip,
  IconButton,
  TextField,
  Button,
  Chip,
} from '@mui/material'
import UndoIcon from '@mui/icons-material/Undo'
import RedoIcon from '@mui/icons-material/Redo'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import ColorizeIcon from '@mui/icons-material/Colorize'
import AnimationIcon from '@mui/icons-material/Animation'

import ToolSlider from '../components/ToolSlider'
import ColorSquare from '../components/ColorSquare'
import CodeSnippet from '../components/CodeSnippet'

// ─── Colour helpers ──────────────────────────────────────────────────────────

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))

export const rgbToString = (r: number, g: number, b: number): string =>
  `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`

const parseRgb = (s: string): { r: number; g: number; b: number } => {
  const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  return m ? { r: +m[1], g: +m[2], b: +m[3] } : { r: 0, g: 0, b: 0 }
}

const BLACK = 'rgb(0, 0, 0)'
const emptyGrid = (): string[] => Array(64).fill(BLACK)

// ─── Pane model ───────────────────────────────────────────────────────────────

interface Pane {
  id: string
  name: string
  grid: string[]
  undoStack: string[][]
  redoStack: string[][]
}

let _counter = 0
const nextId = () => `pane_${++_counter}`

const createPane = (name: string): Pane => ({
  id: nextId(),
  name,
  grid: emptyGrid(),
  undoStack: [],
  redoStack: [],
})

// ─── Code generation ─────────────────────────────────────────────────────────

const generateSingleCode = (name: string, grid: string[]): string => {
  const varName = name.trim() || 'frame'
  const rows: string[] = []
  for (let row = 0; row < 8; row++) {
    const cells = grid.slice(row * 8, row * 8 + 8).map((c) => {
      const { r, g, b } = parseRgb(c)
      return `CRGB(${r},${g},${b})`
    })
    rows.push('  ' + cells.join(', '))
  }
  return `CRGB ${varName}[64] = {\n${rows.join(',\n')}\n};`
}

const generateAnimationCode = (panes: Pane[], delayMs: number): string => {
  const frameDecls = panes
    .map((p) => generateSingleCode(p.name, p.grid))
    .join('\n\n')

  const names = panes.map((p) => p.name.trim() || 'frame').join(', ')

  const footer = [
    '',
    `const CRGB* animation[] = { ${names} };`,
    `const uint8_t  ANIMATION_FRAMES = ${panes.length};`,
    `const uint16_t FRAME_DELAY_MS   = ${delayMs};`,
    '',
    'void playAnimation(CRGB* leds) {',
    '  for (uint8_t i = 0; i < ANIMATION_FRAMES; i++) {',
    '    memcpy(leds, animation[i], 64 * sizeof(CRGB));',
    '    FastLED.show();',
    '    delay(FRAME_DELAY_MS);',
    '  }',
    '}',
  ].join('\n')

  return frameDecls + '\n' + footer
}

// ─── Mini 8×8 canvas preview ─────────────────────────────────────────────────

const PanePreview: React.FC<{ grid: string[]; size?: number }> = ({
  grid,
  size = 64,
}) => {
  const cell = Math.floor(size / 8)
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(8, ${cell}px)`,
        gap: '1px',
        bgcolor: '#0a0a0a',
        p: '1px',
        borderRadius: '2px',
        flexShrink: 0,
      }}
    >
      {grid.map((color, i) => (
        <Box
          key={i}
          sx={{ width: cell - 1, height: cell - 1, bgcolor: color }}
        />
      ))}
    </Box>
  )
}

// ─── MatrixPage ───────────────────────────────────────────────────────────────

const MatrixPage: React.FC = () => {
  // Pane state
  const [panes, setPanes] = useState<Pane[]>([createPane('frame1')])
  const [activePaneId, setActivePaneId] = useState<string>(() => panes[0].id)

  // Colour picker
  const [redVal, setRedVal] = useState(80)
  const [greenVal, setGreenVal] = useState(15)
  const [blueVal, setBlueVal] = useState(0)

  // Drawing
  const [isMouseDown, setIsMouseDown] = useState(false)

  // Code output controls
  const [showAnimCode, setShowAnimCode] = useState(false)
  const [animDelayMs, setAnimDelayMs] = useState(100)

  // Right-panel scroll tracker (animation button only visible at top)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const [atTop, setAtTop] = useState(true)

  // Drag-and-drop source index
  const dragSrcRef = useRef<number | null>(null)

  // ── Derived ───────────────────────────────────────────────────────────────
  const activePane =
    panes.find((p) => p.id === activePaneId) ?? panes[0]
  const currentColor = rgbToString(redVal, greenVal, blueVal)
  const canUndo = activePane.undoStack.length > 0
  const canRedo = activePane.redoStack.length > 0

  // ── Scroll tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = rightPanelRef.current
    if (!el) return
    const onScroll = () => setAtTop(el.scrollTop < 10)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // ── Global mouse-up (stop painting if mouse released outside grid) ────────
  useEffect(() => {
    const up = () => setIsMouseDown(false)
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 'z') {
        e.preventDefault()
        e.shiftKey ? handleRedo() : handleUndo()
      }
      if (ctrl && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePaneId])  // re-bind when active pane changes

  // ── Pane helpers ──────────────────────────────────────────────────────────
  const updateActive = useCallback(
    (updater: (p: Pane) => Pane) => {
      setPanes((prev) =>
        prev.map((p) => (p.id === activePaneId ? updater(p) : p)),
      )
    },
    [activePaneId],
  )

  const paintCell = useCallback(
    (idx: number) => {
      updateActive((p) => {
        if (p.grid[idx] === currentColor) return p
        const next = [...p.grid]
        next[idx] = currentColor
        return {
          ...p,
          grid: next,
          undoStack: [...p.undoStack.slice(-49), p.grid],
          redoStack: [],
        }
      })
    },
    [currentColor, updateActive],
  )

  const handleUndo = useCallback(() => {
    updateActive((p) => {
      if (p.undoStack.length === 0) return p
      const prev = p.undoStack[p.undoStack.length - 1]
      return {
        ...p,
        grid: prev,
        undoStack: p.undoStack.slice(0, -1),
        redoStack: [p.grid, ...p.redoStack.slice(0, 49)],
      }
    })
  }, [updateActive])

  const handleRedo = useCallback(() => {
    updateActive((p) => {
      if (p.redoStack.length === 0) return p
      const next = p.redoStack[0]
      return {
        ...p,
        grid: next,
        undoStack: [...p.undoStack.slice(-49), p.grid],
        redoStack: p.redoStack.slice(1),
      }
    })
  }, [updateActive])

  const addPane = useCallback(() => {
    const pane = createPane(`frame${_counter + 1}`)
    setPanes((prev) => [pane, ...prev])
    setActivePaneId(pane.id)
    setShowAnimCode(false)
  }, [])

  const deletePane = useCallback(
    (id: string) => {
      setPanes((prev) => {
        if (prev.length <= 1) return prev
        const next = prev.filter((p) => p.id !== id)
        if (activePaneId === id) setActivePaneId(next[0].id)
        return next
      })
    },
    [activePaneId],
  )

  const renamePane = useCallback(
    (name: string) => updateActive((p) => ({ ...p, name })),
    [updateActive],
  )

  // ── Drag-and-drop reordering ──────────────────────────────────────────────
  const onDragStart =
    (idx: number) => (e: React.DragEvent) => {
      dragSrcRef.current = idx
      e.dataTransfer.effectAllowed = 'move'
    }

  const onDragOver =
    (idx: number) => (e: React.DragEvent) => {
      e.preventDefault()
      const src = dragSrcRef.current
      if (src === null || src === idx) return
      setPanes((prev) => {
        const arr = [...prev]
        const [item] = arr.splice(src, 1)
        arr.splice(idx, 0, item)
        return arr
      })
      dragSrcRef.current = idx
    }

  const onDragEnd = () => {
    dragSrcRef.current = null
  }

  // ── Code output ───────────────────────────────────────────────────────────
  const singleCode = useMemo(
    () => generateSingleCode(activePane.name, activePane.grid),
    [activePane.name, activePane.grid],
  )

  const animCode = useMemo(
    () => generateAnimationCode(panes, animDelayMs),
    [panes, animDelayMs],
  )

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Grid container sx={{ flexGrow: 1, height: '100%' }}>
        {/* ── LEFT PANEL: Tools ─────────────────────────────────────────── */}
        <Grid
          size={3}
          sx={{
            borderRight: '1px solid',
            borderColor: 'divider',
            p: 2,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Typography variant="h6" sx={{ color: 'primary.main' }}>
            Tools
          </Typography>
          <Divider />

          {/* Undo / Redo */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton
                  size="small"
                  sx={{ color: 'primary.main' }}
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Shift+Z)">
              <span>
                <IconButton
                  size="small"
                  sx={{ color: 'primary.main' }}
                  onClick={handleRedo}
                  disabled={!canRedo}
                >
                  <RedoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* Variable name for the active pane */}
          <TextField
            label="Variable name"
            value={activePane.name}
            onChange={(e) => renamePane(e.target.value)}
            size="small"
            fullWidth
            helperText="Used in generated C++ code"
            sx={{
              '& .MuiOutlinedInput-root': { color: 'text.primary' },
              '& .MuiInputLabel-root': { color: 'text.secondary' },
              '& .MuiFormHelperText-root': {
                color: 'text.secondary',
                opacity: 0.6,
              },
            }}
          />

          <Divider />

          {/* RGB sliders */}
          <ToolSlider
            label="Red"
            value={redVal}
            min={0}
            max={255}
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

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Current colour">
              <span>
                <ColorSquare color={currentColor} />
              </span>
            </Tooltip>
            <Tooltip title="Pick colour (native picker coming soon)">
              <span>
                <IconButton
                  size="small"
                  sx={{ color: 'primary.main' }}
                  disabled
                >
                  <ColorizeIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Divider />

          {/* Undo/redo depth hint */}
          <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.5 }}>
            {canUndo
              ? `${activePane.undoStack.length} undo step${activePane.undoStack.length !== 1 ? 's' : ''}`
              : 'Nothing to undo'}
          </Typography>
        </Grid>

        {/* ── CENTRE PANEL: Grid editor + code output ────────────────────── */}
        <Grid
          size={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            p: 3,
            gap: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h5" sx={{ color: 'primary.main' }}>
              Matrix Editor
            </Typography>
            <Chip
              label={activePane.name || 'untitled'}
              size="small"
              sx={{
                bgcolor: 'rgba(187,134,252,0.1)',
                color: 'primary.main',
                fontFamily: 'monospace',
                fontSize: '10px',
              }}
            />
          </Stack>

          {/* 8×8 drawing grid */}
          <Paper
            elevation={4}
            sx={{
              p: 1,
              bgcolor: '#1e1e1e',
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '4px',
              width: '100%',
              maxWidth: 500,
              aspectRatio: '1 / 1',
              userSelect: 'none',
              alignSelf: 'flex-start',
            }}
          >
            {activePane.grid.map((color, index) => (
              <Box
                key={index}
                onMouseDown={() => {
                  setIsMouseDown(true)
                  paintCell(index)
                }}
                onMouseEnter={() => {
                  if (isMouseDown) paintCell(index)
                }}
                sx={{
                  bgcolor: color,
                  borderRadius: '2px',
                  cursor: 'crosshair',
                  transition: 'background-color 0.1s ease',
                  border: '1px solid rgba(255,255,255,0.05)',
                  '&:hover': {
                    filter: 'brightness(1.2)',
                    borderColor: 'primary.main',
                  },
                }}
              />
            ))}
          </Paper>

          {/* Code output */}
          <Paper
            variant="outlined"
            sx={{ bgcolor: '#1e1e1e', borderColor: 'divider' }}
          >
            <CodeSnippet
              code={showAnimCode ? animCode : singleCode}
              language="cpp"
            />

            {/* Animation delay control — shown when animation code is active */}
            {showAnimCode && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ px: 2, pb: 1.5 }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  Frame delay:
                </Typography>
                <TextField
                  type="number"
                  value={animDelayMs}
                  onChange={(e) =>
                    setAnimDelayMs(Math.max(1, +e.target.value))
                  }
                  size="small"
                  sx={{
                    width: 90,
                    '& input': { color: 'text.primary', py: '4px' },
                  }}
                  inputProps={{ min: 1 }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  ms
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* ── RIGHT PANEL: Image Canvases ────────────────────────────────── */}
        <Grid
          size={3}
          sx={{
            borderLeft: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Sticky header */}
          <Box
            sx={{
              p: 2,
              pb: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6" sx={{ color: 'primary.main' }}>
                Image Canvases
              </Typography>
              <Tooltip title="New canvas">
                <IconButton
                  size="small"
                  sx={{ color: 'primary.main' }}
                  onClick={addPane}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', opacity: 0.5 }}
            >
              {panes.length} canvas{panes.length !== 1 ? 'es' : ''} —
              drag to reorder
            </Typography>
          </Box>

          {/* Scrollable pane list */}
          <Box
            ref={rightPanelRef}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {/* Animation code button — only shown when scrolled to top and ≥2 panes */}
            {atTop && panes.length >= 2 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AnimationIcon />}
                onClick={() => setShowAnimCode((v) => !v)}
                sx={{
                  mb: 0.5,
                  color: showAnimCode ? 'secondary.main' : 'primary.main',
                  borderColor: showAnimCode ? 'secondary.main' : 'divider',
                  fontSize: '11px',
                  textTransform: 'none',
                }}
              >
                {showAnimCode
                  ? 'Hide animation code'
                  : 'Generate animation code'}
              </Button>
            )}

            {panes.map((pane, idx) => (
              <Box
                key={pane.id}
                draggable
                onDragStart={onDragStart(idx)}
                onDragOver={onDragOver(idx)}
                onDragEnd={onDragEnd}
                onClick={() => {
                  setActivePaneId(pane.id)
                  setShowAnimCode(false)
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: '6px',
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor:
                    pane.id === activePaneId ? 'primary.main' : 'divider',
                  bgcolor:
                    pane.id === activePaneId
                      ? 'rgba(187,134,252,0.08)'
                      : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.04)',
                  },
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
              >
                {/* Drag handle */}
                <DragIndicatorIcon
                  sx={{ color: 'divider', fontSize: 16, flexShrink: 0 }}
                />

                {/* Mini 8×8 preview */}
                <PanePreview grid={pane.grid} size={56} />

                {/* Name + index */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        pane.id === activePaneId
                          ? 'primary.main'
                          : 'text.primary',
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      fontSize: '11px',
                    }}
                  >
                    {pane.name || 'untitled'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      opacity: 0.45,
                      fontSize: '9px',
                    }}
                  >
                    #{idx + 1}
                  </Typography>
                </Box>

                {/* Delete button */}
                <Tooltip title="Delete canvas">
                  <span>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        deletePane(pane.id)
                      }}
                      disabled={panes.length <= 1}
                      sx={{
                        color: 'error.main',
                        opacity: 0.55,
                        '&:hover': { opacity: 1 },
                        p: '2px',
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default MatrixPage
