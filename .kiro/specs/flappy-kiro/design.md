# Design Document

## Overview

Flappy Kiro is a browser-based arcade game featuring a Steering Mode power-up mechanic. Players navigate through pipe obstacles by applying upward impulses, while collecting Data Packets to charge a meter that grants temporary autopilot and invincibility.

## Architecture

Flappy Kiro is a single-page browser game built with vanilla JavaScript, HTML5 Canvas, and CSS. The architecture follows a function-based module pattern within a single `app.js` file, using a game loop driven by `requestAnimationFrame` and a finite state machine to manage game phases. The game includes a Steering Mode power-up system where collecting Data Packets charges a meter that grants temporary autopilot navigation and invincibility.

```
┌─────────────────────────────────────────────────┐
│                  index.html                      │
│  ┌───────────────────────────────────────────┐  │
│  │            <canvas> element                │  │
│  │     + Steering Charge progress bar (HTML)  │  │
│  │     + Activation button (HTML)             │  │
│  └───────────────────────────────────────────┘  │
│              style.css (dark theme + neon)       │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────── app.js ──────────────────────┐
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  State   │  │  Physics │  │   Renderer   │  │
│  │  Machine │  │  Engine  │  │              │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │               │          │
│  ┌────┴──────────────┴───────────────┴───────┐  │
│  │              Game Loop                     │  │
│  │         (requestAnimationFrame)            │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Input   │  │ Collision│  │   Scoring    │  │
│  │  Handler │  │ Detector │  │   & Storage  │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │             Audio Manager                 │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │         Steering Mode Subsystem              ││
│  │  ┌────────────┐  ┌─────────────────────┐    ││
│  │  │Data Packet │  │ Steering Charge      │    ││
│  │  │  System    │  │   Manager            │    ││
│  │  └────────────┘  └─────────────────────┘    ││
│  │  ┌────────────┐  ┌─────────────────────┐    ││
│  │  │ Steering   │  │ Neon Matrix Grid    │    ││
│  │  │ Mode Ctrl  │  │   Renderer          │    ││
│  │  └────────────┘  └─────────────────────┘    ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Game State Machine

Manages transitions between the three game states.

```javascript
// State constants
const GameState = {
  START_SCREEN: 'START_SCREEN',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

// Transition function (pure)
function transitionState(currentState, event) {
  switch (currentState) {
    case GameState.START_SCREEN:
      if (event === 'INPUT') return GameState.PLAYING;
      break;
    case GameState.PLAYING:
      if (event === 'COLLISION') return GameState.GAME_OVER;
      break;
    case GameState.GAME_OVER:
      if (event === 'INPUT') return GameState.START_SCREEN;
      break;
  }
  return currentState;
}
```

### 2. Physics Engine

Handles player velocity, gravity, terminal velocity clamping, and flap impulse.

```javascript
// Physics constants
const GRAVITY = 0.5;          // pixels/frame²
const FLAP_IMPULSE = -8;      // pixels/frame (upward is negative)
const TERMINAL_VELOCITY = 12; // max downward speed

// Pure physics update
function applyGravity(velocity) {
  const newVelocity = velocity + GRAVITY;
  return Math.min(newVelocity, TERMINAL_VELOCITY);
}

function applyFlap(velocity) {
  return FLAP_IMPULSE;
}

function updatePlayerPosition(player) {
  const newVelocity = applyGravity(player.velocity);
  return {
    ...player,
    velocity: newVelocity,
    y: player.y + newVelocity
  };
}
```

### 3. Pipe System

Generates, moves, and cleans up pipe obstacles.

```javascript
// Pipe constants
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;         // vertical gap between top and bottom pipe
const PIPE_SPEED = 3;         // pixels/frame leftward
const PIPE_INTERVAL = 90;     // frames between new pipe spawns
const MIN_GAP_Y = 80;         // minimum gap top position
const MAX_GAP_Y_OFFSET = 80;  // offset from bottom for max gap position

// Pure pipe generation
function generatePipe(canvasWidth, canvasHeight) {
  const minGapTop = MIN_GAP_Y;
  const maxGapTop = canvasHeight - PIPE_GAP - MAX_GAP_Y_OFFSET;
  const gapTop = Math.random() * (maxGapTop - minGapTop) + minGapTop;
  return {
    x: canvasWidth,
    gapTop: gapTop,
    gapBottom: gapTop + PIPE_GAP,
    width: PIPE_WIDTH,
    scored: false
  };
}

// Pure pipe movement
function movePipe(pipe) {
  return { ...pipe, x: pipe.x - PIPE_SPEED };
}

// Pure cleanup
function isOffScreen(pipe) {
  return pipe.x + pipe.width < 0;
}

function removeOffScreenPipes(pipes) {
  return pipes.filter(pipe => !isOffScreen(pipe));
}
```

### 4. Collision Detection

Axis-aligned bounding box (AABB) collision between player rect and pipe rects, plus boundary checks. Respects the Steering Mode invincibility flag for pipe collisions while maintaining boundary collisions.

```javascript
// Player hitbox (slightly smaller than sprite for fairness)
function getPlayerRect(player, spriteWidth, spriteHeight) {
  const padding = 4;
  return {
    x: player.x + padding,
    y: player.y + padding,
    width: spriteWidth - padding * 2,
    height: spriteHeight - padding * 2
  };
}

// AABB overlap check (pure)
function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Boundary collision (pure) - always active regardless of Steering Mode
function checkBoundaryCollision(playerY, playerHeight, canvasHeight) {
  return playerY <= 0 || playerY + playerHeight >= canvasHeight;
}

// Full collision check (pure) - respects invincibility flag
function checkCollision(playerRect, pipes, canvasHeight, isInvincible) {
  // Boundary check - always active
  if (checkBoundaryCollision(playerRect.y, playerRect.height, canvasHeight)) {
    return true;
  }
  // Pipe collision - disabled during Steering Mode
  if (isInvincible) {
    return false;
  }
  for (const pipe of pipes) {
    const topPipeRect = { x: pipe.x, y: 0, width: pipe.width, height: pipe.gapTop };
    const bottomPipeRect = { x: pipe.x, y: pipe.gapBottom, width: pipe.width, height: canvasHeight - pipe.gapBottom };
    if (rectsOverlap(playerRect, topPipeRect) || rectsOverlap(playerRect, bottomPipeRect)) {
      return true;
    }
  }
  return false;
}
```

### 5. Scoring System

Tracks current score and manages high score persistence.

```javascript
const HIGH_SCORE_KEY = 'flappyKiroHighScore';

// Pure score check
function shouldIncrementScore(playerX, pipe) {
  return !pipe.scored && playerX > pipe.x + pipe.width;
}

// Pure format
function formatScore(score, highScore) {
  return `Score: ${score} | High: ${highScore}`;
}

// Side-effectful persistence
function loadHighScore() {
  return parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
}

function saveHighScore(score, currentHighScore) {
  if (score > currentHighScore) {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
    return score;
  }
  return currentHighScore;
}
```

### 6. Input Handler

Listens for spacebar, mouse click, Shift key, and on-screen activation button. Dispatches flap, state transition, or Steering Mode activation events.

```javascript
function setupInputHandlers(canvas, onInput, onActivateSteering) {
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      onInput();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      e.preventDefault();
      onActivateSteering();
    }
  });
  canvas.addEventListener('click', () => {
    onInput();
  });

  // On-screen activation button
  const activateBtn = document.getElementById('steering-activate-btn');
  if (activateBtn) {
    activateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onActivateSteering();
    });
  }
}
```

### 7. Audio Manager

Preloads and plays sound effects.

```javascript
function createAudioManager() {
  const jumpSound = new Audio('assets/jump.wav');
  const gameOverSound = new Audio('assets/game_over.wav');

  return {
    playJump() { jumpSound.currentTime = 0; jumpSound.play(); },
    playGameOver() { gameOverSound.currentTime = 0; gameOverSound.play(); }
  };
}
```

### 8. Renderer

Draws all visual elements to the canvas based on current game state. Delegates to the Neon Matrix Grid Renderer when Steering Mode is active.

```javascript
function render(ctx, gameContext, spriteImage, canvasWidth, canvasHeight) {
  const { state, player, pipes, score, highScore, steeringModeActive, dataPackets } = gameContext;

  // Background - neon matrix grid during Steering Mode, dark theme otherwise
  if (steeringModeActive) {
    renderNeonMatrixGrid(ctx, canvasWidth, canvasHeight);
  } else {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  if (state === GameState.PLAYING || state === GameState.GAME_OVER) {
    // Draw pipes (green)
    ctx.fillStyle = '#00d400';
    for (const pipe of pipes) {
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapTop);
      ctx.fillRect(pipe.x, pipe.gapBottom, pipe.width, canvasHeight - pipe.gapBottom);
    }

    // Draw data packets (glowing purple circles)
    for (const packet of dataPackets) {
      renderDataPacket(ctx, packet);
    }

    // Draw player sprite (with purple translucent effect during Steering Mode)
    if (steeringModeActive) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(spriteImage, player.x, player.y);
      ctx.globalAlpha = 1.0;
      // Purple overlay
      ctx.fillStyle = 'rgba(128, 0, 255, 0.3)';
      ctx.fillRect(player.x, player.y, spriteImage.width, spriteImage.height);
    } else {
      ctx.drawImage(spriteImage, player.x, player.y);
    }

    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(formatScore(score, highScore), 10, 30);
  }

  if (state === GameState.START_SCREEN) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Flappy Kiro', canvasWidth / 2, canvasHeight / 3);
    ctx.font = '16px monospace';
    ctx.fillText('Press SPACE or Click to Start', canvasWidth / 2, canvasHeight / 2);
    ctx.textAlign = 'left';
  }

  if (state === GameState.GAME_OVER) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvasWidth / 2, canvasHeight / 3);
    ctx.font = '16px monospace';
    ctx.fillText('Press SPACE or Click to Restart', canvasWidth / 2, canvasHeight / 2);
    ctx.textAlign = 'left';
  }
}
```

### 9. Data Packet System

Handles spawning, movement, collision/collection of Data Packets within pipe gaps.

```javascript
const DATA_PACKET_RADIUS = 12;  // pixels

// Spawn a data packet within a pipe's vertical gap
function spawnDataPacket(pipe) {
  const minY = pipe.gapTop + DATA_PACKET_RADIUS;
  const maxY = pipe.gapBottom - DATA_PACKET_RADIUS;
  const y = Math.random() * (maxY - minY) + minY;
  return {
    x: pipe.x + pipe.width / 2,
    y: y,
    radius: DATA_PACKET_RADIUS,
    collected: false
  };
}

// Pure movement - same speed as pipes
function moveDataPacket(packet) {
  return { ...packet, x: packet.x - PIPE_SPEED };
}

// Check if player overlaps a data packet (circle-rect collision)
function checkDataPacketCollision(playerRect, packet) {
  const closestX = Math.max(playerRect.x, Math.min(packet.x, playerRect.x + playerRect.width));
  const closestY = Math.max(playerRect.y, Math.min(packet.y, playerRect.y + playerRect.height));
  const distX = packet.x - closestX;
  const distY = packet.y - closestY;
  return (distX * distX + distY * distY) <= (packet.radius * packet.radius);
}

// Collect packets that overlap with the player
function collectDataPackets(playerRect, packets) {
  const collected = [];
  const remaining = [];
  for (const packet of packets) {
    if (checkDataPacketCollision(playerRect, packet)) {
      collected.push(packet);
    } else {
      remaining.push(packet);
    }
  }
  return { collected, remaining };
}

// Remove off-screen data packets
function removeOffScreenDataPackets(packets) {
  return packets.filter(p => p.x + p.radius > 0);
}

// Render a single data packet as a glowing purple circle
function renderDataPacket(ctx, packet) {
  ctx.beginPath();
  ctx.arc(packet.x, packet.y, packet.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(160, 32, 240, 0.8)';
  ctx.fill();
  // Glow effect
  ctx.shadowColor = '#a020f0';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.closePath();
}
```

### 10. Steering Charge Manager

Tracks the Steering Charge meter, handles +25% increments, enforces 100% cap, and updates the HTML progress bar.

```javascript
const CHARGE_PER_PACKET = 25;  // percentage points per Data Packet
const MAX_CHARGE = 100;        // percentage cap

// Pure charge update
function addSteeringCharge(currentCharge, packetsCollected) {
  const added = currentCharge + (packetsCollected * CHARGE_PER_PACKET);
  return Math.min(added, MAX_CHARGE);
}

// Check if activation is allowed
function canActivateSteering(charge, steeringModeActive) {
  return charge >= MAX_CHARGE && !steeringModeActive;
}

// Update HTML progress bar (side-effectful)
function updateChargeBar(charge) {
  const bar = document.getElementById('steering-charge-bar');
  if (bar) {
    bar.style.width = `${charge}%`;
  }
}
```

### 11. Steering Mode Controller

Manages activation, 5-second timer, autopilot navigation, invincibility flag, and depletion.

```javascript
const STEERING_MODE_DURATION = 5000;  // 5 seconds in milliseconds

// Activate steering mode (pure state update)
function activateSteeringMode(gameContext) {
  return {
    ...gameContext,
    steeringModeActive: true,
    steeringModeTimer: STEERING_MODE_DURATION
  };
}

// Deactivate steering mode (pure state update)
function deactivateSteeringMode(gameContext) {
  return {
    ...gameContext,
    steeringModeActive: false,
    steeringModeTimer: 0,
    steeringCharge: 0
  };
}

// Linear depletion of charge over duration (pure)
function depleteCharge(currentCharge, elapsedMs) {
  const drainRate = MAX_CHARGE / STEERING_MODE_DURATION;  // % per ms
  const newCharge = currentCharge - (drainRate * elapsedMs);
  return Math.max(newCharge, 0);
}

// Autopilot: calculate target velocity to guide player through next gap
function calculateAutopilotVelocity(playerY, playerHeight, pipes, playerX) {
  // Find next upcoming pipe
  const nextPipe = pipes.find(p => p.x + p.width > playerX);
  if (!nextPipe) {
    return 0; // No pipe ahead, maintain position
  }
  // Target the center of the gap
  const gapCenter = (nextPipe.gapTop + nextPipe.gapBottom) / 2;
  const playerCenter = playerY + playerHeight / 2;
  const diff = gapCenter - playerCenter;

  // Proportional control to smoothly guide toward gap center
  const maxSpeed = 6;
  const velocity = Math.max(-maxSpeed, Math.min(maxSpeed, diff * 0.15));
  return velocity;
}

// Update steering mode each frame (pure)
function updateSteeringMode(gameContext, deltaMs) {
  if (!gameContext.steeringModeActive) {
    return gameContext;
  }

  const newTimer = gameContext.steeringModeTimer - deltaMs;
  const newCharge = depleteCharge(gameContext.steeringCharge, deltaMs);

  if (newTimer <= 0 || newCharge <= 0) {
    return deactivateSteeringMode(gameContext);
  }

  return {
    ...gameContext,
    steeringModeTimer: newTimer,
    steeringCharge: newCharge
  };
}
```

### 12. Neon Matrix Grid Renderer

Renders the animated neon matrix grid background during Steering Mode.

```javascript
// Neon matrix grid state
let matrixColumns = [];

function initMatrixGrid(canvasWidth, canvasHeight) {
  const columnWidth = 20;
  const numColumns = Math.ceil(canvasWidth / columnWidth);
  matrixColumns = Array.from({ length: numColumns }, () => ({
    y: Math.random() * canvasHeight,
    speed: 2 + Math.random() * 4
  }));
}

function renderNeonMatrixGrid(ctx, canvasWidth, canvasHeight) {
  // Dark purple base
  ctx.fillStyle = '#0a0015';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Grid lines (neon green)
  ctx.strokeStyle = 'rgba(0, 255, 100, 0.15)';
  ctx.lineWidth = 1;
  const gridSpacing = 30;

  // Vertical grid lines
  for (let x = 0; x < canvasWidth; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }

  // Horizontal grid lines
  for (let y = 0; y < canvasHeight; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  // Falling matrix-style characters
  ctx.fillStyle = 'rgba(0, 255, 100, 0.7)';
  ctx.font = '14px monospace';
  const columnWidth = 20;
  for (let i = 0; i < matrixColumns.length; i++) {
    const col = matrixColumns[i];
    const char = String.fromCharCode(0x30A0 + Math.random() * 96);
    ctx.fillText(char, i * columnWidth, col.y);
    col.y += col.speed;
    if (col.y > canvasHeight) {
      col.y = 0;
    }
  }
}
```

## Data Models

### Player State

```javascript
{
  x: number,        // horizontal position (fixed during gameplay)
  y: number,        // vertical position
  velocity: number  // vertical velocity (positive = downward)
}
```

### Pipe Pair

```javascript
{
  x: number,        // horizontal position of pipe left edge
  gapTop: number,   // y-coordinate where the gap starts (top pipe ends)
  gapBottom: number, // y-coordinate where the gap ends (bottom pipe starts)
  width: number,    // pipe width in pixels
  scored: boolean   // whether player has already passed this pipe
}
```

### Data Packet

```javascript
{
  x: number,        // horizontal center position
  y: number,        // vertical center position
  radius: number,   // collision/render radius in pixels
  collected: boolean // whether this packet has been collected
}
```

### Game Context

```javascript
{
  state: GameState,            // current game state
  player: PlayerState,         // player position and velocity
  pipes: PipePair[],           // active pipe obstacles
  score: number,               // current score
  highScore: number,           // best score from localStorage
  frameCount: number,          // frames since last pipe spawn
  dataPackets: DataPacket[],   // active data packets on screen
  steeringCharge: number,      // 0-100 percentage of charge meter
  steeringModeActive: boolean, // whether Steering Mode is currently active
  steeringModeTimer: number    // milliseconds remaining in Steering Mode
}
```

## Interfaces

### Game Loop Interface

```javascript
// Main game loop - called every frame via requestAnimationFrame
function gameLoop(timestamp) {
  const deltaMs = timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  update(deltaMs);  // update game state (including steering mode timer)
  render();         // draw current frame
  requestAnimationFrame(gameLoop);
}
```

### Public API (module entry point)

```javascript
function initGame() {
  // 1. Get canvas and context
  // 2. Load sprite image
  // 3. Load high score from localStorage
  // 4. Setup input handlers (spacebar, click, Shift, activation button)
  // 5. Create audio manager
  // 6. Initialize steering charge bar element
  // 7. Initialize matrix grid columns
  // 8. Start game loop
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initGame);
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Sprite image fails to load | Fall back to a colored rectangle for the player |
| Audio fails to play (autoplay policy) | Silently catch and ignore - game continues without sound |
| localStorage unavailable | Default high score to 0, skip persistence |
| Canvas context unavailable | Display error message in the HTML body |
| Steering charge bar element missing | Skip visual meter updates, maintain internal charge state |
| Activation button element missing | Rely on Shift key only for Steering Mode activation |

## Testing Strategy

- **Unit tests**: Verify specific examples and edge cases for state transitions, physics edge values, and collision detection corner cases.
- **Property tests**: Verify universal properties across randomized inputs for physics, collision geometry, scoring, steering charge accumulation, depletion, and autopilot behavior.
- Property tests should run a minimum of 100 iterations per property.
- Pure functions (physics, collision, scoring, charge management, depletion) are the primary targets for property-based testing.
- Side-effectful code (audio, localStorage, DOM updates) should use example-based tests with mocks.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: State machine transitions are valid

*For any* sequence of events (INPUT, COLLISION) applied to any valid game state, the resulting state is always one of START_SCREEN, PLAYING, or GAME_OVER, and transitions follow the rules: START_SCREEN + INPUT → PLAYING, PLAYING + COLLISION → GAME_OVER, GAME_OVER + INPUT → START_SCREEN.

**Validates: Requirements 3.1, 3.3, 3.4, 3.5**

### Property 2: Gravity increases downward velocity

*For any* player velocity value, applying one frame of gravity produces a new velocity equal to the original velocity plus the gravity constant (before terminal velocity clamping).

**Validates: Requirements 5.1**

### Property 3: Terminal velocity is never exceeded

*For any* player velocity after a physics update, the resulting downward velocity never exceeds the terminal velocity constant.

**Validates: Requirements 5.2**

### Property 4: Flap sets upward impulse

*For any* player velocity value, applying a flap results in the velocity being set to the flap impulse constant (a negative/upward value), regardless of the prior velocity.

**Validates: Requirements 5.3, 5.4**

### Property 5: Pipe gaps are within valid bounds

*For any* generated pipe pair given a canvas height, the gap top position is at least MIN_GAP_Y from the ceiling and the gap bottom is at least MAX_GAP_Y_OFFSET from the canvas floor, ensuring the player always has a passable opening.

**Validates: Requirements 6.1**

### Property 6: Constant leftward movement

*For any* pipe or data packet at horizontal position x, after one movement update, its new x position equals x minus the pipe speed constant. Pipes and data packets move at the same speed.

**Validates: Requirements 6.3, 11.3**

### Property 7: Off-screen entities are removed

*For any* set of pipes where some have moved entirely past the left edge (x + width < 0), after cleanup no pipe in the resulting set has x + width < 0. The same holds for data packets where x + radius < 0.

**Validates: Requirements 6.4, 11.4**

### Property 8: Collision detection is geometrically correct

*For any* player rectangle and pipe rectangle pair, the collision function returns true if and only if the two axis-aligned bounding boxes overlap. Additionally, *for any* player y position at or below 0 (ceiling) or at or above canvas height (ground), boundary collision returns true.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 9: Score increments exactly once per pipe passed

*For any* pipe that has not been scored and whose trailing edge (x + width) is less than the player's x position, the score increments by exactly 1, and the pipe is marked as scored to prevent double-counting.

**Validates: Requirements 8.1**

### Property 10: Score format string is correct

*For any* non-negative integer score S and non-negative integer high score H, the format function produces exactly the string "Score: S | High: H".

**Validates: Requirements 8.3**

### Property 11: High score persistence updates correctly

*For any* current score S and stored high score H, if S > H then the new stored high score becomes S; otherwise it remains H.

**Validates: Requirements 9.2**

### Property 12: Data packets spawn within pipe gap bounds

*For any* spawned data packet associated with a pipe pair, the packet's y-coordinate (center) is within the vertical gap of that pipe, such that gapTop + radius ≤ y ≤ gapBottom - radius.

**Validates: Requirements 11.1**

### Property 13: Data packet collection removes packet from active list

*For any* data packet whose bounding circle overlaps the player's bounding rectangle, after the collection step that packet no longer exists in the active data packets list.

**Validates: Requirements 11.5**

### Property 14: Steering charge accumulates in 25% increments with 100% cap

*For any* current charge value between 0 and 100, collecting N data packets results in a charge of min(currentCharge + N * 25, 100). The charge never exceeds 100%.

**Validates: Requirements 12.3, 12.4**

### Property 15: Steering Mode activation requires full charge

*For any* game state where steeringCharge is below 100%, attempting to activate Steering Mode has no effect (steeringModeActive remains false). *For any* game state where steeringCharge equals 100% and steeringModeActive is false, triggering activation sets steeringModeActive to true and initializes the timer to 5 seconds.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 16: Autopilot guides player toward gap center

*For any* active Steering Mode state with at least one upcoming pipe, the autopilot velocity calculation produces a value that moves the player's vertical center toward the center of the next pipe gap (reducing the distance between player center and gap center).

**Validates: Requirements 14.1**

### Property 17: Manual input is overridden during Steering Mode

*For any* game state where steeringModeActive is true, a flap input event does not modify the player's velocity (autopilot controls velocity exclusively).

**Validates: Requirements 14.2**

### Property 18: Selective invincibility during Steering Mode

*For any* player position overlapping a pipe while steeringModeActive is true, the collision function returns false (no pipe collision triggered). However, *for any* player position at or beyond the ground or ceiling boundary while steeringModeActive is true, the collision function still returns true.

**Validates: Requirements 15.1, 15.3**

### Property 19: Linear charge depletion over 5 seconds

*For any* elapsed time t (in milliseconds) during active Steering Mode, the steering charge equals max(0, 100 - (100/5000) * t). When the charge reaches 0, Steering Mode deactivates.

**Validates: Requirements 16.1, 16.2**

### Property 20: Steering Mode deactivation restores normal behavior

*For any* game state where Steering Mode has just deactivated (timer expired or charge depleted), the resulting state has steeringModeActive = false, steeringCharge = 0, and subsequent flap inputs modify the player velocity, gravity applies normally, and pipe collision detection is active.

**Validates: Requirements 16.3**
