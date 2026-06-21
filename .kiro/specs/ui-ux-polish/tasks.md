# Implementation Plan: UI/UX Polish

## Overview

Comprehensive visual and audio polish for Flappy Kiro: ambient procedural music engine, refined color palette via CSS custom properties, enhanced glow effects, smooth state transitions, score animations, interactive feedback, typography refinement, canvas background enhancement, and reduced motion accessibility. All changes are contained within `style.css`, `app.js`, and `index.html` with no external libraries.

## Tasks

- [x] 1. Define color palette and typography foundation
  - [x] 1.1 Add CSS custom properties for the refined color palette
    - Add `:root` block with `--bg-primary`, `--accent-primary`, `--accent-secondary`, `--text-primary`, `--surface-muted`, `--bg-gradient-bottom`, `--grid-line-color`
    - Update `body` background to `var(--bg-primary)`
    - Update all existing color references (`#1a1a2e`, `#a855f7`, `#e0e0e0`, etc.) to use the new custom properties
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.2 Apply typography refinements
    - Change all `font-family: monospace` declarations to `'Courier New', Courier, monospace`
    - Set `#start-overlay h1` to `font-size: 36px`, `letter-spacing: 6px`, `text-transform: uppercase`
    - Set overlay body text to `font-size: 15px`, `line-height: 1.6`
    - Set `#score-overlay` to `font-size: 52px`, `font-weight: bold`, `letter-spacing: 2px`
    - Add `text-shadow: 0 1px 2px rgba(0,0,0,0.8)` to body text elements
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Implement enhanced glow effects and interactive feedback
  - [x] 2.1 Add multi-layer box-shadow glows to buttons
    - Apply `box-shadow: 0 0 8px var(--accent-primary), 0 0 16px rgba(179,102,255,0.6), 0 0 32px rgba(179,102,255,0.3)` to interactive buttons
    - Add hover state increasing outer glow to `48px` and mid opacity to `80%` with `200ms` transition
    - Apply text-shadow glow to headings: `0 0 10px`, `0 0 20px` at 60%, `0 0 40px` at 30%
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.2 Add interactive feedback CSS
    - Add `button:active { transform: scale(0.95); transition: transform 100ms ease; }`
    - Add `@keyframes charge-full-pulse` using primary accent oscillating border between 40% and 100% opacity over 1200ms
    - Add `.btn-reveal` class with opacity 0, scale 0.8, transitioning to opacity 1, scale 1.0 over 300ms
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3. Implement state transition animations
  - [x] 3.1 Add overlay transition CSS classes
    - Create `.overlay-fade-in` class with `opacity: 0`, `transform: translateY(10px)`, `transition: opacity 400ms ease-out, transform 400ms ease-out`
    - Create `.overlay-fade-in.visible` with `opacity: 1`, `transform: translateY(0)`
    - Add score pulse keyframe: `@keyframes score-pulse { 0% { scale(1.0) } 50% { scale(1.3) } 100% { scale(1.0) } }` at 200ms
    - Add `.score-pulse` class referencing the keyframe
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1_

  - [x] 3.2 Add transition JavaScript helpers in app.js
    - Implement `showOverlay(element)` — sets `display: flex`, forces reflow, adds `.visible` class
    - Implement `hideOverlay(element)` — removes `.visible` class
    - Implement `triggerScorePulse(scoreElement)` — removes/re-adds `.score-pulse` class with reflow between
    - Wire helpers into existing state transition logic (replace direct `style.opacity` / `style.display` changes)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2_

- [x] 4. Checkpoint - Ensure transitions and palette work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement canvas background enhancement
  - [x] 5.1 Add background grid constants and pure functions in app.js
    - Add constants: `GRID_SPACING = 40`, `GRID_SCROLL_SPEED = 0.5`
    - Implement `calculateGridOffset(frameCount, reducedMotion)` — returns `(frameCount * 0.5) % 40` or 0 when reduced motion
    - Implement `renderBackground(ctx, canvasWidth, canvasHeight, gridOffset)` — vertical gradient #0f0f23 → #1a0a2e plus grid lines at 40px intervals
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 5.2 Integrate canvas background into game render loop
    - Replace existing background fill with `renderBackground()` call at the start of each frame
    - Track `frameCount` variable; pass to `calculateGridOffset` each frame
    - Ensure grid scrolls only during PLAYING state
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 5.3 Add enhanced canvas glow effects for entities
    - Render data packets with `shadowBlur: 15`, `shadowColor: var(--accent-secondary)` (#00e5ff)
    - Render Ghosty with `shadowBlur: 10`, `shadowColor: var(--accent-primary)` (#b366ff) during normal play
    - During Steering Mode, increase Ghosty shadowBlur to 25 and pulse opacity 60%–100% over 1000ms cycle
    - Implement `calculateGlowOpacity(elapsedMs, reducedMotion)` pure function using sinusoidal oscillation
    - _Requirements: 3.4, 3.5, 3.6, 2.7_

  - [x] 5.4 Write property test for calculateGlowOpacity
    - **Property 4: Glow pulse opacity bounds**
    - **Validates: Requirements 3.6**

  - [x] 5.5 Write property test for calculateGridOffset
    - **Property 7: Grid scroll offset correctness**
    - **Validates: Requirements 9.3, 9.4**

- [x] 6. Implement ambient lo-fi music engine
  - [x] 6.1 Add music engine constants and state factory
    - Add all music constants at top of app.js: `MUSIC_MASTER_GAIN`, `MUSIC_VOICES_MIN/MAX`, `MUSIC_DETUNE_MIN/MAX`, `MUSIC_ATTACK_MS`, `MUSIC_RELEASE_MS`, `MUSIC_CHORD_DURATION_MIN/MAX`, `MUSIC_PAUSE_FADE_MS`, `MUSIC_GAMEOVER_FADE_MS`
    - Add `CHORD_VOICINGS` array (4 voicings with warm minor/major7 frequencies)
    - Implement `createMusicEngine()` returning initial state object
    - Implement `initMusicContext(engine)` creating AudioContext and master GainNode
    - _Requirements: 1.1, 1.8, 1.9_

  - [x] 6.2 Implement chord generation and playback functions
    - Implement `generateChordVoices(chordFrequencies)` — returns 2–4 voices with detune [2, 8] cents, alternating sine/triangle
    - Implement `validateChordVoices(voices)` — pure validation function
    - Implement `getNextChordDuration()` — random duration in [3000, 6000] ms
    - Implement `startMusic(engine)` — creates oscillators from voices, connects through gain nodes, schedules chord cycling
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 6.3 Implement music lifecycle controls
    - Implement `pauseMusic(engine)` — linear ramp gain to 0 over 300ms
    - Implement `resumeMusic(engine)` — linear ramp gain to MUSIC_MASTER_GAIN over 300ms
    - Implement `stopMusic(engine)` — fade gain to 0 over 500ms, then stop oscillators
    - Wire music start/pause/resume/stop into state transitions
    - Initialize AudioContext on first user gesture (click/keydown)
    - _Requirements: 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 6.4 Write property test for generateChordVoices
    - **Property 1: Music engine voice count and detune bounds**
    - **Validates: Requirements 1.3**

- [x] 7. Checkpoint - Ensure music and background render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement reduced motion accessibility
  - [x] 8.1 Expand reduced motion CSS media query
    - Replace existing limited `@media (prefers-reduced-motion: reduce)` with comprehensive universal selector: `*, *::before, *::after { transition-duration: 0ms !important; animation: none !important; }`
    - Ensure overlays fall back to instant show/hide
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 8.2 Wire reduced motion into canvas rendering
    - Use existing `reducedMotionEnabled` flag in `calculateGlowOpacity` (returns static 0.7)
    - Use flag in `calculateGridOffset` (returns 0, no scrolling)
    - Ensure glow pulse on Ghosty during Steering Mode is static when reduced motion is active
    - _Requirements: 8.3_

  - [x] 8.3 Write property test for reduced motion static glow
    - **Property 5: Reduced motion static glow**
    - **Validates: Requirements 8.3**

- [x] 9. Final integration and wiring
  - [x] 9.1 Wire score animation into scoring logic
    - Call `triggerScorePulse()` on score increment in the game update loop
    - Add temporary text-shadow intensification on score element (full opacity → 50% over 300ms)
    - Add high score continuous pulse animation in death recap (text-shadow oscillation over 1500ms)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 9.2 Wire charge bar and steering button feedback
    - Add `charge-full` class to `#steering-charge-container` when charge reaches 100%
    - Apply `.btn-reveal` transition to steering activate button on visibility
    - Apply help overlay fade (opacity 0→1 over 250ms with scale 0.95→1.0) on help button press
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 9.3 Ensure palette consistency across canvas and DOM
    - Verify all canvas `fillStyle`/`strokeStyle` values use palette constants (PALETTE object or hex literals matching design)
    - Verify all DOM overlay colors reference CSS custom properties
    - Ensure particle colors align with new palette
    - _Requirements: 2.6, 2.7_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All audio is procedural via Web Audio API — no external audio files
- All changes respect the existing single-page architecture (index.html, style.css, app.js)
- The existing `reducedMotionEnabled` flag and `checkReducedMotion()` function are reused for canvas glow/grid logic

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "5.1", "6.1"] },
    { "id": 2, "tasks": ["3.1", "5.2", "5.3", "6.2"] },
    { "id": 3, "tasks": ["3.2", "5.4", "5.5", "6.3"] },
    { "id": 4, "tasks": ["6.4", "8.1"] },
    { "id": 5, "tasks": ["8.2", "8.3"] },
    { "id": 6, "tasks": ["9.1", "9.2", "9.3"] }
  ]
}
```
