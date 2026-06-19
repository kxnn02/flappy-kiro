# Implementation Plan: Flappy Kiro

## Overview

Implement a browser-based Flappy Bird-style arcade game with a Steering Mode power-up mechanic. The game uses vanilla JavaScript, HTML5 Canvas, and CSS delivered as three files (`index.html`, `style.css`, `app.js`). Players collect Data Packets to charge a meter that grants temporary autopilot and invincibility with a neon matrix grid visual.

## Tasks

- [ ] 1. Set up project structure and HTML/CSS foundation
  - [ ] 1.1 Create `index.html` with canvas element, steering charge progress bar, and activation button
    - Add HTML5 boilerplate with `<canvas id="game-canvas">` element
    - Add steering charge progress bar container and fill element at top of screen
    - Add on-screen activation button for Steering Mode (hidden by default, shown when charge is full)
    - Link `style.css` and `app.js`
    - _Requirements: 1.1, 2.1, 12.1, 13.2_

  - [ ] 1.2 Create `style.css` with dark theme, neon effects, and progress bar styling
    - Style the page with a dark retro aesthetic (dark background, centered canvas)
    - Style the steering charge progress bar (horizontal bar, neon purple/green fill, positioned at top)
    - Style the activation button with neon glow effect
    - Add CSS transitions for progress bar width updates
    - _Requirements: 1.1, 2.2, 12.1, 12.5_

- [ ] 2. Implement core game engine in `app.js`
  - [ ] 2.1 Implement game state machine and constants
    - Define `GameState` object with START_SCREEN, PLAYING, GAME_OVER states
    - Implement `transitionState(currentState, event)` function
    - Define all physics and game constants (GRAVITY, FLAP_IMPULSE, TERMINAL_VELOCITY, PIPE_WIDTH, PIPE_GAP, PIPE_SPEED, PIPE_INTERVAL)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.2 Write property test for state machine transitions
    - **Property 1: State machine transitions are valid**
    - **Validates: Requirements 3.1, 3.3, 3.4, 3.5**

  - [ ] 2.3 Implement physics engine (gravity, terminal velocity, flap)
    - Implement `applyGravity(velocity)` that adds GRAVITY constant and clamps to TERMINAL_VELOCITY
    - Implement `applyFlap()` that returns FLAP_IMPULSE constant
    - Implement `updatePlayerPosition(player)` that applies gravity and updates y position
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.4 Write property tests for physics engine
    - **Property 2: Gravity increases downward velocity**
    - **Property 3: Terminal velocity is never exceeded**
    - **Property 4: Flap sets upward impulse**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ] 2.5 Implement pipe system (generation, movement, cleanup)
    - Implement `generatePipe(canvasWidth, canvasHeight)` with randomized gap positions within valid bounds
    - Implement `movePipe(pipe)` that moves pipe leftward by PIPE_SPEED
    - Implement `isOffScreen(pipe)` and `removeOffScreenPipes(pipes)`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.6 Write property tests for pipe system
    - **Property 5: Pipe gaps are within valid bounds**
    - **Property 6: Constant leftward movement**
    - **Property 7: Off-screen entities are removed**
    - **Validates: Requirements 6.1, 6.3, 6.4**

- [ ] 3. Implement collision detection and scoring
  - [ ] 3.1 Implement collision detection (AABB overlap, boundary checks)
    - Implement `getPlayerRect(player, spriteWidth, spriteHeight)` with padding for fairness
    - Implement `rectsOverlap(a, b)` AABB check
    - Implement `checkBoundaryCollision(playerY, playerHeight, canvasHeight)` for ground and ceiling
    - Implement `checkCollision(playerRect, pipes, canvasHeight, isInvincible)` with invincibility flag support
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 15.1, 15.3_

  - [ ]* 3.2 Write property tests for collision detection
    - **Property 8: Collision detection is geometrically correct**
    - **Property 18: Selective invincibility during Steering Mode**
    - **Validates: Requirements 7.1, 7.2, 7.3, 15.1, 15.3**

  - [ ] 3.3 Implement scoring system and high score persistence
    - Implement `shouldIncrementScore(playerX, pipe)` that checks if player passed pipe trailing edge
    - Implement `formatScore(score, highScore)` producing "Score: X | High: Y" format
    - Implement `loadHighScore()` and `saveHighScore(score, currentHighScore)` using localStorage
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2, 9.3_

  - [ ]* 3.4 Write property tests for scoring
    - **Property 9: Score increments exactly once per pipe passed**
    - **Property 10: Score format string is correct**
    - **Property 11: High score persistence updates correctly**
    - **Validates: Requirements 8.1, 8.3, 9.2**

- [ ] 4. Checkpoint - Core mechanics
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Data Packet and Steering Charge systems
  - [ ] 5.1 Implement Data Packet system (spawning, movement, collection)
    - Implement `spawnDataPacket(pipe)` that places packets randomly within pipe gap bounds
    - Implement `moveDataPacket(packet)` moving at same speed as pipes
    - Implement `checkDataPacketCollision(playerRect, packet)` with circle-rect collision
    - Implement `collectDataPackets(playerRect, packets)` returning collected and remaining arrays
    - Implement `removeOffScreenDataPackets(packets)` cleanup function
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 18.1_

  - [ ]* 5.2 Write property tests for Data Packet system
    - **Property 12: Data packets spawn within pipe gap bounds**
    - **Property 13: Data packet collection removes packet from active list**
    - **Property 6: Constant leftward movement (data packets)**
    - **Property 7: Off-screen entities are removed (data packets)**
    - **Validates: Requirements 11.1, 11.3, 11.4, 11.5**

  - [ ] 5.3 Implement Steering Charge Manager (accumulation, cap, UI update)
    - Implement `addSteeringCharge(currentCharge, packetsCollected)` with 25% increments and 100% cap
    - Implement `canActivateSteering(charge, steeringModeActive)` check
    - Implement `updateChargeBar(charge)` to update HTML progress bar width
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 18.2_

  - [ ]* 5.4 Write property tests for Steering Charge
    - **Property 14: Steering charge accumulates in 25% increments with 100% cap**
    - **Property 15: Steering Mode activation requires full charge**
    - **Validates: Requirements 12.3, 12.4, 13.1, 13.3**

- [ ] 6. Implement Steering Mode mechanics
  - [ ] 6.1 Implement Steering Mode Controller (activation, timer, depletion, deactivation)
    - Implement `activateSteeringMode(gameContext)` setting active flag and 5-second timer
    - Implement `deactivateSteeringMode(gameContext)` restoring normal state
    - Implement `depleteCharge(currentCharge, elapsedMs)` with linear drain over 5 seconds
    - Implement `updateSteeringMode(gameContext, deltaMs)` frame-by-frame update
    - _Requirements: 13.1, 13.4, 16.1, 16.2, 16.3, 18.3_

  - [ ]* 6.2 Write property tests for Steering Mode depletion and activation
    - **Property 15: Steering Mode activation requires full charge**
    - **Property 19: Linear charge depletion over 5 seconds**
    - **Property 20: Steering Mode deactivation restores normal behavior**
    - **Validates: Requirements 13.1, 13.3, 13.4, 16.1, 16.2, 16.3**

  - [ ] 6.3 Implement Autopilot behavior
    - Implement `calculateAutopilotVelocity(playerY, playerHeight, pipes, playerX)` targeting next gap center
    - Use proportional control with capped max speed for smooth navigation
    - Integrate autopilot into game loop update to override player velocity when active
    - _Requirements: 14.1, 14.2, 14.3, 18.3_

  - [ ]* 6.4 Write property tests for Autopilot
    - **Property 16: Autopilot guides player toward gap center**
    - **Property 17: Manual input is overridden during Steering Mode**
    - **Validates: Requirements 14.1, 14.2**

  - [ ] 6.5 Implement Neon Matrix Grid Renderer
    - Implement `initMatrixGrid(canvasWidth, canvasHeight)` creating falling column state
    - Implement `renderNeonMatrixGrid(ctx, canvasWidth, canvasHeight)` with dark purple base, green grid lines, and falling matrix characters
    - Integrate as background renderer when Steering Mode is active
    - _Requirements: 17.1, 17.2, 17.3, 18.4_

- [ ] 7. Checkpoint - Steering Mode subsystem
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement input handling, audio, and rendering
  - [ ] 8.1 Implement input handler (keyboard, mouse, activation button)
    - Implement `setupInputHandlers(canvas, onInput, onActivateSteering)` function
    - Listen for Spacebar and mouse click for flap/state transitions
    - Listen for Shift key and activation button click for Steering Mode activation
    - Prevent default browser behavior for game keys
    - _Requirements: 5.3, 5.4, 13.1, 13.2_

  - [ ] 8.2 Implement audio manager
    - Create `createAudioManager()` factory returning `playJump()` and `playGameOver()` methods
    - Preload `assets/jump.wav` and `assets/game_over.wav`
    - Handle autoplay policy by catching and ignoring play errors
    - _Requirements: 10.1, 10.2_

  - [ ] 8.3 Implement main renderer
    - Implement `render(ctx, gameContext, spriteImage, canvasWidth, canvasHeight)` function
    - Render dark background (or neon matrix grid during Steering Mode)
    - Render pipes as green rectangles, data packets as glowing purple circles
    - Render player sprite (with translucent purple overlay during Steering Mode)
    - Render score text, start screen, and game over screen
    - Implement `renderDataPacket(ctx, packet)` with glow effect
    - _Requirements: 2.1, 2.2, 2.3, 6.2, 8.2, 11.2, 15.2, 17.1, 17.2, 17.3_

- [ ] 9. Wire everything together in the game loop
  - [ ] 9.1 Implement game initialization and main game loop
    - Implement `initGame()` that sets up canvas, loads sprite, loads high score, inits input handlers, audio, charge bar, matrix grid, and starts loop
    - Implement `gameLoop(timestamp)` with delta time calculation
    - Implement `update(deltaMs)` orchestrating physics, pipes, data packets, steering mode, collision, and scoring per frame
    - Wire state transitions: START_SCREEN input → reset and play, GAME_OVER input → restart
    - Handle sprite load failure with colored rectangle fallback
    - Add `DOMContentLoaded` event listener to call `initGame()`
    - _Requirements: 1.2, 1.3, 2.3, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 7.4, 9.3, 10.1, 10.2_

  - [ ]* 9.2 Write integration tests for game loop behavior
    - Test that game state transitions correctly through a full play cycle
    - Test that steering mode activates, runs autopilot, and deactivates after 5 seconds
    - Test that score increments when passing pipes
    - _Requirements: 3.1, 4.2, 8.1, 13.4, 16.2_

- [ ] 10. Final checkpoint - Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The game uses existing assets: `assets/ghosty.png`, `assets/jump.wav`, `assets/game_over.wav`
- All game logic resides in a single `app.js` file using modular functions
- No external frameworks or libraries are used (vanilla JavaScript only)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.5"] },
    { "id": 3, "tasks": ["2.4", "2.6", "3.1", "3.3"] },
    { "id": 4, "tasks": ["3.2", "3.4", "5.1", "5.3"] },
    { "id": 5, "tasks": ["5.2", "5.4", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.5"] },
    { "id": 7, "tasks": ["6.4", "8.1", "8.2", "8.3"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.2"] }
  ]
}
```
