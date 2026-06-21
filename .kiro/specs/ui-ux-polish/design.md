# Design Document: UI/UX Polish

## Overview

This feature adds comprehensive visual and audio polish to Flappy Kiro through an ambient procedural music engine, refined color palette, enhanced glow effects, smooth state transitions, score animations, interactive feedback, typography refinement, canvas background enhancement, and reduced motion accessibility. All changes are contained within the existing single-page architecture (index.html, style.css, app.js) using no external libraries or audio files.

## Architecture

The implementation follows the existing separation of concerns:

- **style.css**: Color palette variables, glow effects, transition animations, typography, reduced motion overrides
- **app.js**: Music engine module, canvas background renderer, glow pulse calculations, grid scroll logic
- **index.html**: No structural changes required (existing DOM overlays are sufficient)

### Component Interaction Flow

```
State Transition Event
  ├── Transition_System (CSS classes toggle opacity/transform)
  ├── Music_Engine (gain ramp / oscillator lifecycle)
  └── Canvas_Renderer (background gradient + grid scroll)

Game Loop (per frame)
  ├── update(dt)
  │   └── gridOffset += 0.5 (if !reducedMotion)
  └── render()
      ├── drawBackground(gradient + grid)
      ├── drawEntities(with enhanced glows)
      └── (DOM overlays handled separately via CSS)
```

## Components and Interfaces

### 1. Music Engine (app.js)

A self-contained procedural audio module using the Web Audio API.

```javascript
// === Music Engine Constants ===
const MUSIC_MASTER_GAIN = 0.12;
const MUSIC_VOICES_MIN = 2;
const MUSIC_VOICES_MAX = 4;
const MUSIC_DETUNE_MIN = 2;    // cents
const MUSIC_DETUNE_MAX = 8;    // cents
const MUSIC_ATTACK_MS = 500;
const MUSIC_RELEASE_MS = 800;
const MUSIC_CHORD_DURATION_MIN = 3000; // ms
const MUSIC_CHORD_DURATION_MAX = 6000; // ms
const MUSIC_PAUSE_FADE_MS = 300;
const MUSIC_GAMEOVER_FADE_MS = 500;

// Chord voicings (frequencies in Hz) — warm minor/major7 voicings
const CHORD_VOICINGS = [
  [130.81, 164.81, 196.00, 246.94],  // C3 E3 G3 B3
  [146.83, 174.61, 220.00, 261.63],  // D3 F3 A3 C4
  [164.81, 196.00, 246.94, 311.13],  // E3 G3 B3 Eb4
  [174.61, 220.00, 261.63, 329.63],  // F3 A3 C4 E4
];

/**
 * Creates the music engine state object.
 * Returns an object managing AudioContext, oscillators, and gain nodes.
 */
function createMusicEngine() {
  return {
    ctx: null,
    masterGain: null,
    oscillators: [],
    currentChordIndex: 0,
    chordTimer: null,
    isPlaying: false
  };
}

/**
 * Initializes the AudioContext and master gain node.
 * Must be called from a user gesture handler.
 */
function initMusicContext(engine) {
  engine.ctx = new (window.AudioContext || window.webkitAudioContext)();
  engine.masterGain = engine.ctx.createGain();
  engine.masterGain.gain.value = 0;
  engine.masterGain.connect(engine.ctx.destination);
}

/**
 * Generates a chord voicing configuration.
 * Returns an array of { frequency, detune, waveType } objects.
 * Voice count is between MUSIC_VOICES_MIN and MUSIC_VOICES_MAX.
 */
function generateChordVoices(chordFrequencies) {
  const voiceCount = MUSIC_VOICES_MIN + Math.floor(
    Math.random() * (MUSIC_VOICES_MAX - MUSIC_VOICES_MIN + 1)
  );
  const voices = [];
  for (let i = 0; i < voiceCount; i++) {
    const freq = chordFrequencies[i % chordFrequencies.length];
    const detune = MUSIC_DETUNE_MIN + Math.random() * (MUSIC_DETUNE_MAX - MUSIC_DETUNE_MIN);
    voices.push({
      frequency: freq,
      detune: detune,
      waveType: i % 2 === 0 ? 'sine' : 'triangle'
    });
  }
  return voices;
}

/**
 * Calculates the next chord duration (ms).
 * Returns a value between MUSIC_CHORD_DURATION_MIN and MUSIC_CHORD_DURATION_MAX.
 */
function getNextChordDuration() {
  return MUSIC_CHORD_DURATION_MIN + Math.random() * (MUSIC_CHORD_DURATION_MAX - MUSIC_CHORD_DURATION_MIN);
}

/**
 * Pure function: validates that a chord voice configuration meets constraints.
 * voiceCount in [MUSIC_VOICES_MIN, MUSIC_VOICES_MAX],
 * each detune in [MUSIC_DETUNE_MIN, MUSIC_DETUNE_MAX].
 */
function validateChordVoices(voices) {
  if (voices.length < MUSIC_VOICES_MIN || voices.length > MUSIC_VOICES_MAX) return false;
  for (const v of voices) {
    if (v.detune < MUSIC_DETUNE_MIN || v.detune > MUSIC_DETUNE_MAX) return false;
  }
  return true;
}
```

### 2. Color Palette (style.css — CSS Custom Properties)

```css
:root {
  --bg-primary: #0f0f23;
  --accent-primary: #b366ff;
  --accent-secondary: #00e5ff;
  --text-primary: #f0e6ff;
  --surface-muted: #1a1a3e;
  --bg-gradient-bottom: #1a0a2e;
  --grid-line-color: rgba(179, 102, 255, 0.04);
}
```

### 3. Glow Pulse Calculator (app.js)

```javascript
// === Glow Pulse Constants ===
const GLOW_PULSE_MIN_OPACITY = 0.6;
const GLOW_PULSE_MAX_OPACITY = 1.0;
const GLOW_PULSE_PERIOD_MS = 1000;
const GLOW_REDUCED_MOTION_OPACITY = 0.7;

/**
 * Pure function: calculates glow opacity based on elapsed time.
 * Uses sinusoidal oscillation between min and max opacity.
 * Returns a static value when reducedMotion is true.
 */
function calculateGlowOpacity(elapsedMs, reducedMotion) {
  if (reducedMotion) return GLOW_REDUCED_MOTION_OPACITY;
  const phase = (elapsedMs % GLOW_PULSE_PERIOD_MS) / GLOW_PULSE_PERIOD_MS;
  const sinValue = Math.sin(phase * 2 * Math.PI);
  const normalized = (sinValue + 1) / 2; // [0, 1]
  return GLOW_PULSE_MIN_OPACITY + normalized * (GLOW_PULSE_MAX_OPACITY - GLOW_PULSE_MIN_OPACITY);
}
```

### 4. Canvas Background Renderer (app.js)

```javascript
// === Background Grid Constants ===
const GRID_SPACING = 40;          // pixels between grid lines
const GRID_SCROLL_SPEED = 0.5;    // pixels per frame

/**
 * Pure function: calculates the grid scroll offset for the current frame.
 * Returns 0 when reduced motion is enabled, otherwise (frameCount * speed) mod spacing.
 */
function calculateGridOffset(frameCount, reducedMotion) {
  if (reducedMotion) return 0;
  return (frameCount * GRID_SCROLL_SPEED) % GRID_SPACING;
}

/**
 * Renders the canvas background: vertical gradient + scrolling grid.
 * Receives pre-calculated gridOffset so rendering remains pure of state.
 */
function renderBackground(ctx, canvasWidth, canvasHeight, gridOffset) {
  // Vertical gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, '#0f0f23');
  gradient.addColorStop(1, '#1a0a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Grid lines
  ctx.strokeStyle = 'rgba(179, 102, 255, 0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  // Vertical lines (static)
  for (let x = 0; x < canvasWidth; x += GRID_SPACING) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
  }

  // Horizontal lines (scrolling)
  const startY = (gridOffset % GRID_SPACING) - GRID_SPACING;
  for (let y = startY; y < canvasHeight; y += GRID_SPACING) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
  }

  ctx.stroke();
}
```

### 5. Transition System (style.css + app.js)

CSS handles animation mechanics; JavaScript toggles classes on state transitions.

```css
/* Fade-in with translateY slide */
.overlay-fade-in {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 400ms ease-out, transform 400ms ease-out;
}

.overlay-fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Score pulse animation */
@keyframes score-pulse {
  0% { transform: scale(1.0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1.0); }
}

.score-pulse {
  animation: score-pulse 200ms ease-out;
}
```

```javascript
/**
 * Applies overlay transition by toggling CSS visibility classes.
 * The CSS handles timing; JS only manages class presence.
 */
function showOverlay(element) {
  element.style.display = 'flex';
  // Force reflow before adding visible class for transition trigger
  void element.offsetHeight;
  element.classList.add('visible');
}

function hideOverlay(element) {
  element.classList.remove('visible');
}
```

### 6. Score Animation (app.js + style.css)

```javascript
/**
 * Triggers the score pulse animation on increment.
 * Adds and removes CSS class to re-trigger keyframe.
 */
function triggerScorePulse(scoreElement) {
  scoreElement.classList.remove('score-pulse');
  void scoreElement.offsetHeight; // force reflow
  scoreElement.classList.add('score-pulse');
}
```

### 7. Interactive Feedback (style.css)

```css
/* Button press scale */
button:active {
  transform: scale(0.95);
  transition: transform 100ms ease;
}

/* Steering charge bar full pulse */
@keyframes charge-full-pulse {
  0%, 100% { border-color: rgba(179, 102, 255, 0.4); }
  50% { border-color: rgba(179, 102, 255, 1.0); }
}

#steering-charge-container.charge-full {
  animation: charge-full-pulse 1200ms ease-in-out infinite;
}

/* Button reveal animation */
.btn-reveal {
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}

.btn-reveal.visible {
  opacity: 1;
  transform: scale(1.0);
}
```

### 8. Reduced Motion (style.css)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0ms !important;
    animation: none !important;
  }
}
```

### 9. Interface Summary

### Music Engine API

| Function | Input | Output |
|----------|-------|--------|
| `createMusicEngine()` | — | `MusicEngine` object |
| `initMusicContext(engine)` | `MusicEngine` | void (mutates engine) |
| `generateChordVoices(frequencies)` | `number[]` | `Voice[]` |
| `validateChordVoices(voices)` | `Voice[]` | `boolean` |
| `getNextChordDuration()` | — | `number` (ms) |
| `startMusic(engine)` | `MusicEngine` | void |
| `pauseMusic(engine)` | `MusicEngine` | void |
| `resumeMusic(engine)` | `MusicEngine` | void |
| `stopMusic(engine)` | `MusicEngine` | void |

### Glow & Background API

| Function | Input | Output |
|----------|-------|--------|
| `calculateGlowOpacity(elapsedMs, reducedMotion)` | `number, boolean` | `number` [0.6–1.0] or 0.7 |
| `calculateGridOffset(frameCount, reducedMotion)` | `number, boolean` | `number` [0, GRID_SPACING) |
| `renderBackground(ctx, w, h, gridOffset)` | `CanvasCtx, number, number, number` | void (draws) |

### Transition API

| Function | Input | Output |
|----------|-------|--------|
| `showOverlay(element)` | `HTMLElement` | void |
| `hideOverlay(element)` | `HTMLElement` | void |
| `triggerScorePulse(scoreElement)` | `HTMLElement` | void |

## Data Models

### Voice Configuration

```javascript
/**
 * @typedef {Object} Voice
 * @property {number} frequency - Oscillator frequency in Hz
 * @property {number} detune - Detuning in cents [2, 8]
 * @property {'sine'|'triangle'} waveType - Oscillator wave form
 */
```

### Music Engine State

```javascript
/**
 * @typedef {Object} MusicEngine
 * @property {AudioContext|null} ctx
 * @property {GainNode|null} masterGain
 * @property {OscillatorNode[]} oscillators
 * @property {number} currentChordIndex
 * @property {number|null} chordTimer
 * @property {boolean} isPlaying
 */
```

### Color Palette Constants

```javascript
const PALETTE = {
  bgPrimary: '#0f0f23',
  accentPrimary: '#b366ff',
  accentSecondary: '#00e5ff',
  textPrimary: '#f0e6ff',
  surfaceMuted: '#1a1a3e',
  bgGradientBottom: '#1a0a2e',
};
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| AudioContext creation fails | Catch error silently; game runs without music |
| AudioContext suspended (autoplay policy) | Resume on first user gesture; music starts on next state transition |
| `prefers-reduced-motion` changes mid-game | MediaQueryList listener updates `reducedMotionEnabled` flag immediately; next frame uses new value |
| CSS transition not supported | Overlays fall back to instant show/hide (graceful degradation) |

## Testing Strategy

### Unit Tests (Example-Based)

- Verify color palette constants match specified hex values (Requirements 2.1–2.5)
- Verify music engine gain never exceeds 0.12 (Requirement 1.9)
- Verify CSS transition/animation values match specified durations (Requirements 4.1–4.5)
- Verify score pulse animation triggers scale(1.3) (Requirement 5.1)
- Verify button :active applies scale(0.95) (Requirement 6.1)
- Verify typography values (font-family, sizes, letter-spacing) (Requirements 7.1–7.5)
- Verify canvas gradient uses correct colors (Requirement 9.1)

### Property Tests (100+ iterations each)

- `generateChordVoices` always produces 2–4 voices with detune in [2, 8] cents
- `calculateGlowOpacity` always returns values in [0.6, 1.0] for any elapsed time
- `calculateGlowOpacity` returns exactly 0.7 when reduced motion is enabled
- `calculateGridOffset` produces correct offset for any frame count and motion setting
- Color contrast ratio between text and background meets WCAG 7:1 minimum

### Integration Tests

- Music engine starts/stops oscillators on state transitions
- Overlays fade in/out with correct CSS classes on state changes
- Charge bar pulse activates at 100% charge

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Music engine voice count and detune bounds

*For any* chord voicing generated by `generateChordVoices`, the number of voices SHALL be between 2 and 4 (inclusive), and each voice's detune value SHALL be between 2 and 8 cents (inclusive).

**Validates: Requirements 1.3**

### Property 2: Music engine envelope timing constraints

*For any* chord transition configuration produced by the music engine, the attack duration SHALL be at least 500 milliseconds and the release duration SHALL be at least 800 milliseconds.

**Validates: Requirements 1.4**

### Property 3: Color contrast ratio compliance

*For any* rendering of text using the defined text color (#f0e6ff) against the primary background color (#0f0f23), the WCAG 2.1 relative luminance contrast ratio SHALL be at least 7.0:1.

**Validates: Requirements 2.4**

### Property 4: Glow pulse opacity bounds

*For any* elapsed time value (in milliseconds) with reduced motion disabled, the computed glow opacity returned by `calculateGlowOpacity` SHALL be between 0.6 and 1.0 (inclusive).

**Validates: Requirements 3.6**

### Property 5: Reduced motion static glow

*For any* elapsed time value (in milliseconds) with reduced motion enabled, the computed glow opacity returned by `calculateGlowOpacity` SHALL be exactly 0.7.

**Validates: Requirements 8.3**

### Property 6: Reduced motion disables all CSS motion

*For any* element with a CSS transition or keyframe animation, when the `prefers-reduced-motion: reduce` media query is active, the effective transition-duration SHALL be 0ms and the effective animation SHALL be none.

**Validates: Requirements 8.1, 8.2**

### Property 7: Grid scroll offset correctness

*For any* non-negative frame count and reduced motion setting, the grid offset returned by `calculateGridOffset` SHALL equal 0 when reduced motion is enabled, and SHALL equal `(frameCount * 0.5) mod 40` when reduced motion is disabled, always producing a value in the range [0, 40).

**Validates: Requirements 9.3, 9.4**

### Property 8: Grid spacing invariant

*For any* canvas dimensions (width, height), the rendered background grid SHALL place lines at exactly 40-pixel intervals both horizontally and vertically.

**Validates: Requirements 9.2**

### Property 9: Overlay fade-in includes vertical slide

*For any* overlay text element undergoing a fade-in transition, the element SHALL have both an opacity transition (0 → 1) and a translateY transform (10px → 0px) applied simultaneously.

**Validates: Requirements 4.6**
