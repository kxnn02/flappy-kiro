// === Game State Machine ===

const GameState = {
  START_SCREEN: 'START_SCREEN',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
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
      if (event === 'ESCAPE') return GameState.PAUSED;
      break;
    case GameState.PAUSED:
      if (event === 'ESCAPE') return GameState.PLAYING;
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

// === Difficulty Constants ===

const DIFFICULTY_STEP = 5;      // score interval for difficulty increase
const SPEED_INCREMENT = 0.3;    // pipe speed increase per step
const GAP_DECREMENT = 5;        // gap size decrease per step
const MIN_GAP = 100;            // minimum allowed pipe gap
const MAX_PIPE_SPEED = 6;       // maximum allowed pipe speed

// === Canvas Dimensions ===

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

// === Data Packet Constants ===

const DATA_PACKET_RADIUS = 12;

// === Pipe Cap Constants ===

const CAP_OVERHANG = 6;                 // extra pixels on each side of pipe cap
const CAP_HEIGHT = 20;                  // height of pipe cap rectangle

// === Screen Shake Constants ===

const SHAKE_DURATION = 300;             // milliseconds
const SHAKE_INTENSITY = 5;              // max pixel offset in any direction

// === Steering Mode Constants ===

const CHARGE_PER_PACKET = 25;           // percentage per Data Packet
const MAX_CHARGE = 100;                 // percentage cap
const STEERING_MODE_DURATION = 5000;    // milliseconds

// === Grace Period Constants ===

const GRACE_DURATION = 1500;     // milliseconds of invincibility at game start
const GRACE_FLASH_RATE = 150;    // milliseconds per flash cycle

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
 * Accepts an optional pipeGap parameter for difficulty scaling.
 */
function generatePipe(canvasWidth, canvasHeight, pipeGap) {
  const gap = pipeGap !== undefined ? pipeGap : PIPE_GAP;
  const minGapTop = MIN_GAP_Y;
  const maxGapTop = canvasHeight - gap - MAX_GAP_Y_OFFSET;
  const gapTop = Math.random() * (maxGapTop - minGapTop) + minGapTop;
  return {
    x: canvasWidth,
    gapTop: gapTop,
    gapBottom: gapTop + gap,
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
 * Includes pipe cap rectangles in overlap checks.
 */
function checkCollision(playerRect, pipes, canvasHeight, isInvincible) {
  if (checkBoundaryCollision(playerRect.y, playerRect.height, canvasHeight)) {
    return true;
  }
  if (isInvincible) {
    return false;
  }
  for (const pipe of pipes) {
    // Pipe body rects
    const topPipeRect = { x: pipe.x, y: 0, width: pipe.width, height: pipe.gapTop };
    const bottomPipeRect = { x: pipe.x, y: pipe.gapBottom, width: pipe.width, height: canvasHeight - pipe.gapBottom };

    // Pipe cap rects (wider than body by CAP_OVERHANG on each side)
    const topCapRect = {
      x: pipe.x - CAP_OVERHANG,
      y: pipe.gapTop - CAP_HEIGHT,
      width: pipe.width + CAP_OVERHANG * 2,
      height: CAP_HEIGHT
    };
    const bottomCapRect = {
      x: pipe.x - CAP_OVERHANG,
      y: pipe.gapBottom,
      width: pipe.width + CAP_OVERHANG * 2,
      height: CAP_HEIGHT
    };

    if (rectsOverlap(playerRect, topPipeRect) || rectsOverlap(playerRect, bottomPipeRect) ||
        rectsOverlap(playerRect, topCapRect) || rectsOverlap(playerRect, bottomCapRect)) {
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

// === Difficulty Manager ===

/**
 * Returns base difficulty values (initial pipe speed and gap).
 * Used at game start and on reset.
 */
function getBaseDifficulty() {
  return { pipeSpeed: PIPE_SPEED, pipeGap: PIPE_GAP };
}

/**
 * Pure function: calculates current difficulty parameters based on score.
 * Every DIFFICULTY_STEP points, pipe speed increases and gap decreases.
 * Values are clamped to MAX_PIPE_SPEED and MIN_GAP respectively.
 */
function getDifficultyParams(score) {
  const steps = Math.floor(score / DIFFICULTY_STEP);
  const pipeSpeed = Math.min(PIPE_SPEED + steps * SPEED_INCREMENT, MAX_PIPE_SPEED);
  const pipeGap = Math.max(PIPE_GAP - steps * GAP_DECREMENT, MIN_GAP);
  return { pipeSpeed, pipeGap };
}

// === Screen Shake Controller ===

/**
 * Activates screen shake by returning a new shake state with the timer set
 * to the full duration. The offsets start at zero and are computed each frame.
 */
function activateScreenShake() {
  return { active: true, timer: SHAKE_DURATION, offsetX: 0, offsetY: 0 };
}

/**
 * Updates the screen shake state by decrementing the timer.
 * When the timer expires, deactivates the shake and zeroes offsets.
 * Returns a new shake state object (pure function).
 */
function updateScreenShake(shakeState, dt) {
  if (!shakeState.active) {
    return shakeState;
  }
  const newTimer = shakeState.timer - dt;
  if (newTimer <= 0) {
    return { active: false, timer: 0, offsetX: 0, offsetY: 0 };
  }
  return { ...shakeState, timer: newTimer };
}

/**
 * Computes the current shake offset based on shake state.
 * Returns random offsets within [-SHAKE_INTENSITY, +SHAKE_INTENSITY] when active,
 * or (0, 0) when inactive.
 */
function getShakeOffset(shakeState) {
  if (!shakeState.active) {
    return { offsetX: 0, offsetY: 0 };
  }
  const offsetX = (Math.random() * 2 - 1) * SHAKE_INTENSITY;
  const offsetY = (Math.random() * 2 - 1) * SHAKE_INTENSITY;
  return { offsetX, offsetY };
}

// === Grace Period Controller ===

/**
 * Activates the grace period, returning a new grace state
 * with the timer set to GRACE_DURATION.
 */
function activateGracePeriod() {
  return { active: true, timer: GRACE_DURATION };
}

/**
 * Updates the grace period timer by decrementing it by dt.
 * Deactivates the grace period when the timer reaches zero.
 * Returns the grace state unchanged if not active.
 */
function updateGracePeriod(graceState, dt) {
  if (!graceState.active) {
    return graceState;
  }
  const newTimer = graceState.timer - dt;
  if (newTimer <= 0) {
    return { active: false, timer: 0 };
  }
  return { ...graceState, timer: newTimer };
}

/**
 * Returns whether the grace period is currently active.
 */
function isGracePeriodActive(graceState) {
  return graceState.active;
}

/**
 * Returns the opacity for the player sprite during grace period.
 * Alternates between 1.0 and 0.5 based on GRACE_FLASH_RATE.
 * Returns 1.0 if grace period is not active.
 */
function getGraceOpacity(graceState) {
  if (!graceState.active) {
    return 1.0;
  }
  const cyclePosition = Math.floor(graceState.timer / GRACE_FLASH_RATE);
  return cyclePosition % 2 === 0 ? 0.5 : 1.0;
}

// === Rotation Renderer ===

/**
 * Calculates the rotation angle for the player sprite based on vertical velocity.
 * Negative velocity (upward) maps to negative angle (nose up, max -30 degrees).
 * Positive velocity (downward) maps to positive angle (nose down, max +60 degrees).
 * Zero velocity returns 0 degrees.
 * The angle is clamped to [-30, +60] degrees.
 */
function calculateRotation(velocity) {
  if (velocity === 0) return 0;
  let angle;
  if (velocity < 0) {
    // Map upward velocity to [-30, 0] degrees
    // FLAP_IMPULSE is the max upward speed (negative value)
    angle = (velocity / FLAP_IMPULSE) * -30;
  } else {
    // Map downward velocity to [0, +60] degrees
    // TERMINAL_VELOCITY is the max downward speed
    angle = (velocity / TERMINAL_VELOCITY) * 60;
  }
  return Math.min(Math.max(angle, -30), 60);
}

/**
 * Renders a sprite (or rectangle fallback) rotated around its center.
 * Uses ctx.save/translate/rotate/restore for clean transform isolation.
 * angleDeg is in degrees; converted to radians internally.
 */
function renderRotatedSprite(ctx, image, x, y, width, height, angleDeg) {
  const angleRad = angleDeg * (Math.PI / 180);
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angleRad);
  if (image) {
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillRect(-width / 2, -height / 2, width, height);
  }
  ctx.restore();
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

// === Particle System ===

// Particle Constants
const PARTICLE_MIN_RADIUS = 2;
const PARTICLE_MAX_RADIUS = 4;
const PARTICLE_MIN_LIFE = 400;    // milliseconds
const PARTICLE_MAX_LIFE = 600;    // milliseconds
const PARTICLE_COLOR = '#a020f0'; // purple matching Data Packet aesthetic
const PARTICLE_SPEED = 80;        // base speed in px/s

/**
 * Spawns particles at the given position with random outward velocities.
 * Returns an array of particle objects.
 * Each particle has a random direction, speed, radius, and lifespan.
 */
function spawnParticles(x, y, count, config) {
  const color = (config && config.color) || PARTICLE_COLOR;
  const minLife = (config && config.minLife) || PARTICLE_MIN_LIFE;
  const maxLife = (config && config.maxLife) || PARTICLE_MAX_LIFE;
  const minRadius = (config && config.minRadius) || PARTICLE_MIN_RADIUS;
  const maxRadius = (config && config.maxRadius) || PARTICLE_MAX_RADIUS;
  const speed = (config && config.speed) || PARTICLE_SPEED;

  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = speed * (0.5 + Math.random() * 0.5);
    const maxLife_i = minLife + Math.random() * (maxLife - minLife);
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      radius: minRadius + Math.random() * (maxRadius - minRadius),
      color: color,
      alpha: 1.0,
      life: maxLife_i,
      maxLife: maxLife_i
    });
  }
  return particles;
}

/**
 * Updates all particles by advancing position, decaying alpha linearly,
 * and removing expired particles. Uses delta time for frame-rate independence.
 * Returns a new array containing only surviving particles.
 */
function updateParticles(particles, dt) {
  const dtSec = dt / 1000;
  const result = [];
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const newLife = p.life - dt;
    if (newLife <= 0) continue;
    result.push({
      x: p.x + p.vx * dtSec,
      y: p.y + p.vy * dtSec,
      vx: p.vx,
      vy: p.vy,
      radius: p.radius,
      color: p.color,
      alpha: Math.max(0, newLife / p.maxLife),
      life: newLife,
      maxLife: p.maxLife
    });
  }
  return result;
}

/**
 * Renders all active particles as filled circles with their current alpha.
 * Does NOT mutate state. Uses ctx.save()/ctx.restore() for alpha changes.
 */
function renderParticles(ctx, particles) {
  if (particles.length === 0) return;
  ctx.save();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// === Parallax Background ===

/**
 * Initializes two parallax layers: a back layer of small stars/dots and
 * a front layer of subtle vertical grid lines.
 * Returns the layers data structure used by update and render.
 */
function initParallaxLayers(canvasWidth, canvasHeight) {
  // Back layer: random stars/dots spread across a tile of canvasWidth
  const starCount = 60;
  const backElements = [];
  for (let i = 0; i < starCount; i++) {
    backElements.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      size: 1 + Math.random() * 2 // 1-3px radius
    });
  }

  // Front layer: vertical grid lines spaced every 80px across a tile of canvasWidth
  const gridSpacing = 80;
  const frontElements = [];
  for (let x = 0; x < canvasWidth; x += gridSpacing) {
    frontElements.push({ x: x });
  }

  return {
    back: {
      offset: 0,
      speedRatio: 0.2,
      elements: backElements,
      tileWidth: canvasWidth
    },
    front: {
      offset: 0,
      speedRatio: 0.5,
      elements: frontElements,
      tileWidth: canvasWidth
    }
  };
}

/**
 * Updates parallax layer offsets based on current pipe speed and delta time.
 * Back layer scrolls at 20% of pipe speed, front layer at 50%.
 * Offsets wrap around at tileWidth for seamless looping.
 * Returns a new layers object (pure update).
 */
function updateParallaxLayers(layers, pipeSpeed, dt) {
  const backAdvance = pipeSpeed * layers.back.speedRatio * dt;
  const frontAdvance = pipeSpeed * layers.front.speedRatio * dt;

  const newBackOffset = (layers.back.offset + backAdvance) % layers.back.tileWidth;
  const newFrontOffset = (layers.front.offset + frontAdvance) % layers.front.tileWidth;

  return {
    back: { ...layers.back, offset: newBackOffset },
    front: { ...layers.front, offset: newFrontOffset }
  };
}

/**
 * Renders both parallax layers onto the canvas.
 * Draws the dark base color, then stars (back layer) and grid lines (front layer),
 * each drawn twice for seamless horizontal wrapping.
 * This function does NOT mutate state.
 */
function renderParallaxLayers(ctx, layers, canvasWidth, canvasHeight) {
  // Dark base background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Back layer: stars/dots
  ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
  const backOffset = layers.back.offset;
  const backTile = layers.back.tileWidth;
  for (const star of layers.back.elements) {
    // Draw the star at its position shifted by the offset (scrolling left)
    let sx = star.x - backOffset;
    // Wrap into visible range
    if (sx < 0) sx += backTile;
    // Draw primary position
    ctx.beginPath();
    ctx.arc(sx, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    // Draw wrapped copy for seamless looping
    if (sx + backTile < canvasWidth + star.size) {
      ctx.beginPath();
      ctx.arc(sx + backTile, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Front layer: subtle vertical grid lines
  ctx.strokeStyle = 'rgba(100, 100, 180, 0.2)';
  ctx.lineWidth = 1;
  const frontOffset = layers.front.offset;
  const frontTile = layers.front.tileWidth;
  for (const line of layers.front.elements) {
    let lx = line.x - frontOffset;
    if (lx < 0) lx += frontTile;
    // Draw primary line
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, canvasHeight);
    ctx.stroke();
    // Draw wrapped copy for seamless looping
    if (lx + frontTile < canvasWidth + 1) {
      ctx.beginPath();
      ctx.moveTo(lx + frontTile, 0);
      ctx.lineTo(lx + frontTile, canvasHeight);
      ctx.stroke();
    }
  }
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

// === Procedural Audio Engine ===

/**
 * Creates a procedural audio engine using the Web Audio API.
 * Generates all sound effects via oscillator frequency sweeps and gain envelopes.
 * The AudioContext is created lazily on first user interaction to comply with
 * browser autoplay policies. All operations are wrapped in try/catch.
 *
 * Returns an object with: playFlap(), playCrash(), playScorePing(),
 * playSteeringWhoosh(), startBackgroundHum(), stopBackgroundHum()
 */
function createProceduralAudioEngine() {
  let audioCtx = null;
  let backgroundHumOsc = null;
  let backgroundHumGain = null;
  let backgroundHumLfo = null;
  let backgroundHumLfoGain = null;

  /**
   * Ensures the AudioContext exists and is running.
   * Creates it lazily on first call; resumes if suspended.
   */
  function ensureContext() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      // Silently handle browsers that don't support Web Audio
    }
    return audioCtx;
  }

  /**
   * Flap sound: sine wave, 300→500Hz sweep, 80ms, gain envelope.
   */
  function playFlap() {
    try {
      const ctx = ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(500, now + 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  /**
   * Crash sound: sawtooth wave, 400→100Hz sweep, 300ms, sharp attack/longer decay.
   */
  function playCrash() {
    try {
      const ctx = ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  /**
   * Score ping: sine wave, 800Hz, 60ms, quick attack/decay.
   */
  function playScorePing() {
    try {
      const ctx = ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gain.gain.linearRampToValueAtTime(0, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  /**
   * Steering whoosh: sawtooth wave, 200→1200Hz sweep, 200ms, rapid gain fade-out.
   */
  function playSteeringWhoosh() {
    try {
      const ctx = ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  /**
   * Background hum: sine wave, 60Hz, gain pulsing 5-10%, continuous during PLAYING.
   * Uses an LFO (low-frequency oscillator) to modulate gain between 0.05 and 0.1.
   */
  function startBackgroundHum() {
    try {
      const ctx = ensureContext();
      if (!ctx) return;
      if (backgroundHumOsc) return; // already running

      const now = ctx.currentTime;

      // Main oscillator: 60Hz sine
      backgroundHumOsc = ctx.createOscillator();
      backgroundHumOsc.type = 'sine';
      backgroundHumOsc.frequency.setValueAtTime(60, now);

      // Gain node: base gain of 0.075 (midpoint of 0.05-0.1)
      backgroundHumGain = ctx.createGain();
      backgroundHumGain.gain.setValueAtTime(0.075, now);

      // LFO to pulse gain between 0.05 and 0.1
      // LFO oscillates ±0.025 around 0.075 at ~2Hz
      backgroundHumLfo = ctx.createOscillator();
      backgroundHumLfo.type = 'sine';
      backgroundHumLfo.frequency.setValueAtTime(2, now);

      backgroundHumLfoGain = ctx.createGain();
      backgroundHumLfoGain.gain.setValueAtTime(0.025, now);

      // Connect LFO → LFO gain → main gain parameter
      backgroundHumLfo.connect(backgroundHumLfoGain);
      backgroundHumLfoGain.connect(backgroundHumGain.gain);

      // Connect main oscillator → gain → destination
      backgroundHumOsc.connect(backgroundHumGain);
      backgroundHumGain.connect(ctx.destination);

      backgroundHumOsc.start(now);
      backgroundHumLfo.start(now);
    } catch (e) {}
  }

  /**
   * Stops the background hum by stopping oscillators and cleaning up references.
   */
  function stopBackgroundHum() {
    try {
      if (backgroundHumOsc) {
        backgroundHumOsc.stop();
        backgroundHumOsc.disconnect();
        backgroundHumOsc = null;
      }
      if (backgroundHumLfo) {
        backgroundHumLfo.stop();
        backgroundHumLfo.disconnect();
        backgroundHumLfo = null;
      }
      if (backgroundHumLfoGain) {
        backgroundHumLfoGain.disconnect();
        backgroundHumLfoGain = null;
      }
      if (backgroundHumGain) {
        backgroundHumGain.disconnect();
        backgroundHumGain = null;
      }
    } catch (e) {}
  }

  return {
    playFlap,
    playCrash,
    playScorePing,
    playSteeringWhoosh,
    startBackgroundHum,
    stopBackgroundHum
  };
}

// === Death Recap Constants ===

const RECAP_COUNTDOWN = 3;  // seconds before restart enabled

// === Death Recap Controller ===

/**
 * Shows the death recap overlay with score info and starts the countdown.
 * Populates DOM elements with score data and sets deathRecap state.
 * The countdown starts at RECAP_COUNTDOWN seconds and blocks input until it reaches 0.
 */
function showDeathRecap(score, highScore, isNewHighScore) {
  const overlay = document.getElementById('death-recap-overlay');
  const scoreEl = document.getElementById('death-recap-score');
  const highScoreEl = document.getElementById('death-recap-highscore');
  const newHighEl = document.getElementById('death-recap-new-high');
  const countdownEl = document.getElementById('death-recap-countdown');
  const restartEl = document.getElementById('death-recap-restart');

  if (scoreEl) scoreEl.textContent = `Score: ${score}`;
  if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
  if (newHighEl) newHighEl.style.display = isNewHighScore ? 'block' : 'none';
  if (countdownEl) {
    countdownEl.textContent = `Restarting in ${RECAP_COUNTDOWN}...`;
    countdownEl.style.display = 'block';
  }
  if (restartEl) restartEl.style.display = 'none';
  // Don't show overlay directly — fadeIn() handles display and opacity transition
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.display = 'none';
  }

  gameContext.deathRecap.active = true;
  gameContext.deathRecap.countdown = RECAP_COUNTDOWN * 1000; // store in ms
  gameContext.deathRecap.inputEnabled = false;
}

/**
 * Updates the death recap countdown timer each frame.
 * Decrements countdown by deltaMs. Updates the display each second.
 * When countdown reaches zero, enables input and shows restart prompt.
 */
function updateDeathRecap(deltaMs) {
  if (!gameContext.deathRecap.active || gameContext.deathRecap.inputEnabled) return;

  gameContext.deathRecap.countdown -= deltaMs;

  if (gameContext.deathRecap.countdown <= 0) {
    gameContext.deathRecap.countdown = 0;
    gameContext.deathRecap.inputEnabled = true;

    const countdownEl = document.getElementById('death-recap-countdown');
    const restartEl = document.getElementById('death-recap-restart');
    if (countdownEl) countdownEl.style.display = 'none';
    if (restartEl) restartEl.style.display = 'block';
  } else {
    const secondsLeft = Math.ceil(gameContext.deathRecap.countdown / 1000);
    const countdownEl = document.getElementById('death-recap-countdown');
    if (countdownEl) countdownEl.textContent = `Restarting in ${secondsLeft}...`;
  }
}

/**
 * Hides the death recap overlay and resets the deathRecap state.
 * Called when restarting the game from GAME_OVER.
 * Note: The overlay's display/opacity is managed by fadeOut() for smooth transitions.
 */
function hideDeathRecap() {
  gameContext.deathRecap.active = false;
  gameContext.deathRecap.countdown = 0;
  gameContext.deathRecap.inputEnabled = true;
}

// === Fade Transition Controller ===

// Fade Duration Constant
const FADE_DURATION = 400; // milliseconds

/**
 * Fades out an element by setting its opacity to 0.
 * After the specified duration, hides the element with display: none.
 * Relies on CSS `transition: opacity 400ms ease` already on the element.
 */
function fadeOut(element, durationMs) {
  if (!element) return;
  element.style.opacity = '0';
  setTimeout(() => {
    element.style.display = 'none';
  }, durationMs);
}

/**
 * Fades in an element by showing it and setting its opacity to 1.
 * Sets display to flex first (with opacity 0), then transitions to opacity 1.
 * Relies on CSS `transition: opacity 400ms ease` already on the element.
 */
function fadeIn(element, durationMs) {
  if (!element) return;
  element.style.opacity = '0';
  element.style.display = 'flex';
  // Force reflow so the browser registers the opacity:0 before transitioning to 1
  void element.offsetWidth;
  element.style.opacity = '1';
}

/**
 * Sets the transition lock on the game context.
 * When locked, input is blocked to prevent actions during fade transitions.
 */
function setTransitionLock(locked) {
  gameContext.transitionLock = locked;
}

// === Touch Input Handler ===

/**
 * Sets up touch event handlers on the canvas for mobile support.
 * Registers touchstart listener with { passive: false } to allow preventDefault,
 * suppressing scroll/zoom on touch. Routes touch events to the same onInput
 * handler used by Space/Click.
 */
function setupTouchHandlers(canvas, onInput) {
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onInput();
  }, { passive: false });
}

// === Pause Controller ===

/**
 * Toggles the game between PLAYING and PAUSED states.
 * Uses transitionState with the ESCAPE event to handle the transition.
 * Shows/hides the #pause-overlay DOM element accordingly.
 */
function togglePause(gameContext) {
  const newState = transitionState(gameContext.state, 'ESCAPE');
  if (newState === gameContext.state) return gameContext;

  gameContext.state = newState;
  gameContext.paused = (newState === GameState.PAUSED);

  const pauseOverlay = document.getElementById('pause-overlay');
  if (pauseOverlay) {
    pauseOverlay.style.display = gameContext.paused ? 'flex' : 'none';
  }

  return gameContext;
}

// === Input Handler ===

/**
 * Sets up all input handlers for the game.
 * Listens for Spacebar and mouse click to trigger flap/state transitions (onInput).
 * Listens for Shift key and on-screen activation button for Steering Mode (onActivateSteering).
 * Listens for Escape key to toggle pause.
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
    if (e.code === 'Escape') {
      e.preventDefault();
      togglePause(gameContext);
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

// === Pipe Cap Renderer ===

/**
 * Renders a single pipe pair with cap rectangles at the pipe openings.
 * The cap is wider than the pipe body by CAP_OVERHANG on each side
 * and CAP_HEIGHT pixels tall, drawn at the opening end of each pipe.
 * Uses the same green color (#00d400) as the pipe body.
 */
function renderPipeWithCaps(ctx, pipe, canvasHeight) {
  ctx.fillStyle = '#00d400';

  // Top pipe body
  ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapTop);
  // Top pipe cap (at bottom of top pipe)
  ctx.fillRect(
    pipe.x - CAP_OVERHANG,
    pipe.gapTop - CAP_HEIGHT,
    pipe.width + CAP_OVERHANG * 2,
    CAP_HEIGHT
  );

  // Bottom pipe body
  ctx.fillRect(pipe.x, pipe.gapBottom, pipe.width, canvasHeight - pipe.gapBottom);
  // Bottom pipe cap (at top of bottom pipe)
  ctx.fillRect(
    pipe.x - CAP_OVERHANG,
    pipe.gapBottom,
    pipe.width + CAP_OVERHANG * 2,
    CAP_HEIGHT
  );
}

// === Score Popup ===

/**
 * Creates a DOM-based "+1" score popup element positioned near the player.
 * The popup floats upward and fades out over 800ms via CSS animation.
 * Removes itself from the DOM when the animation completes.
 */
function createScorePopup(playerX, playerY) {
  const container = document.getElementById('score-popup-container');
  if (!container) return;
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = '+1';
  popup.style.left = `${playerX + 20}px`;
  popup.style.top = `${playerY - 10}px`;
  container.appendChild(popup);
  popup.addEventListener('animationend', () => {
    popup.remove();
  });
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
  const { state, player, pipes, score, highScore, steeringModeActive, dataPackets, screenShake } = gameContext;

  // Apply screen shake offset via temporary transform
  const shakeOffset = getShakeOffset(screenShake);
  const shakeActive = shakeOffset.offsetX !== 0 || shakeOffset.offsetY !== 0;
  if (shakeActive) {
    ctx.save();
    ctx.translate(shakeOffset.offsetX, shakeOffset.offsetY);
  }

  // Background
  if (steeringModeActive) {
    renderNeonMatrixGrid(ctx, canvasWidth, canvasHeight);
  } else {
    renderParallaxLayers(ctx, gameContext.parallaxLayers, canvasWidth, canvasHeight);
  }

  if (state === GameState.PLAYING || state === GameState.GAME_OVER || state === GameState.PAUSED) {
    // Pipes (green rectangles with caps)
    for (const pipe of pipes) {
      renderPipeWithCaps(ctx, pipe, canvasHeight);
    }

    // Data packets (glowing purple circles)
    for (const packet of dataPackets) {
      renderDataPacket(ctx, packet);
    }

    // Particles (collection burst effects)
    renderParticles(ctx, gameContext.particles);

    // Player sprite (with translucent purple overlay during Steering Mode)
    const graceOpacity = getGraceOpacity(gameContext.gracePeriod);
    const rotationAngle = calculateRotation(player.velocity);
    if (steeringModeActive) {
      ctx.save();
      ctx.globalAlpha = 0.6 * graceOpacity;
      if (spriteLoadFailed) {
        ctx.fillStyle = '#a020f0';
        renderRotatedSprite(ctx, null, player.x, player.y, SPRITE_WIDTH, SPRITE_HEIGHT, rotationAngle);
      } else {
        renderRotatedSprite(ctx, spriteImage, player.x, player.y, SPRITE_WIDTH, SPRITE_HEIGHT, rotationAngle);
      }
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'rgba(128, 0, 255, 0.3)';
      renderRotatedSprite(ctx, null, player.x, player.y, SPRITE_WIDTH, SPRITE_HEIGHT, rotationAngle);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = graceOpacity;
      if (spriteLoadFailed) {
        ctx.fillStyle = '#a020f0';
        renderRotatedSprite(ctx, null, player.x, player.y, SPRITE_WIDTH, SPRITE_HEIGHT, rotationAngle);
      } else {
        renderRotatedSprite(ctx, spriteImage, player.x, player.y, SPRITE_WIDTH, SPRITE_HEIGHT, rotationAngle);
      }
      ctx.restore();
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

  // Restore canvas transform if screen shake was applied
  if (shakeActive) {
    ctx.restore();
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
  gameContext.currentDifficulty = getBaseDifficulty();
  gameContext.gracePeriod = activateGracePeriod();
  gameContext.screenShake = { active: false, timer: 0, offsetX: 0, offsetY: 0 };
  gameContext.particles = [];
  gameContext.parallaxLayers = initParallaxLayers(CANVAS_WIDTH, CANVAS_HEIGHT);
  gameContext.deathRecap = { active: false, countdown: 0, inputEnabled: true };
  gameContext.transitionLock = false;
  updateChargeBar(0);
}

/**
 * Handles primary input (Space / Click).
 * START_SCREEN → reset and play; PLAYING → flap; GAME_OVER → restart.
 * Blocks restart during death recap countdown (inputEnabled = false).
 * Blocks all input when transitionLock is active (during fade transitions).
 */
function onInput() {
  // Block input during active transitions
  if (gameContext.transitionLock) return;

  if (gameContext.state === GameState.START_SCREEN) {
    // Fade out the start overlay when transitioning to PLAYING
    const startOverlay = document.getElementById('start-overlay');
    setTransitionLock(true);
    fadeOut(startOverlay, FADE_DURATION);
    setTimeout(() => {
      setTransitionLock(false);
    }, FADE_DURATION);

    resetGame();
    gameContext.state = transitionState(gameContext.state, 'INPUT');
    audioManager.startBackgroundHum();
  } else if (gameContext.state === GameState.PLAYING) {
    gameContext.player.velocity = applyFlap();
    audioManager.playFlap();
  } else if (gameContext.state === GameState.GAME_OVER) {
    if (!gameContext.deathRecap.inputEnabled) return;

    // Cross-fade: fade out death recap, fade in start overlay
    const deathRecapOverlay = document.getElementById('death-recap-overlay');
    const startOverlay = document.getElementById('start-overlay');

    setTransitionLock(true);
    fadeOut(deathRecapOverlay, FADE_DURATION);
    fadeIn(startOverlay, FADE_DURATION);
    setTimeout(() => {
      setTransitionLock(false);
    }, FADE_DURATION);

    hideDeathRecap();
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
    audioManager.playSteeringWhoosh();
    const btn = document.getElementById('steering-activate-btn');
    if (btn) btn.style.display = 'none';
  }
}

/**
 * Updates game state each frame. Only processes during PLAYING state.
 * Orchestrates physics, pipes, data packets, steering mode, collision, and scoring.
 * Screen shake updates during both PLAYING and GAME_OVER states.
 * When PAUSED, all physics, pipes, scoring, and timers are halted; only screen shake updates.
 */
function update(deltaMs) {
  // Update screen shake timer regardless of game state (it runs during GAME_OVER and PAUSED)
  if (gameContext.screenShake.active) {
    gameContext.screenShake = updateScreenShake(gameContext.screenShake, deltaMs);
  }

  // When paused, halt all game updates (physics, pipes, scoring, timers)
  // The game loop still calls render() so the frozen scene remains visible
  if (gameContext.state === GameState.PAUSED) return;

  // Update death recap countdown during GAME_OVER state
  if (gameContext.state === GameState.GAME_OVER) {
    updateDeathRecap(deltaMs);
    return;
  }

  if (gameContext.state !== GameState.PLAYING) return;

  // Update difficulty based on current score
  gameContext.currentDifficulty = getDifficultyParams(gameContext.score);

  // Player movement: normal gravity always applies, player retains manual control
  // During steering mode, invincibility is handled by collision detection
  gameContext.player = updatePlayerPosition(gameContext.player);

  // Update steering mode timer and depletion
  gameContext = updateSteeringMode(gameContext, deltaMs);

  // Update grace period timer
  gameContext.gracePeriod = updateGracePeriod(gameContext.gracePeriod, deltaMs);

  // Update parallax background layers
  gameContext.parallaxLayers = updateParallaxLayers(gameContext.parallaxLayers, gameContext.currentDifficulty.pipeSpeed, deltaMs);

  // Update particles
  gameContext.particles = updateParticles(gameContext.particles, deltaMs);

  // Move pipes using current difficulty speed
  const currentSpeed = gameContext.currentDifficulty.pipeSpeed;
  gameContext.pipes = gameContext.pipes.map(pipe => ({ ...pipe, x: pipe.x - currentSpeed }));

  // Spawn new pipes based on frame count
  gameContext.frameCount++;
  if (gameContext.frameCount >= PIPE_INTERVAL) {
    gameContext.frameCount = 0;
    const newPipe = generatePipe(CANVAS_WIDTH, CANVAS_HEIGHT, gameContext.currentDifficulty.pipeGap);
    gameContext.pipes.push(newPipe);

    // Spawn data packet with 70% chance per new pipe
    if (Math.random() < 0.7) {
      const packet = spawnDataPacket(newPipe);
      gameContext.dataPackets.push(packet);
    }
  }

  // Remove off-screen pipes
  gameContext.pipes = removeOffScreenPipes(gameContext.pipes);

  // Move and clean up data packets using current difficulty speed
  gameContext.dataPackets = gameContext.dataPackets.map(packet => ({ ...packet, x: packet.x - currentSpeed }));
  gameContext.dataPackets = removeOffScreenDataPackets(gameContext.dataPackets);

  // Collect data packets
  const playerRect = getPlayerRect(gameContext.player, SPRITE_WIDTH, SPRITE_HEIGHT);
  const { collected, remaining } = collectDataPackets(playerRect, gameContext.dataPackets);
  gameContext.dataPackets = remaining;

  if (collected.length > 0) {
    gameContext.steeringCharge = addSteeringCharge(gameContext.steeringCharge, collected.length);
    updateChargeBar(gameContext.steeringCharge);

    // Spawn particles at each collected packet's position
    for (const packet of collected) {
      const count = 8 + Math.floor(Math.random() * 5); // 8-12 particles
      const newParticles = spawnParticles(packet.x, packet.y, count);
      gameContext.particles = gameContext.particles.concat(newParticles);
    }
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
      audioManager.playScorePing();
      createScorePopup(gameContext.player.x, gameContext.player.y);
    }
  }

  // Collision detection
  const isInvincible = gameContext.steeringModeActive || isGracePeriodActive(gameContext.gracePeriod);
  const collision = checkCollision(playerRect, gameContext.pipes, CANVAS_HEIGHT, isInvincible);
  if (collision) {
    gameContext.state = transitionState(gameContext.state, 'COLLISION');
    gameContext.screenShake = activateScreenShake();
    audioManager.playCrash();
    audioManager.stopBackgroundHum();
    const previousHighScore = gameContext.highScore;
    gameContext.highScore = saveHighScore(gameContext.score, gameContext.highScore);
    const isNewHighScore = gameContext.score > 0 && gameContext.score > previousHighScore;
    showDeathRecap(gameContext.score, gameContext.highScore, isNewHighScore);

    // Fade in the death recap overlay (400ms)
    const deathRecapOverlay = document.getElementById('death-recap-overlay');
    fadeIn(deathRecapOverlay, FADE_DURATION);
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

  // Create procedural audio engine
  audioManager = createProceduralAudioEngine();

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
    steeringModeTimer: 0,
    paused: false,
    gracePeriod: { active: false, timer: 0 },
    screenShake: { active: false, timer: 0, offsetX: 0, offsetY: 0 },
    particles: [],
    parallaxLayers: initParallaxLayers(CANVAS_WIDTH, CANVAS_HEIGHT),
    deathRecap: { active: false, countdown: 0, inputEnabled: true },
    transitionLock: false,
    currentDifficulty: { pipeSpeed: PIPE_SPEED, pipeGap: PIPE_GAP }
  };

  // Update charge bar to initial state
  updateChargeBar(0);

  // Setup input handlers
  setupInputHandlers(canvas, onInput, onActivateSteering);
  setupTouchHandlers(canvas, onInput);

  // Start game loop
  requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', initGame);
