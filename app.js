// === Game State Machine ===

const GameState = {
  START_SCREEN: 'START_SCREEN',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

/**
 * Pure state transition function.
 * Returns the next state based on current state and event.
 * Returns current state unchanged for undefined combinations.
 */
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

// === Physics Constants ===

const GRAVITY = 0.5;            // pixels/frame²
const FLAP_IMPULSE = -8;        // pixels/frame (upward)
const TERMINAL_VELOCITY = 12;   // max downward speed

// === Pipe Constants ===

const PIPE_WIDTH = 60;          // pixels
const PIPE_GAP = 150;           // vertical gap between pipes
const PIPE_SPEED = 3;           // leftward pixels/frame
const PIPE_INTERVAL = 90;       // frames between spawns
const MIN_GAP_Y = 80;           // min gap top position
const MAX_GAP_Y_OFFSET = 80;    // offset from bottom for max gap

// === Canvas Dimensions ===

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

// === Data Packet Constants ===

const DATA_PACKET_RADIUS = 12;

// === Steering Mode Constants ===

const CHARGE_PER_PACKET = 25;           // percentage per Data Packet
const MAX_CHARGE = 100;                 // percentage cap
const STEERING_MODE_DURATION = 5000;    // milliseconds

// === Storage Constants ===

const HIGH_SCORE_KEY = 'flappyKiroHighScore';

// === Physics Engine ===

/**
 * Applies gravity to the current velocity and clamps to terminal velocity.
 * Returns the new velocity (positive = downward).
 */
function applyGravity(velocity) {
  const newVelocity = velocity + GRAVITY;
  return Math.min(newVelocity, TERMINAL_VELOCITY);
}

/**
 * Returns the flap impulse constant (negative = upward).
 */
function applyFlap() {
  return FLAP_IMPULSE;
}

/**
 * Applies gravity to the player and updates vertical position.
 * Returns a new player object with updated velocity and y.
 */
function updatePlayerPosition(player) {
  const newVelocity = applyGravity(player.velocity);
  return {
    ...player,
    velocity: newVelocity,
    y: player.y + newVelocity
  };
}

// === Pipe System ===

/**
 * Generates a new pipe pair at the right edge of the canvas.
 * The gap top position is randomized within valid bounds ensuring
 * the player always has a passable opening.
 */
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

/**
 * Moves a pipe leftward by PIPE_SPEED pixels.
 * Returns a new pipe object with updated x position.
 */
function movePipe(pipe) {
  return { ...pipe, x: pipe.x - PIPE_SPEED };
}

/**
 * Checks whether a pipe has moved entirely off the left edge of the canvas.
 */
function isOffScreen(pipe) {
  return pipe.x + pipe.width < 0;
}

/**
 * Filters out pipes that have moved off-screen.
 * Returns a new array containing only visible pipes.
 */
function removeOffScreenPipes(pipes) {
  return pipes.filter(pipe => !isOffScreen(pipe));
}

// === Scoring System ===

/**
 * Checks if the player has passed a pipe's trailing edge.
 * Returns true if the pipe hasn't been scored yet and the player
 * has moved past the pipe's right edge (x + width).
 */
function shouldIncrementScore(playerX, pipe) {
  return !pipe.scored && playerX > pipe.x + pipe.width;
}

/**
 * Formats the current score and high score into a display string.
 * Returns "Score: X | High: Y" format.
 */
function formatScore(score, highScore) {
  return `Score: ${score} | High: ${highScore}`;
}

/**
 * Loads the high score from localStorage.
 * Returns 0 if no high score is stored or localStorage is unavailable.
 */
function loadHighScore() {
  return parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
}

/**
 * Saves the high score to localStorage if the current score exceeds it.
 * Returns the new high score (either the current score or the existing high score).
 */
function saveHighScore(score, currentHighScore) {
  if (score > currentHighScore) {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
    return score;
  }
  return currentHighScore;
}

// === Collision Detection ===

/**
 * Constructs the player's hitbox rectangle with inward padding for fairness.
 * The padding shrinks the collision rect so near-misses don't feel unfair.
 */
function getPlayerRect(player, spriteWidth, spriteHeight) {
  const padding = 4;
  return {
    x: player.x + padding,
    y: player.y + padding,
    width: spriteWidth - padding * 2,
    height: spriteHeight - padding * 2
  };
}

/**
 * Axis-aligned bounding box overlap check.
 * Returns true if rectangles a and b intersect.
 */
function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Checks if the player has hit the ceiling (y <= 0) or ground (y + height >= canvasHeight).
 * Boundary collisions remain active even during Steering Mode.
 */
function checkBoundaryCollision(playerY, playerHeight, canvasHeight) {
  return playerY <= 0 || playerY + playerHeight >= canvasHeight;
}

/**
 * Full collision check combining boundary and pipe collision.
 * Boundary collisions are always enforced.
 * Pipe collisions are skipped when the player is invincible (Steering Mode).
 */
function checkCollision(playerRect, pipes, canvasHeight, isInvincible) {
  if (checkBoundaryCollision(playerRect.y, playerRect.height, canvasHeight)) {
    return true;
  }
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

// === Data Packet System ===

/**
 * Spawns a data packet at a random vertical position within a pipe's gap.
 * The packet center is constrained so the full circle stays inside the gap bounds.
 * Returns a new data packet object positioned at the pipe's horizontal center.
 */
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

/**
 * Moves a data packet leftward at the same speed as pipes.
 * Returns a new packet object with updated x position.
 */
function moveDataPacket(packet) {
  return { ...packet, x: packet.x - PIPE_SPEED };
}

/**
 * Circle-rect collision detection between a player rectangle and a data packet.
 * Finds the closest point on the rectangle to the circle center,
 * then checks if the distance is within the circle's radius.
 */
function checkDataPacketCollision(playerRect, packet) {
  const closestX = Math.max(playerRect.x, Math.min(packet.x, playerRect.x + playerRect.width));
  const closestY = Math.max(playerRect.y, Math.min(packet.y, playerRect.y + playerRect.height));
  const distX = packet.x - closestX;
  const distY = packet.y - closestY;
  return (distX * distX + distY * distY) <= (packet.radius * packet.radius);
}

/**
 * Partitions packets into collected and remaining based on player overlap.
 * Returns an object with two arrays: collected packets and remaining active packets.
 */
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

/**
 * Removes data packets that have moved entirely off the left edge of the canvas.
 * A packet is off-screen when its rightmost point (x + radius) is at or below 0.
 */
function removeOffScreenDataPackets(packets) {
  return packets.filter(p => p.x + p.radius > 0);
}

// === Steering Charge Manager ===

/**
 * Adds steering charge based on the number of data packets collected.
 * Each packet adds CHARGE_PER_PACKET (25%) to the current charge.
 * The result is capped at MAX_CHARGE (100%).
 */
function addSteeringCharge(currentCharge, packetsCollected) {
  const added = currentCharge + (packetsCollected * CHARGE_PER_PACKET);
  return Math.min(added, MAX_CHARGE);
}

/**
 * Checks whether Steering Mode can be activated.
 * Requires full charge (100%) and Steering Mode not already active.
 */
function canActivateSteering(charge, steeringModeActive) {
  return charge >= MAX_CHARGE && !steeringModeActive;
}

/**
 * Updates the HTML steering charge progress bar width to reflect current charge.
 * Skips update gracefully if the bar element is not found in the DOM.
 */
function updateChargeBar(charge) {
  const bar = document.getElementById('steering-charge-bar');
  if (bar) {
    bar.style.width = `${charge}%`;
  }
}

// === Steering Mode Controller ===

/**
 * Activates Steering Mode by setting the active flag and initializing
 * the 5-second duration timer. Returns a new game context with steering active.
 */
function activateSteeringMode(gameContext) {
  return {
    ...gameContext,
    steeringModeActive: true,
    steeringModeTimer: STEERING_MODE_DURATION
  };
}

/**
 * Deactivates Steering Mode, restoring normal gameplay state.
 * Clears the active flag, resets the timer, and zeroes the charge meter.
 */
function deactivateSteeringMode(gameContext) {
  return {
    ...gameContext,
    steeringModeActive: false,
    steeringModeTimer: 0,
    steeringCharge: 0
  };
}

/**
 * Depletes steering charge linearly over the full STEERING_MODE_DURATION.
 * Drain rate is MAX_CHARGE / STEERING_MODE_DURATION per millisecond.
 * Returns the new charge clamped to a minimum of 0.
 */
function depleteCharge(currentCharge, elapsedMs) {
  const drainRate = MAX_CHARGE / STEERING_MODE_DURATION;
  const newCharge = currentCharge - (drainRate * elapsedMs);
  return Math.max(newCharge, 0);
}

/**
 * Updates steering mode state each frame. Decrements the timer,
 * depletes the charge, and deactivates if either reaches zero.
 * Returns the game context unchanged if steering mode is not active.
 */
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

// === Autopilot Behavior ===

/**
 * Calculates the autopilot velocity to guide the player toward the center
 * of the next upcoming pipe gap. Uses proportional control with a capped
 * max speed for smooth navigation.
 *
 * Returns 0 if no pipe is ahead (maintain current position).
 * The velocity is clamped to [-maxSpeed, maxSpeed] for smooth movement.
 */
function calculateAutopilotVelocity(playerY, playerHeight, pipes, playerX, timeRemainingMs) {
  const nextPipe = pipes.find(p => p.x + p.width > playerX);
  if (!nextPipe) {
    return 0;
  }
  const gapCenter = (nextPipe.gapTop + nextPipe.gapBottom) / 2;
  const playerCenter = playerY + playerHeight / 2;
  const diff = gapCenter - playerCenter;
  const maxSpeed = 6;
  let velocity = Math.max(-maxSpeed, Math.min(maxSpeed, diff * 0.15));

  // Ease off velocity in the last 800ms to prevent post-steering collision
  if (timeRemainingMs < 800) {
    const easeFactor = timeRemainingMs / 800;
    velocity *= easeFactor;
  }

  return velocity;
}

// === Neon Matrix Grid Renderer ===

/**
 * State for falling matrix-style character columns.
 * Each column tracks a y position and fall speed.
 */
let matrixColumns = [];

/**
 * Initializes the matrix grid columns for the neon background effect.
 * Creates one column per 20px of canvas width, each with a random
 * starting y position and random fall speed between 2-6 pixels/frame.
 */
function initMatrixGrid(canvasWidth, canvasHeight) {
  const columnWidth = 20;
  const numColumns = Math.ceil(canvasWidth / columnWidth);
  matrixColumns = Array.from({ length: numColumns }, () => ({
    y: Math.random() * canvasHeight,
    speed: 2 + Math.random() * 4
  }));
}

/**
 * Renders the animated neon matrix grid background used during Steering Mode.
 * Draws a dark purple base, semi-transparent neon green grid lines,
 * and falling matrix-style characters that wrap around the canvas.
 */
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

// === Audio Manager ===

/**
 * Creates an audio manager that preloads sound effects and provides
 * playback methods. Wraps play() calls in try/catch to handle
 * browser autoplay policy silently.
 */
function createAudioManager() {
  const jumpSound = new Audio('assets/jump.wav');
  const gameOverSound = new Audio('assets/game_over.wav');

  return {
    playJump() {
      try { jumpSound.currentTime = 0; jumpSound.play().catch(() => {}); } catch (e) {}
    },
    playGameOver() {
      try { gameOverSound.currentTime = 0; gameOverSound.play().catch(() => {}); } catch (e) {}
    }
  };
}

// === Input Handler ===

/**
 * Sets up all input handlers for the game.
 * Listens for Spacebar and mouse click to trigger flap/state transitions (onInput).
 * Listens for Shift key and on-screen activation button for Steering Mode (onActivateSteering).
 * Prevents default browser behavior for game keys to avoid page scrolling.
 */
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

  // On-screen activation button for Steering Mode
  const activateBtn = document.getElementById('steering-activate-btn');
  if (activateBtn) {
    activateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onActivateSteering();
    });
  }
}

// === Renderer ===

/**
 * Renders a single data packet as a glowing purple circle.
 * Uses canvas shadowBlur for the neon glow effect.
 */
function renderDataPacket(ctx, packet) {
  ctx.beginPath();
  ctx.arc(packet.x, packet.y, packet.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(160, 32, 240, 0.8)';
  ctx.fill();
  ctx.shadowColor = '#a020f0';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.closePath();
}

/**
 * Main render function. Draws all visual elements to the canvas
 * based on the current game state. Delegates to renderNeonMatrixGrid
 * when Steering Mode is active.
 *
 * This function does NOT mutate game state — it only reads and draws.
 */
function render(ctx, gameContext, spriteImage, canvasWidth, canvasHeight) {
  const { state, player, pipes, score, highScore, steeringModeActive, dataPackets } = gameContext;

  // Background
  if (steeringModeActive) {
    renderNeonMatrixGrid(ctx, canvasWidth, canvasHeight);
  } else {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  if (state === GameState.PLAYING || state === GameState.GAME_OVER) {
    // Pipes (green rectangles)
    ctx.fillStyle = '#00d400';
    for (const pipe of pipes) {
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapTop);
      ctx.fillRect(pipe.x, pipe.gapBottom, pipe.width, canvasHeight - pipe.gapBottom);
    }

    // Data packets (glowing purple circles)
    for (const packet of dataPackets) {
      renderDataPacket(ctx, packet);
    }

    // Player sprite (with translucent purple overlay during Steering Mode)
    if (steeringModeActive) {
      ctx.globalAlpha = 0.6;
      if (spriteLoadFailed) {
        ctx.fillStyle = '#a020f0';
        ctx.fillRect(player.x, player.y, SPRITE_WIDTH, SPRITE_HEIGHT);
      } else {
        ctx.drawImage(spriteImage, player.x, player.y, SPRITE_WIDTH, SPRITE_HEIGHT);
      }
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'rgba(128, 0, 255, 0.3)';
      ctx.fillRect(player.x, player.y, SPRITE_WIDTH, SPRITE_HEIGHT);
    } else {
      if (spriteLoadFailed) {
        ctx.fillStyle = '#a020f0';
        ctx.fillRect(player.x, player.y, SPRITE_WIDTH, SPRITE_HEIGHT);
      } else {
        ctx.drawImage(spriteImage, player.x, player.y, SPRITE_WIDTH, SPRITE_HEIGHT);
      }
    }

    // Score (offset below the steering charge bar)
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(formatScore(score, highScore), 10, 50);
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

// === Sprite Constants ===

const SPRITE_WIDTH = 34;
const SPRITE_HEIGHT = 34;

// === Game Initialization and Main Loop ===

let gameContext = null;
let spriteImage = null;
let spriteLoadFailed = false;
let audioManager = null;
let lastTimestamp = 0;
let ctx = null;

/**
 * Resets the game context to initial playing state.
 * Called when transitioning from START_SCREEN or restarting after GAME_OVER.
 */
function resetGame() {
  gameContext.player = { x: 80, y: 250, velocity: 0 };
  gameContext.pipes = [];
  gameContext.dataPackets = [];
  gameContext.score = 0;
  gameContext.steeringCharge = 0;
  gameContext.steeringModeActive = false;
  gameContext.steeringModeTimer = 0;
  gameContext.frameCount = 0;
  updateChargeBar(0);
}

/**
 * Handles primary input (Space / Click).
 * START_SCREEN → reset and play; PLAYING → flap; GAME_OVER → restart.
 */
function onInput() {
  if (gameContext.state === GameState.START_SCREEN) {
    resetGame();
    gameContext.state = transitionState(gameContext.state, 'INPUT');
  } else if (gameContext.state === GameState.PLAYING) {
    gameContext.player.velocity = applyFlap();
    audioManager.playJump();
  } else if (gameContext.state === GameState.GAME_OVER) {
    gameContext.state = transitionState(gameContext.state, 'INPUT');
  }
}

/**
 * Handles Steering Mode activation input (Shift / Button).
 * Only activates if PLAYING and charge is full.
 */
function onActivateSteering() {
  if (gameContext.state === GameState.PLAYING && canActivateSteering(gameContext.steeringCharge, gameContext.steeringModeActive)) {
    gameContext = activateSteeringMode(gameContext);
    const btn = document.getElementById('steering-activate-btn');
    if (btn) btn.style.display = 'none';
  }
}

/**
 * Updates game state each frame. Only processes during PLAYING state.
 * Orchestrates physics, pipes, data packets, steering mode, collision, and scoring.
 */
function update(deltaMs) {
  if (gameContext.state !== GameState.PLAYING) return;

  // Player movement: normal gravity always applies, player retains manual control
  // During steering mode, invincibility is handled by collision detection
  gameContext.player = updatePlayerPosition(gameContext.player);

  // Update steering mode timer and depletion
  gameContext = updateSteeringMode(gameContext, deltaMs);

  // Move pipes
  gameContext.pipes = gameContext.pipes.map(movePipe);

  // Spawn new pipes based on frame count
  gameContext.frameCount++;
  if (gameContext.frameCount >= PIPE_INTERVAL) {
    gameContext.frameCount = 0;
    const newPipe = generatePipe(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameContext.pipes.push(newPipe);

    // Spawn data packet with 70% chance per new pipe
    if (Math.random() < 0.7) {
      const packet = spawnDataPacket(newPipe);
      gameContext.dataPackets.push(packet);
    }
  }

  // Remove off-screen pipes
  gameContext.pipes = removeOffScreenPipes(gameContext.pipes);

  // Move and clean up data packets
  gameContext.dataPackets = gameContext.dataPackets.map(moveDataPacket);
  gameContext.dataPackets = removeOffScreenDataPackets(gameContext.dataPackets);

  // Collect data packets
  const playerRect = getPlayerRect(gameContext.player, SPRITE_WIDTH, SPRITE_HEIGHT);
  const { collected, remaining } = collectDataPackets(playerRect, gameContext.dataPackets);
  gameContext.dataPackets = remaining;

  if (collected.length > 0) {
    gameContext.steeringCharge = addSteeringCharge(gameContext.steeringCharge, collected.length);
    updateChargeBar(gameContext.steeringCharge);
  }

  // Show/hide activation button based on charge readiness
  const btn = document.getElementById('steering-activate-btn');
  if (btn) {
    if (canActivateSteering(gameContext.steeringCharge, gameContext.steeringModeActive)) {
      btn.style.display = 'block';
    } else {
      btn.style.display = 'none';
    }
  }

  // Scoring: check if player passed any pipe
  for (const pipe of gameContext.pipes) {
    if (shouldIncrementScore(gameContext.player.x, pipe)) {
      pipe.scored = true;
      gameContext.score++;
    }
  }

  // Collision detection
  const collision = checkCollision(playerRect, gameContext.pipes, CANVAS_HEIGHT, gameContext.steeringModeActive);
  if (collision) {
    gameContext.state = transitionState(gameContext.state, 'COLLISION');
    audioManager.playGameOver();
    gameContext.highScore = saveHighScore(gameContext.score, gameContext.highScore);
  }
}

/**
 * Main game loop driven by requestAnimationFrame.
 * Calculates delta time and orchestrates update + render each frame.
 */
function gameLoop(timestamp) {
  const deltaMs = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  update(deltaMs);
  render(ctx, gameContext, spriteImage, CANVAS_WIDTH, CANVAS_HEIGHT);
  requestAnimationFrame(gameLoop);
}

/**
 * Initializes the game: sets up canvas, loads assets, initializes subsystems,
 * and starts the game loop.
 */
function initGame() {
  const canvas = document.getElementById('game-canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  ctx = canvas.getContext('2d');

  // Load sprite image with fallback
  spriteImage = new Image();
  spriteImage.src = 'assets/ghosty.png';
  spriteImage.onerror = () => {
    spriteLoadFailed = true;
  };

  // Load high score
  const highScore = loadHighScore();

  // Create audio manager
  audioManager = createAudioManager();

  // Initialize matrix grid for steering mode background
  initMatrixGrid(CANVAS_WIDTH, CANVAS_HEIGHT);

  // Initialize game context
  gameContext = {
    state: GameState.START_SCREEN,
    player: { x: 80, y: 250, velocity: 0 },
    pipes: [],
    dataPackets: [],
    score: 0,
    highScore: highScore,
    frameCount: 0,
    steeringCharge: 0,
    steeringModeActive: false,
    steeringModeTimer: 0
  };

  // Update charge bar to initial state
  updateChargeBar(0);

  // Setup input handlers
  setupInputHandlers(canvas, onInput, onActivateSteering);

  // Start game loop
  requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', initGame);
