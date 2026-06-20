# Implementation Plan: Game Polish

## Overview

This plan implements 15 game-feel enhancements to Flappy Kiro across four categories: gameplay mechanics, visual effects, audio, and input. All changes are made within the existing single-file vanilla JS architecture (`app.js`, `index.html`, `style.css`) using Canvas 2D and Web Audio API. Tasks are ordered to build foundational systems first, then layer visual and audio polish, and finally wire integration points together.

## Tasks

- [x] 1. Extend game state machine and core data model
  - [x] 1.1 Add PAUSED state to GameState enum and extend transitionState function
    - Add `PAUSED: 'PAUSED'` to the GameState object
    - Update `transitionState` to handle ESCAPE event: PLAYING → PAUSED, PAUSED → PLAYING
    - Add new fields to `gameContext`: `paused`, `gracePeriod`, `screenShake`, `particles`, `parallaxLayers`, `deathRecap`, `transitionLock`, `currentDifficulty`
    - _Requirements: 13.1, 13.4_

  - [x] 1.2 Add DOM overlay elements for pause, death recap, and score popup
    - Add pause overlay (`#pause-overlay`) with "PAUSED" text to `index.html`
    - Add death recap overlay (`#death-recap-overlay`) with score, high score, countdown, and "NEW HIGH SCORE" indicator
    - Add score popup container (`#score-popup-container`) for floating "+1" elements
    - Add start screen overlay (`#start-overlay`) for fade transitions
    - Style all overlays with CSS in `style.css`: centered, absolute positioning, dark semi-transparent backgrounds, monospace font
    - _Requirements: 13.3, 14.1, 14.5, 8.1, 15.4_

  - [ ]* 1.3 Write property test for pause halts updates (Property 11)
    - **Property 11: Pause state halts all game updates**
    - **Validates: Requirements 13.2**

  - [ ]* 1.4 Write property test for input blocking during countdown/transitions (Property 12)
    - **Property 12: Input is blocked during countdown and transitions**
    - **Validates: Requirements 14.3, 15.5**

- [x] 2. Implement Difficulty Manager
  - [x] 2.1 Create getDifficultyParams and getBaseDifficulty functions
    - Define constants: `DIFFICULTY_STEP = 5`, `SPEED_INCREMENT = 0.3`, `GAP_DECREMENT = 5`, `MIN_GAP = 100`, `MAX_PIPE_SPEED = 6`
    - Implement `getDifficultyParams(score)` as a pure function returning `{ pipeSpeed, pipeGap }`
    - Implement `getBaseDifficulty()` returning base values
    - Integrate into `update()` so pipes use `currentDifficulty.pipeSpeed` for movement and `currentDifficulty.pipeGap` for gap generation
    - Reset difficulty on game restart in `resetGame()`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write property test for difficulty bounds and monotonicity (Property 1)
    - **Property 1: Difficulty parameters are bounded and monotonic**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 3. Implement Screen Shake Controller
  - [x] 3.1 Create screen shake functions and integrate into collision handling
    - Define constants: `SHAKE_DURATION = 300`, `SHAKE_INTENSITY = 5`
    - Implement `activateScreenShake()`, `updateScreenShake(shakeState, dt)`, `getShakeOffset(shakeState)`
    - Activate screen shake when transitioning to GAME_OVER
    - Apply shake offset to canvas via `ctx.translate()` at the start of render, restore after
    - Update shake timer in `update()` using deltaMs
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 3.2 Write property test for screen shake bounds and expiration (Property 2)
    - **Property 2: Screen shake offset is bounded and expires correctly**
    - **Validates: Requirements 2.2, 2.3**

- [x] 4. Implement Grace Period Controller
  - [x] 4.1 Create grace period functions and integrate into game start and collision
    - Define constants: `GRACE_DURATION = 1500`, `GRACE_FLASH_RATE = 150`
    - Implement `activateGracePeriod()`, `updateGracePeriod(graceState, dt)`, `isGracePeriodActive(graceState)`, `getGraceOpacity(graceState)`
    - Activate grace period when transitioning to PLAYING state
    - Pass `isGracePeriodActive` to `checkCollision` alongside existing `isInvincible` (Steering Mode)
    - Update grace period timer in `update()` using deltaMs
    - Apply flashing opacity to player sprite rendering using `getGraceOpacity`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.2 Write property test for grace period collision behavior (Property 3)
    - **Property 3: Grace period suppresses pipe collision but preserves boundary collision**
    - **Validates: Requirements 3.2, 3.5**

  - [ ]* 4.3 Write property test for grace opacity alternation (Property 4)
    - **Property 4: Grace period opacity alternates between two values**
    - **Validates: Requirements 3.3**

- [x] 5. Checkpoint - Ensure core mechanics work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Particle System
  - [x] 6.1 Create particle spawn, update, and render functions
    - Implement `spawnParticles(x, y, count, config)` returning an array of particle objects with random velocities, purple color, 2-4px radius, 400-600ms lifespan
    - Implement `updateParticles(particles, dt)` advancing position, decaying alpha linearly, removing expired particles
    - Implement `renderParticles(ctx, particles)` drawing filled circles with current alpha
    - Trigger particle spawn on Data Packet collection at the packet's position (8-12 particles)
    - Add `particles` array to gameContext, update and render each frame
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.2 Write property test for particle spawn invariants (Property 5)
    - **Property 5: Spawned particles satisfy all invariants**
    - **Validates: Requirements 4.1, 4.2, 4.5**

  - [ ]* 6.3 Write property test for particle lifecycle update (Property 6)
    - **Property 6: Particle update advances position, decays alpha, and removes expired particles**
    - **Validates: Requirements 4.3, 4.4**

- [x] 7. Implement Velocity-Based Player Rotation
  - [x] 7.1 Create rotation calculation and rotated sprite rendering
    - Implement `calculateRotation(velocity)` returning angle clamped to [-30, +60] degrees
    - Implement `renderRotatedSprite(ctx, image, x, y, width, height, angleDeg)` using `ctx.save()`, `ctx.translate()`, `ctx.rotate()`, `ctx.restore()`
    - Apply rotation in the player rendering section of `render()` during PLAYING and GAME_OVER states
    - Use the same rotation logic for both sprite and purple rectangle fallback
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.2 Write property test for rotation clamping and direction correlation (Property 7)
    - **Property 7: Rotation angle is clamped and direction-correlated**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 8. Implement Pipe Caps and Parallax Background
  - [x] 8.1 Add pipe cap rendering and collision detection
    - Define constants: `CAP_OVERHANG = 6`, `CAP_HEIGHT = 20`
    - Implement `renderPipeWithCaps(ctx, pipe, canvasHeight)` drawing wider cap rectangles at pipe openings with the same green color
    - Update collision detection to include pipe cap rectangles in overlap checks
    - Replace existing pipe rendering with `renderPipeWithCaps` in the render function
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 8.2 Write property test for pipe cap collision geometry (Property 8)
    - **Property 8: Pipe cap geometry is included in collision detection**
    - **Validates: Requirements 6.4**

  - [x] 8.3 Implement parallax scrolling background
    - Implement `initParallaxLayers(canvasWidth, canvasHeight)` creating back (stars/dots) and front (grid lines) layers
    - Implement `updateParallaxLayers(layers, pipeSpeed, dt)` scrolling layers at 20% and 50% of pipe speed
    - Implement `renderParallaxLayers(ctx, layers, canvasWidth, canvasHeight)` drawing both layers with seamless wrapping
    - Render parallax background instead of flat color when not in Steering Mode
    - Suppress parallax and show neon matrix grid during Steering Mode; restore parallax on deactivation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.4 Write property test for parallax speed ratios (Property 9)
    - **Property 9: Parallax layers scroll at correct speed ratios**
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 8.5 Write property test for parallax layer wrapping (Property 10)
    - **Property 10: Parallax layers wrap seamlessly**
    - **Validates: Requirements 7.3**

- [x] 9. Implement Score Popup Animation
  - [x] 9.1 Create DOM-based score popup with CSS animation
    - Implement `createScorePopup(playerX, playerY)` that creates a DOM element with "+1" text positioned near the player
    - Add CSS keyframe animation: float upward and fade opacity from 1.0 to 0.0 over 800ms
    - Add `animationend` event listener to remove the popup element from the DOM on completion
    - Trigger popup creation on score increment in the update loop
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 10. Checkpoint - Ensure visual effects work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Procedural Audio Engine
  - [x] 11.1 Create procedural audio engine with all sound effects
    - Implement `createProceduralAudioEngine()` returning an object with: `playFlap()`, `playCrash()`, `playScorePing()`, `playSteeringWhoosh()`, `startBackgroundHum()`, `stopBackgroundHum()`
    - Create a single `AudioContext` lazily on first user interaction
    - Implement flap sound: sine wave, 300→500Hz sweep, 80ms, gain envelope
    - Implement crash sound: sawtooth wave, 400→100Hz sweep, 300ms, sharp attack/longer decay
    - Implement score ping: sine wave, 800Hz, 60ms, quick attack/decay
    - Implement steering whoosh: sawtooth wave, 200→1200Hz sweep, 200ms, rapid gain fade-out
    - Implement background hum: sine wave, 60Hz, gain pulsing 5-10%, continuous during PLAYING
    - Wrap all oscillator operations in try/catch; handle suspended AudioContext with `resume()`
    - Replace existing `createAudioManager` with the new procedural engine
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 11.2 Write unit tests for audio engine
    - Test AudioContext singleton creation
    - Test oscillator configuration for each sound type using mocked AudioContext
    - Test GainNode envelope shaping
    - Test background hum start/stop lifecycle
    - _Requirements: 9.4, 9.1, 9.2, 9.3, 9.5, 10.1, 10.2, 11.1, 11.2, 11.3_

- [x] 12. Implement Touch Input and Pause Functionality
  - [x] 12.1 Add mobile touch support
    - Implement `setupTouchHandlers(canvas, onInput)` registering `touchstart` listener on canvas
    - Call `preventDefault()` with `{ passive: false }` to suppress scroll/zoom
    - Route touch events to the same `onInput` handler as Space/Click
    - Ensure steering activation button has minimum 44×44px tap target (update CSS)
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 12.2 Implement pause toggle and overlay
    - Add Escape key listener in input handler to call `togglePause(gameContext)`
    - Implement `togglePause(gameContext)` transitioning between PLAYING and PAUSED
    - Show/hide `#pause-overlay` DOM element on state change
    - In `update()`, return early when state is PAUSED (halt all physics, pipes, scoring, timers)
    - Continue rendering the frozen scene while paused
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 13. Implement Death Recap and Fade Transitions
  - [x] 13.1 Implement death recap screen with countdown
    - Implement `showDeathRecap(score, highScore, isNewHighScore)` displaying the overlay with score info
    - Implement countdown timer starting at 3 seconds, updating display each second
    - Block restart inputs while countdown > 0 by checking `deathRecap.inputEnabled` in `onInput`
    - Show "Press Space or Tap to Restart" prompt when countdown reaches zero
    - Show "NEW HIGH SCORE" indicator when applicable
    - Implement `hideDeathRecap()` removing the overlay on restart
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 13.2 Implement fade transitions between game states
    - Implement `fadeOut(element, durationMs)` and `fadeIn(element, durationMs)` using CSS transition on opacity
    - Implement `setTransitionLock(locked)` setting `gameContext.transitionLock`
    - Apply fade-out on start screen overlay when transitioning to PLAYING (400ms)
    - Apply fade-in on death recap overlay when transitioning to GAME_OVER (400ms)
    - Apply cross-fade when transitioning from GAME_OVER to START_SCREEN (400ms)
    - Block input during active transitions via `transitionLock`
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 14. Integration wiring and final adjustments
  - [x] 14.1 Wire all subsystems into the main game loop
    - Update `update(deltaMs)` to call: difficulty manager, grace period update, screen shake update, particle update, parallax update, death recap countdown update
    - Update `render()` to call: parallax background render, pipe caps render, rotated sprite render, particle render, screen shake offset
    - Update `onInput()` to check `transitionLock` and `deathRecap.inputEnabled` before processing
    - Update `resetGame()` to reset all new subsystem states (difficulty, grace period, shake, particles, parallax, death recap, transition lock)
    - Trigger procedural audio at correct events: flap → playFlap, collision → playCrash, score → playScorePing, steering activate → playSteeringWhoosh, playing start → startBackgroundHum, playing end → stopBackgroundHum
    - Ensure `update()` uses `currentDifficulty.pipeSpeed` for pipe movement and data packet movement
    - _Requirements: 1.1-1.5, 2.1-2.3, 3.1-3.5, 4.1-4.5, 5.1-5.5, 7.1-7.5, 9.1-9.5, 10.1-10.2, 11.1-11.4, 13.2, 14.3, 15.5_

  - [ ]* 14.2 Write unit tests for state transitions and integration
    - Test difficulty resets on game restart
    - Test screen shake activates on collision
    - Test grace period activates on game start
    - Test pause toggle via Escape key
    - Test death recap displays score and high score
    - Test fade transitions apply CSS properties
    - Test touch input triggers same handler as Space
    - _Requirements: 1.5, 2.1, 3.1, 13.1, 13.4, 14.1, 14.2, 15.1-15.4, 12.1_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All audio is procedural via Web Audio API — no new asset files required
- All UI overlays use DOM elements positioned over the canvas per workspace steering rules
- The existing `createAudioManager` (file-based) is replaced by the procedural audio engine

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.2", "4.3", "6.1", "7.1", "8.1", "8.3"] },
    { "id": 3, "tasks": ["6.2", "6.3", "7.2", "8.2", "8.4", "8.5", "9.1"] },
    { "id": 4, "tasks": ["11.1", "12.1", "12.2"] },
    { "id": 5, "tasks": ["11.2", "13.1", "13.2"] },
    { "id": 6, "tasks": ["14.1"] },
    { "id": 7, "tasks": ["14.2"] }
  ]
}
```
