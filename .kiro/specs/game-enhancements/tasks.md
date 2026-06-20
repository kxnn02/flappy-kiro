# Implementation Plan: Game Enhancements

## Overview

This plan implements 16 game enhancements for Flappy Kiro across gameplay, visual/audio, technical quality, and distribution. All code remains in the single-file `app.js` architecture with Canvas 2D and Web Audio API. Tasks are ordered so foundational systems (object pooling, responsive canvas) come first, followed by gameplay features, visual/audio layers, and finally distribution.

## Tasks

- [x] 1. Implement Object Pool system
  - [x] 1.1 Create ParticlePool and PipePool with pre-allocation
    - Define `PARTICLE_POOL_SIZE = 100` and `PIPE_POOL_SIZE = 10` constants
    - Implement `createParticlePool(size)`, `acquireParticle(pool)`, `releaseParticle(pool, particle)`, `getActiveCount(pool)`
    - Implement `createPipePool(size)`, `acquirePipe(pool)`, `releasePipe(pool, pipe)` 
    - Pre-allocate all objects at initialization before first frame
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.7_

  - [ ]* 1.2 Write property tests for Object Pool
    - **Property 19: Object pool size invariant**
    - **Property 20: Object pool acquire/release cycle**
    - **Property 21: Object pool exhaustion**
    - **Validates: Requirements 13.1, 13.5, 13.6, 13.7**

  - [x] 1.3 Integrate Object Pool into existing pipe and particle systems
    - Replace direct pipe/particle array pushes with pool acquire/release calls
    - Ensure no `new` object allocations during PLAYING state for pipes and particles
    - Handle pool exhaustion gracefully (skip spawn when pool full)
    - _Requirements: 13.5, 13.6, 13.7_

- [x] 2. Implement Responsive Canvas system
  - [x] 2.1 Create responsive canvas calculation and resize handler
    - Implement `calculateCanvasDimensions(viewportWidth, viewportHeight)` maintaining 2:3 aspect ratio
    - Clamp canvas width to [280, 600] pixels with 16px horizontal and vertical padding
    - Handle landscape orientation (height-constrained) sizing
    - Add debounced resize handler (100ms) calling `applyCanvasResize()`
    - Implement `getScaleFactor(currentWidth)` returning `currentWidth / BASE_WIDTH`
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.7_

  - [ ]* 2.2 Write property test for responsive canvas dimensions
    - **Property 11: Responsive canvas dimensions maintain aspect ratio**
    - **Validates: Requirements 7.1, 7.3, 7.7**

  - [x] 2.3 Apply scale factor to game coordinates
    - Multiply all positions, velocities, distances, and hitbox dimensions by `getScaleFactor()`
    - Ensure collision boundaries and movement distances scale uniformly
    - _Requirements: 7.3_

  - [x] 2.4 Implement reduced motion preferences
    - Check `prefers-reduced-motion` media query via `checkReducedMotion()`
    - Disable Day/Night cycle transitions and Data Packet glow animations when matched
    - _Requirements: 7.6_

- [x] 3. Implement Accessibility system
  - [x] 3.1 Add ARIA attributes and live region to canvas
    - Add `role="img"` and `aria-label="Flappy Kiro game: waiting to start"` to canvas element
    - Add `aria-live="polite"` to canvas element for screen reader announcements
    - Implement `updateAriaLabel(canvas, state, score)` called on every state transition
    - Format: "Flappy Kiro game: [waiting to start | playing, score N | paused | game over, score N]"
    - _Requirements: 12.1, 12.3, 12.7_

  - [ ]* 3.2 Write property test for aria-label formatting
    - **Property 15: Aria-label state formatting**
    - **Validates: Requirements 12.3**

  - [x] 3.3 Implement focus management and accessible labels
    - Make restart button keyboard-focusable with visible 2px outline focus indicator (3:1 contrast)
    - Move keyboard focus to restart control on GAME_OVER transition
    - Add `aria-label` attributes to `steering-activate-btn` and restart control
    - _Requirements: 12.2, 12.5, 12.6_

  - [x] 3.4 Implement reduced motion accessibility
    - Disable particle effects, Trail_Effect, screen shake, Death_Animation when `prefers-reduced-motion` matches
    - Disable CSS transitions and keyframe animations on overlay elements
    - _Requirements: 12.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Shield Power-Up
  - [x] 5.1 Create Shield pickup spawning and movement
    - Define shield constants: `SHIELD_RADIUS = 14`, `SHIELD_SPAWN_CHANCE = 0.10`, `SHIELD_DURATION = 5000`
    - Implement `spawnShieldPickup(pipe)` with 10% probability, constrain center so full circle (radius 14px) stays within gap
    - Implement `moveShieldPickup(pickup, speed, dt)` moving leftward at pipe speed
    - Remove pickups when off-screen (rightmost edge past left boundary)
    - _Requirements: 2.1, 2.5_

  - [ ]* 5.2 Write property test for shield spawn position
    - **Property 1: Power-up spawn position invariant** (shield variant)
    - **Validates: Requirements 2.1**

  - [x] 5.3 Implement Shield activation and collision absorption
    - Implement `checkShieldPickupCollision(playerRect, pickup)` using circle-rect detection
    - Implement `activateShield(gameContext)` setting 5-second timer
    - Implement `absorbCollision(gameContext)` suppressing first pipe collision
    - Handle re-collection: reset timer to 5 seconds if already active
    - Deactivate on timer expiry without visual/audio cue
    - _Requirements: 2.2, 2.3, 2.6, 2.7_

  - [ ]* 5.4 Write property tests for shield behavior
    - **Property 2: Shield absorbs collision without game over**
    - **Property 3: Power-up timer management** (shield variant)
    - **Validates: Requirements 2.3, 2.6, 2.7**

  - [x] 5.5 Render Shield pickup and active shield effect
    - Render pickup as glowing blue circle (radius 14px) with shield icon using Canvas arc primitives
    - Render active shield as translucent circular outline (blue, 50% opacity) around Ghosty
    - Outline radius = Ghosty sprite diagonal + 6px
    - _Requirements: 2.4, 2.5_

- [x] 6. Implement Slow-Motion Power-Up
  - [x] 6.1 Create Slow-Motion pickup spawning and movement
    - Define constants: `SLOW_MOTION_RADIUS = 12`, `SLOW_MOTION_SPAWN_CHANCE = 0.08`, `SLOW_MOTION_DURATION = 4000`, `SLOW_MOTION_MULTIPLIER = 0.5`, `SLOW_MOTION_RAMP_DURATION = 500`
    - Implement `spawnSlowMotionPickup(pipe)` with 8% probability, render as yellow circle with clock icon
    - Move pickup leftward at pipe speed, remove when off-screen
    - _Requirements: 3.1_

  - [x] 6.2 Implement Slow-Motion activation and speed reduction
    - Implement `activateSlowMotion(gameContext)` reducing speed to 50% for 4 seconds
    - Apply 50% multiplier uniformly to pipe speed, gravity, and Ghosty velocity
    - Handle re-collection: reset timer without compounding speed reduction
    - Suppress collection during Steering Mode
    - _Requirements: 3.2, 3.3, 3.6_

  - [ ]* 6.3 Write property tests for slow-motion
    - **Property 4: Slow-motion speed multiplier uniformity**
    - **Property 5: Slow-motion ramp restoration**
    - **Property 6: Steering mode suppresses slow-motion collection**
    - **Validates: Requirements 3.2, 3.4, 3.5, 3.6**

  - [x] 6.4 Implement speed ramp-up on expiry and visual overlay
    - Restore game speed with linear ramp over 500ms on expiry
    - Implement `getEffectiveSpeedMultiplier(gameContext)` returning 0.5 to 1.0
    - Render yellow-tinted border overlay (4px width, 40% opacity) while active
    - _Requirements: 3.4, 3.5_

- [x] 7. Implement Magnet Power-Up
  - [x] 7.1 Create Magnet pickup spawning and movement
    - Define constants: `MAGNET_RADIUS = 14`, `MAGNET_SPAWN_CHANCE = 0.08`, `MAGNET_DURATION = 6000`, `MAGNET_ATTRACT_RADIUS = 150`, `MAGNET_ATTRACT_SPEED = 3`
    - Implement `spawnMagnetPickup(pipe)` with 8% probability, constrain center within gap
    - Move pickup leftward at pipe speed, remove when off-screen
    - Render as magenta circle (radius 14px, shadowBlur 10) with U-shaped magnet icon
    - _Requirements: 4.1, 4.5, 4.7_

  - [x] 7.2 Implement Magnet activation and Data Packet attraction
    - Implement `activateMagnet(gameContext)` with 6-second timer
    - Implement `attractDataPackets(packets, playerCenter, dt)` moving packets within 150px toward Ghosty at 3px/frame (scaled by dt)
    - Handle re-collection: reset timer to 6 seconds
    - Deactivate on timer expiry, remove visual ring
    - _Requirements: 4.2, 4.3, 4.6_

  - [ ]* 7.3 Write property test for magnet attraction
    - **Property 7: Magnet attraction moves packets closer**
    - **Validates: Requirements 4.3**

  - [x] 7.4 Render Magnet active effect
    - Render purple ring at 150px radius around Ghosty
    - Oscillate ring opacity between 0.3 and 0.8 over 600ms cycle
    - _Requirements: 4.4_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Day/Night Cycle
  - [x] 9.1 Create Day/Night cycle state and update logic
    - Define constants: `DAY_NIGHT_PERIOD = 60000`, `NIGHT_COLOR`, `DAY_COLOR`, `STAR_OPACITY_MIN = 0.2`, `STAR_OPACITY_MAX = 0.8`
    - Implement `initDayNightCycle()`, `updateDayNightCycle(state, deltaMs, isPaused)`
    - Compute cycle position as sinusoidal oscillation over 60-second period
    - Freeze cycle when paused, resume from same position
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 9.2 Write property tests for Day/Night cycle
    - **Property 8: Day/Night cycle interpolation**
    - **Property 9: Day/Night cycle freezes when paused**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x] 9.3 Apply Day/Night cycle to background and star rendering
    - Implement `interpolateBackground(cyclePosition)` with linear RGB interpolation between night and day colors
    - Implement `getStarOpacity(cyclePosition)` mapping 0.8 (night) to 0.2 (day)
    - Integrate into `renderParallaxLayers()` to use interpolated background and star opacity
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 10. Implement Themed Worlds
  - [x] 10.1 Create theme system with 4 world themes
    - Define `WORLD_THEMES` array with 4 themes (pipe color, accent color, particle color)
    - Implement `initThemeSystem()`, `updateThemeSystem(state, score, deltaMs)`, `getCurrentTheme(state)`
    - Trigger theme transition at every 50-point multiple with 300ms white fade overlay
    - Cycle themes sequentially, wrap around after last
    - Handle multi-step score jumps (advance to highest reached theme)
    - Reset to first theme on GAME_OVER → START_SCREEN transition
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 10.2 Write property test for theme cycling
    - **Property 10: Theme index cycling**
    - **Validates: Requirements 6.1, 6.4, 6.6**

  - [x] 10.3 Apply active theme colors to pipe, background, and particle rendering
    - Use `getCurrentTheme(state).pipe` for Pipe_Pair fill color
    - Use `getCurrentTheme(state).accent` for background accent elements
    - Use `getCurrentTheme(state).particle` for particle burst colors
    - Render white fade overlay during theme transitions
    - _Requirements: 6.3_

- [x] 11. Implement Trail Effect
  - [x] 11.1 Create ring buffer and trail rendering
    - Define constants: `TRAIL_BUFFER_SIZE = 12`, `TRAIL_SAMPLE_INTERVAL = 2`, `TRAIL_COLOR = '#a855f7'`
    - Implement `initTrailBuffer()`, `sampleTrailPosition(buffer, x, y)`, `renderTrail(ctx, buffer)`, `clearTrailBuffer(buffer)`
    - Sample Ghosty position every 2 frames into ring buffer
    - Render trail circles with radius interpolating from 10px (newest) to 3px (oldest)
    - Opacity interpolating from 0.6 (newest) to 0.0 (oldest)
    - Clear buffer on state transition away from PLAYING
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 11.2 Write property test for trail ring buffer
    - **Property 12: Trail ring buffer behavior**
    - **Validates: Requirements 8.1, 8.2**

- [x] 12. Implement Pipe Color Gradient
  - [x] 12.1 Create pipe color interpolation system
    - Define `PIPE_COLOR_START` (#00d400 green) and `PIPE_COLOR_END` (#d40000 red)
    - Implement `calculatePipeColorFactor(currentSpeed, baseSpeed, maxSpeed)` clamped to [0, 1]
    - Implement `interpolatePipeColor(factor)` using per-channel linear RGB interpolation
    - Apply interpolated color to pipe body rectangles and cap rectangles
    - Reset to base green on GAME_OVER → START_SCREEN
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 12.2 Write property test for pipe color interpolation
    - **Property 13: Pipe color interpolation**
    - **Validates: Requirements 9.1, 9.2**

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement Chiptune Music System
  - [x] 14.1 Create procedural chiptune music engine
    - Define pentatonic scale (8+ notes), `MUSIC_NOTE_DURATION = 200ms`, `MUSIC_VOLUME = 0.15`
    - Implement `createChiptuneEngine(audioContext)` using OscillatorNodes with square waveform
    - Implement melody: repeating sequence of 8+ notes at 200ms each
    - Implement bass line: square wave one octave below, playing root on beats 1 and 3
    - Implement `startMusic()`, `stopMusic()` (100ms gain fade-out), `pauseMusic()`, `resumeMusic()`
    - Handle AudioContext autoplay policy with `audioContext.resume()` on first interaction
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 15. Implement Death Animation
  - [x] 15.1 Create death animation system
    - Define constants: `DEATH_ANIM_DURATION = 800`, `DEATH_SPIN_RATE = 360`, `DEATH_RECAP_FADE_IN = 400`
    - Implement `initDeathAnimation(player, velocity)`, `updateDeathAnimation(state, deltaMs)`
    - Apply gravity to Ghosty from collision velocity, spin clockwise at 360°/sec
    - Clamp Ghosty position to canvas bottom edge if it exceeds canvas height
    - Continue rendering canvas (pipes, background) frozen at last positions
    - Block all player inputs during animation
    - Trigger Death_Recap overlay with 400ms fade-in after 800ms
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 15.2 Write property test for death animation physics
    - **Property 14: Death animation physics**
    - **Validates: Requirements 11.1**

- [x] 16. Implement Online Leaderboard
  - [x] 16.1 Create leaderboard service and display name management
    - Define Firebase configuration, `LEADERBOARD_TIMEOUT = 5000`, `MAX_LEADERBOARD_ENTRIES = 10`
    - Implement `initLeaderboard(config)`, `submitScore(displayName, score)`, `fetchTopScores(limit)`
    - Implement `isValidDisplayName(name)` validating 3-15 alphanumeric characters
    - Implement `getStoredDisplayName()` / `saveDisplayName(name)` with localStorage
    - Handle localStorage unavailable/full gracefully (prompt each session)
    - _Requirements: 1.1, 1.5, 1.6, 1.7_

  - [ ]* 16.2 Write property tests for leaderboard utilities
    - **Property 16: Display name validation**
    - **Property 17: Display name persistence round-trip**
    - **Property 18: Leaderboard entry name truncation**
    - **Validates: Requirements 1.3, 1.5, 1.6**

  - [x] 16.3 Create Leaderboard UI overlay
    - Implement Leaderboard_UI as DOM overlay displaying top 10 scores
    - Show rank (1-based), player name (truncated to 15 chars), and score value
    - Fetch scores within 5 seconds using AbortController timeout
    - Display error message if service unavailable without blocking gameplay
    - Prompt for display name if not stored (3-15 alphanumeric validation)
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 17. Implement PWA Support
  - [x] 17.1 Create manifest.json and service worker
    - Create `manifest.json` with app name "Flappy Kiro", short name, start URL, standalone display, theme/background color, 192x192 and 512x512 icons
    - Add `<link rel="manifest">` tag to `index.html`
    - Create `service-worker.js` caching index.html, style.css, app.js, manifest.json, and assets/
    - Implement cache-first strategy for static assets
    - Implement network-first strategy for Leaderboard_Service requests
    - Handle cache failure during install (don't activate, reattempt next load)
    - Serve cached leaderboard response or error on network unavailability
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [x] 18. Implement GitHub Pages Deployment
  - [x] 18.1 Create GitHub Actions deployment workflow
    - Create `.github/workflows/deploy.yml` triggered on push to main branch
    - Use `actions/upload-pages-artifact` to package root directory
    - Use `actions/deploy-pages` to publish artifact
    - Configure `pages` write and `id-token` write permissions
    - Ensure all static files served from root with relative paths
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 19. Update README Documentation
  - [x] 19.1 Write comprehensive README with gameplay visuals and controls
    - Add gameplay GIF or animated screenshot above first heading or immediately after title
    - Add controls section documenting Spacebar/Click/Touch to flap, Escape to pause, Shift for Steering Mode
    - Include static screenshot of PLAYING state from `img/` or `assets/` directory
    - Add sections: game description, controls, features list, how to run locally (with commands), deployment info
    - Add clickable markdown link to live GitHub Pages URL
    - Ensure all referenced images exist in repository under `img/` or `assets/`
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code resides in `app.js` following the single-file architecture
- Render functions must not mutate game state (pure rendering)
- All physics must incorporate delta time for frame-rate independence
- Object pool must be initialized before first gameplay frame

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "2.3", "3.2", "3.3"] },
    { "id": 2, "tasks": ["2.4", "3.4", "5.1", "6.1", "7.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "6.2", "7.2"] },
    { "id": 4, "tasks": ["5.4", "5.5", "6.3", "6.4", "7.3", "7.4"] },
    { "id": 5, "tasks": ["9.1", "10.1", "11.1", "12.1"] },
    { "id": 6, "tasks": ["9.2", "9.3", "10.2", "10.3", "11.2", "12.2"] },
    { "id": 7, "tasks": ["14.1", "15.1", "16.1"] },
    { "id": 8, "tasks": ["15.2", "16.2", "16.3"] },
    { "id": 9, "tasks": ["17.1", "18.1", "19.1"] }
  ]
}
```
