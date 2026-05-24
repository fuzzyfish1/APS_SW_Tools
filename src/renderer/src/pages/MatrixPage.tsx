// 8x8 LED matrix bitmap editor
// paint cells, manage multiple image canvases, copy the generated C++ into your sketch
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  memo,
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

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))

export const rgbToString = (r: number, g: number, b: number): string =>
  `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`

const parseRgb = (s: string): { r: number; g: number; b: number } => {
  const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  return m ? { r: +m[1], g: +m[2], b: +m[3] } : { r: 0, g: 0, b: 0 }
}

const BLACK = 'rgb(0, 0, 0)'
const emptyGrid = (): string[] => Array(64).fill(BLACK)

// each canvas the user is working on

interface Pane {
  id: string
  name: string
  delay: number       // ms to wait after drawImage() for this frame
  grid: string[]
  undoStack: string[][]
  redoStack: string[][]
}

let _counter = 0
const nextId = () => `pane_${++_counter}`

const createPane = (name: string): Pane => ({
  id: nextId(),
  name,
  delay: 100,
  grid: emptyGrid(),
  undoStack: [],
  redoStack: [],
})

// code generation
// matches the format from drawImageExample - uint32_t name[8][8] with matrix.Color()

// builds one frame's array declaration
const buildFrameDecl = (name: string, grid: string[]): string => {
  const varName = name.trim() || 'frame'
  const rows: string[] = []
  for (let row = 0; row < 8; row++) {
    const cells = grid.slice(row * 8, row * 8 + 8).map((c) => {
      const { r, g, b } = parseRgb(c)
      return `matrix.Color(${r}, ${g}, ${b})`
    })
    rows.push('    { ' + cells.join(', ') + ' }')
  }
  return [`uint32_t ${varName}[8][8] = {`, rows.join(',\n'), `};`].join('\n')
}

// single frame - just the array, nothing else
const generateSingleCode = (name: string, grid: string[]): string =>
  buildFrameDecl(name, grid)

// animation - all frame arrays at the top, then drawImage/delay calls in order, no loops
const generateAnimationCode = (panes: Pane[]): string => {
  const decls = panes.map((p) => buildFrameDecl(p.name.trim() || 'frame', p.grid)).join('\n\n')

  const calls = panes
    .map((p) => {
      const v = p.name.trim() || 'frame'
      return `drawImage(matrix, ${v});\ndelay(${p.delay});`
    })
    .join('\n')

  return decls + '\n\n' + calls
}

// ─── Memoized grid cell — only re-renders when its own colour changes ─────────

interface GridCellProps {
  color: string
  onMouseDown: () => void
  onMouseEnter: () => void
}

const GridCell = memo(({ color, onMouseDown, onMouseEnter }: GridCellProps) => (
  <Box
    onMouseDown={onMouseDown}
    onMouseEnter={onMouseEnter}
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
))
GridCell.displayName = 'GridCell'

// small thumbnail preview per pane - memoized so painting the active pane
// doesn't re-render every other thumbnail in the list

const PanePreview = memo(({ grid, size = 64 }: { grid: string[]; size?: number }) => {
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
})
PanePreview.displayName = 'PanePreview'

const MatrixPage: React.FC = () => {
  const [panes, setPanes] = useState<Pane[]>([createPane('frame1')])
  const [activePaneId, setActivePaneId] = useState<string>(() => panes[0].id)

  const [redVal, setRedVal] = useState(80)
  const [greenVal, setGreenVal] = useState(15)
  const [blueVal, setBlueVal] = useState(0)

  // ref instead of state so mouse-enter while dragging doesn't trigger renders
  const isMouseDownRef = useRef(false)

  // saves the grid state at the start of each stroke so we push one undo entry
  // per drag, not one per cell
  const strokeStartRef = useRef<{ paneId: string; grid: string[] } | null>(null)

  // eyedropper - samples any pixel on screen using the EyeDropper API
  // only available in Chrome/Edge/Electron, not Firefox/Safari
  const eyedropperSupported = typeof window !== 'undefined' && 'EyeDropper' in window

  const handleEyedropper = useCallback(async () => {
    if (!eyedropperSupported) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dropper = new (window as any).EyeDropper()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await dropper.open()
      const raw: string = (result?.sRGBHex ?? '').trim()
      // chrome returns 'rgba(r, g, b, a)' despite the property being called sRGBHex
      // try rgba(...) first, then fall back to #rrggbb
      const rgbaMatch = raw.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      const hexMatch  = raw.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/)
      if (rgbaMatch) {
        setRedVal(parseInt(rgbaMatch[1], 10))
        setGreenVal(parseInt(rgbaMatch[2], 10))
        setBlueVal(parseInt(rgbaMatch[3], 10))
      } else if (hexMatch) {
        setRedVal(parseInt(hexMatch[1], 16))
        setGreenVal(parseInt(hexMatch[2], 16))
        setBlueVal(parseInt(hexMatch[3], 16))
      } else {
        console.warn('[eyedropper] unknown format:', raw)
      }
    } catch {
      // user pressed Escape to cancel - not an error
    }
  }, [eyedropperSupported])

  const [showAnimCode, setShowAnimCode] = useState(false)

  // show animation button only when user scrolls to the top of the right panel
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

  // on mouseup: stop painting and commit the entire stroke as one undo entry
  useEffect(() => {
    const up = () => {
      isMouseDownRef.current = false
      if (!strokeStartRef.current) return
      const { paneId, grid: startGrid } = strokeStartRef.current
      strokeStartRef.current = null
      // only push if the grid actually changed during the stroke
      setPanes((prev) =>
        prev.map((p) => {
          if (p.id !== paneId || p.grid === startGrid) return p
          return {
            ...p,
            undoStack: [...p.undoStack.slice(-49), startGrid],
            redoStack: [],
          }
        })
      )
    }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  // ctrl+z / ctrl+shift+z / ctrl+y for undo/redo
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

  const updateActive = useCallback(
    (updater: (p: Pane) => Pane) => {
      setPanes((prev) =>
        prev.map((p) => (p.id === activePaneId ? updater(p) : p)),
      )
    },
    [activePaneId],
  )

  // just update the grid - undo is committed in the mouseup handler
  const paintCell = useCallback(
    (idx: number) => {
      updateActive((p) => {
        if (p.grid[idx] === currentColor) return p
        const next = [...p.grid]
        next[idx] = currentColor
        return { ...p, grid: next }
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

  const setDelay = useCallback(
    (delay: number) => updateActive((p) => ({ ...p, delay })),
    [updateActive],
  )

  // drag and drop to reorder panes
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
    () => generateAnimationCode(panes),
    [panes],
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

          {/* Per-frame delay */}
          <TextField
            label="Frame delay (ms)"
            type="number"
            value={activePane.delay}
            onChange={(e) => setDelay(Math.max(0, +e.target.value))}
            size="small"
            fullWidth
            helperText="delay() after drawImage()"
            inputProps={{ min: 0 }}
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

            {/* eyedropper - samples any pixel on screen
                Chrome/Edge/Electron only (not Firefox) */}
            <Tooltip title={eyedropperSupported ? 'Eyedropper — pick colour from screen' : 'Eyedropper not supported in this browser'}>
              <span>
                <IconButton
                  size="small"
                  sx={{ color: eyedropperSupported ? 'primary.main' : 'text.disabled' }}
                  onClick={handleEyedropper}
                  disabled={!eyedropperSupported}
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
              <GridCell
                key={index}
                color={color}
                onMouseDown={() => {
                  isMouseDownRef.current = true
                  // snapshot the grid before this stroke starts
                  strokeStartRef.current = { paneId: activePaneId, grid: activePane.grid }
                  paintCell(index)
                }}
                onMouseEnter={() => {
                  if (isMouseDownRef.current) paintCell(index)
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
