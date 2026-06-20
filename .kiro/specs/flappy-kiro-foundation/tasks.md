# Implementation Plan: Flappy Kiro Foundation

## Overview

This plan implements the foundational scaffold for the Flappy Kiro browser game as three files (`index.html`, `style.css`, `app.js`) with no external dependencies. The implementation proceeds incrementally: HTML structure first, then CSS styling, then JavaScript from constants through state machine, entity rendering, audio placeholders, input handlers, and finally the game loop that wires everything together.

## Tasks

- [x] 1. Create HTML structure and CSS styling
  - [x] 1.1 Create `index.html` with canvas and DOM overlays
    - Create `index.html` with a `<canvas id="game-canvas">` element
    - Add three overlay `<div>` elements: `id="start-overlay"` (title "Flappy Kiro" + start instruction), `id="score-overlay"` (format "Score: X | High: Y"), `id="gameover-overlay"` (final score + restart instruction)
    - Include `<link>` to `style.css` and `<script defer>` to `app.js`
    - No external CDN scripts, frameworks, or module imports
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.1, 3.2, 3.3_

  - [x] 1.2 Create `style.css` with dark retro theme and overlay positioning
    - Set `body` background to `#1a1a2e`, remove default margins/padding
    - Center the canvas horizontally and vertically using flexbox
    - Style all overlay elements with `position: absolute`, z-index above canvas, `pointer-events: none`
    - Apply monospace font and light text color `#e0e0e0` to overlays
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 3.4_

- [x] 2. Implement app.js constants, state machine, and collision detection
  - [x] 2.1 Create `app.js` with physics constants and canvas setup
    - Define grouped UPPER_SNAKE_CASE constants at the top: `CANVAS_WIDTH` (400), `CANVAS_HEIGHT` (600), `GRAVITY` (positive, px/s²), `TERMINAL_VELOCITY` (positive, px/s), `FLAP_IMPULSE` (negative, px/s)
    - Obtain the 2D rendering context from `game-canvas` exactly once and store in a reusable variable
    - Set canvas `width` and `height` attributes from the constants
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 2.2, 2.3_

  - [x] 2.2 Implement the explicit state machine
    - Define `GAME_STATES` object with `START_SCREEN`, `PLAYING`, `GAME_OVER` values
    - Define `EVENTS` object with `USER_INPUT`, `COLLISION` values
    - Implement `transitionState(currentState, event)` as a pure function returning next state
    - Handle: START_SCREEN + USER_INPUT → PLAYING, PLAYING + COLLISION → GAME_OVER, GAME_OVER + USER_INPUT → START_SCREEN
    - Return current state unchanged for any undefined state/event combination
    - Initialize game state to `START_SCREEN`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 11.2_

  - [x]* 2.3 Write property test for state transition purity
    - **Property 1: State transition purity**
    - Test that `transitionState` returns a valid state without modifying inputs or external variables
    - Use fast-check arbitraries for 3 valid states + arbitrary event strings
    - **Validates: Requirements 5.2, 11.2**

  - [x]* 2.4 Write property test for state transition identity on invalid input
    - **Property 2: State transition identity on invalid input**
    - Test that invalid state/event pairs return input state unchanged (strict equality)
    - Use fast-check arbitraries for all combos excluding the 3 valid transitions
    - **Validates: Requirements 5.7**

  - [x] 2.5 Implement AABB collision detection function
    - Implement `rectsOverlap(a, b)` as a pure function accepting two rect objects `{x, y, width, height}`
    - Return boolean indicating axis-aligned bounding box overlap
    - No references to global state
    - _Requirements: 11.3_

  - [x]* 2.6 Write property tests for collision detection
    - **Property 6: Collision detection commutativity**
    - Test that `rectsOverlap(A, B) === rectsOverlap(B, A)` for arbitrary rect pairs with positive dimensions
    - **Property 7: Collision detection self-overlap**
    - Test that `rectsOverlap(R, R) === true` for any rect with positive width/height
    - **Validates: Requirements 11.3**

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement entity rendering functions
  - [x] 4.1 Implement Ghosty render function
    - Implement `renderGhosty(ctx, ghosty)` as a pure function
    - Draw Ghosty as a purple geometric shape (circle or rounded rectangle) with fill color `#9d00ff`
    - Receives context and ghosty position state `{x, y, width, height}`, does not mutate game state
    - _Requirements: 8.1, 11.1_

  - [x] 4.2 Implement Pipe Pair render function
    - Implement `renderPipePair(ctx, pipe)` as a pure function
    - Draw two solid green rectangles (top extending down, bottom extending up) with fill `#00d400`
    - Receives context and pipe state `{x, gapY, gapHeight, width}`, does not mutate game state
    - _Requirements: 8.2, 11.1_

  - [x] 4.3 Implement Data Packet render function
    - Implement `renderDataPacket(ctx, packet)` as a pure function
    - Draw a purple circle with neon glow (`shadowColor: '#b026ff'`, `shadowBlur >= 10`)
    - Receives context and packet state `{x, y, radius}`, does not mutate game state
    - _Requirements: 8.3, 11.1_

  - [x]* 4.4 Write property test for render function purity
    - **Property 4: Render function purity**
    - Test that calling renderGhosty, renderPipePair, renderDataPacket does not mutate the entity state objects
    - Use fast-check arbitraries for objects with numeric x, y, width, height, velocity fields
    - Use a mock/stub canvas 2D context
    - **Validates: Requirements 8.1, 8.2, 8.3, 11.1**

- [x] 5. Implement audio placeholders and input handlers
  - [x] 5.1 Implement procedural Web Audio API placeholder functions
    - Define `playJumpSound()`, `playScoreSound()`, `playCrashSound()`, `playPowerUpSound()`
    - Each creates AudioContext, OscillatorNode, GainNode, connects them but does NOT start the oscillator
    - Each includes a comment describing intended oscillator type, frequency range, and gain envelope
    - Each wraps Web Audio calls in try/catch to never throw
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x]* 5.2 Write property test for sound placeholder safety
    - **Property 5: Sound placeholder safety**
    - Test that invoking each of the 4 sound functions never throws, regardless of AudioContext availability
    - Mock or remove AudioContext to simulate unavailable environments
    - **Validates: Requirements 9.6**

  - [x] 5.3 Implement input handlers
    - Register a `keydown` listener on `document` that detects Spacebar and prevents default scroll
    - Register a `click` listener on the canvas element
    - On input during START_SCREEN: invoke `transitionState` to transition to PLAYING
    - On input during PLAYING: apply `FLAP_IMPULSE` to ghosty's velocity
    - On input during GAME_OVER: invoke `transitionState` to transition to START_SCREEN
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 6. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement game loop, update, and render orchestration
  - [x] 7.1 Implement the update function
    - Implement `update(dt)` that applies gravity to ghosty velocity, clamps to terminal velocity, updates position
    - All state mutations occur here, no draw calls
    - Respects delta time for frame-rate-independent physics
    - _Requirements: 6.4, 6.5, 11.4, 11.5_

  - [x] 7.2 Implement the main render function
    - Implement `render()` that clears the canvas with `ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)`
    - Fill background with `#1a1a2e` after clearing
    - Call entity render functions (renderGhosty, renderPipePair, renderDataPacket) for demo entities
    - Toggle overlay visibility based on current game state (show/hide start, score, gameover overlays)
    - No state mutations during render phase
    - _Requirements: 8.4, 8.5, 3.5, 3.6, 3.7, 6.5, 11.5_

  - [x] 7.3 Implement the game loop with delta time
    - Implement `gameLoop(timestamp)` using `requestAnimationFrame`
    - Compute delta time as `(timestamp - previousTimestamp) / 1000`, clamped to max 0.1 seconds
    - Use dt = 0 on the first frame when no previous timestamp exists
    - Call `update(dt)` then `render()` each frame (strict order)
    - Continue loop regardless of current game state
    - Start the loop with initial `requestAnimationFrame(gameLoop)` call
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x]* 7.4 Write property test for delta time bounds
    - **Property 3: Delta time bounds**
    - Test that for any pair of positive float timestamps (current >= previous), computed dt is in [0, 0.1]
    - Use fast-check arbitrary positive floats for timestamp pairs
    - **Validates: Requirements 6.2**

- [x] 8. Final integration and wiring
  - [x] 8.1 Wire all components together and verify end-to-end scaffold
    - Ensure game initializes in START_SCREEN state with start overlay visible
    - Ensure input transitions work: Space/click starts game, flaps during play, restarts from game over
    - Ensure asset fallback: if `assets/ghosty.png` fails, geometric shape renders without errors
    - Ensure all functions respect the 40-line body limit
    - Verify the file opens directly in browser with no build step, server, or errors
    - _Requirements: 1.4, 1.5, 5.3, 11.4, 11.6_

  - [x]* 8.2 Write unit tests for overlay visibility and input handling
    - Test overlay show/hide logic for each game state (START_SCREEN, PLAYING, GAME_OVER)
    - Test input handler dispatches correct actions per state
    - Test render call ordering: clearRect → fillRect(background) → entity draws
    - _Requirements: 3.5, 3.6, 3.7, 10.3, 10.4, 10.5, 8.4, 8.5_

- [x] 9. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code is vanilla JavaScript — no build tools, bundlers, or npm packages needed for the game itself
- Property tests use fast-check and require a test runner (e.g., Vitest) installed as a dev dependency

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.5"] },
    { "id": 3, "tasks": ["2.3", "2.4", "2.6"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3", "5.1"] },
    { "id": 5, "tasks": ["4.4", "5.2", "5.3"] },
    { "id": 6, "tasks": ["7.1", "7.2"] },
    { "id": 7, "tasks": ["7.3", "7.4"] },
    { "id": 8, "tasks": ["8.1"] },
    { "id": 9, "tasks": ["8.2"] }
  ]
}
```
