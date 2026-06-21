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

// === Responsive Canvas Constants ===

const BASE_WIDTH = 400;
const BASE_HEIGHT = 600;
const ASPECT_RATIO = 2 / 3;
const MIN_CANVAS_WIDTH = 280;
const MAX_CANVAS_WIDTH = 600;
const PADDING_HORIZONTAL = 16;
const PADDING_VERTICAL = 16;
const RESIZE_DEBOUNCE_MS = 100;

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

// === Background Grid Constants ===

const GRID_SPACING = 40;          // pixels between grid lines
const GRID_SCROLL_SPEED = 0.5;    // pixels per frame

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

/**
 * Calculates the next chord duration (ms).
 * Returns a value between MUSIC_CHORD_DURATION_MIN and MUSIC_CHORD_DURATION_MAX.
 */
function getNextChordDuration() {
  return MUSIC_CHORD_DURATION_MIN + Math.random() * (MUSIC_CHORD_DURATION_MAX - MUSIC_CHORD_DURATION_MIN);
}

/**
 * Cycles to the next chord: applies release envelope to current oscillators,
 * stops them after release, advances chord index, then starts the next chord.
 */
function cycleChord(engine) {
  if (!engine.isPlaying || !engine.ctx) return;

  const now = engine.ctx.currentTime;

  // Apply release envelope to existing oscillators
  for (const oscInfo of engine.oscillators) {
    oscInfo.gainNode.gain.cancelScheduledValues(now);
    oscInfo.gainNode.gain.setValueAtTime(oscInfo.gainNode.gain.value, now);
    oscInfo.gainNode.gain.linearRampToValueAtTime(0, now + MUSIC_RELEASE_MS / 1000);
    oscInfo.oscillator.stop(now + MUSIC_RELEASE_MS / 1000 + 0.05);
  }

  // Advance chord index
  engine.currentChordIndex = (engine.currentChordIndex + 1) % CHORD_VOICINGS.length;

  // After release completes, start the new chord
  engine.chordTimer = setTimeout(() => {
    if (!engine.isPlaying) return;
    engine.oscillators = [];
    playChord(engine);
  }, MUSIC_RELEASE_MS);
}

/**
 * Creates oscillators for the current chord, connects them through gain nodes,
 * applies attack envelope, and schedules the next chord cycle.
 */
function playChord(engine) {
  if (!engine.ctx || !engine.isPlaying) return;

  const chordFrequencies = CHORD_VOICINGS[engine.currentChordIndex];
  const voices = generateChordVoices(chordFrequencies);
  const now = engine.ctx.currentTime;
  const perVoiceGain = MUSIC_MASTER_GAIN / voices.length;

  for (const voice of voices) {
    const osc = engine.ctx.createOscillator();
    osc.type = voice.waveType;
    osc.frequency.setValueAtTime(voice.frequency, now);
    osc.detune.setValueAtTime(voice.detune, now);

    const gainNode = engine.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    // Attack envelope: ramp from 0 to per-voice level over MUSIC_ATTACK_MS
    gainNode.gain.linearRampToValueAtTime(perVoiceGain, now + MUSIC_ATTACK_MS / 1000);

    osc.connect(gainNode);
    gainNode.connect(engine.masterGain);
    osc.start(now);

    engine.oscillators.push({ oscillator: osc, gainNode: gainNode });
  }

  // Ramp master gain to MUSIC_MASTER_GAIN
  engine.masterGain.gain.cancelScheduledValues(now);
  engine.masterGain.gain.setValueAtTime(engine.masterGain.gain.value, now);
  engine.masterGain.gain.linearRampToValueAtTime(MUSIC_MASTER_GAIN, now + MUSIC_ATTACK_MS / 1000);

  // Schedule next chord
  const duration = getNextChordDuration();
  engine.chordTimer = setTimeout(() => {
    cycleChord(engine);
  }, duration);
}

/**
 * Starts the music engine: creates oscillators from chord voices,
 * connects through gain nodes, and schedules chord cycling.
 * Must be called after initMusicContext.
 */
function startMusic(engine) {
  if (!engine.ctx || engine.isPlaying) return;
  engine.isPlaying = true;
  engine.oscillators = [];
  playChord(engine);
}

/**
 * Pauses the music by ramping master gain to 0 over 300ms.
 * Oscillators keep running so resume can bring them back instantly.
 */
function pauseMusic(engine) {
  if (!engine.ctx || !engine.isPlaying) return;
  const now = engine.ctx.currentTime;
  engine.masterGain.gain.cancelScheduledValues(now);
  engine.masterGain.gain.setValueAtTime(engine.masterGain.gain.value, now);
  engine.masterGain.gain.linearRampToValueAtTime(0, now + MUSIC_PAUSE_FADE_MS / 1000);
}

/**
 * Resumes the music by ramping master gain back to MUSIC_MASTER_GAIN over 300ms.
 */
function resumeMusic(engine) {
  if (!engine.ctx || !engine.isPlaying) return;
  const now = engine.ctx.currentTime;
  engine.masterGain.gain.cancelScheduledValues(now);
  engine.masterGain.gain.setValueAtTime(engine.masterGain.gain.value, now);
  engine.masterGain.gain.linearRampToValueAtTime(MUSIC_MASTER_GAIN, now + MUSIC_PAUSE_FADE_MS / 1000);
}

/**
 * Stops the music: fades gain to 0 over 500ms, then stops all oscillators.
 * Clears chord cycling timer.
 */
function stopMusic(engine) {
  if (!engine.ctx) return;
  engine.isPlaying = false;
  if (engine.chordTimer) { clearTimeout(engine.chordTimer); engine.chordTimer = null; }
  const now = engine.ctx.currentTime;
  engine.masterGain.gain.cancelScheduledValues(now);
  engine.masterGain.gain.setValueAtTime(engine.masterGain.gain.value, now);
  engine.masterGain.gain.linearRampToValueAtTime(0, now + MUSIC_GAMEOVER_FADE_MS / 1000);
  setTimeout(() => {
    for (const oscInfo of engine.oscillators) {
      try { oscInfo.oscillator.stop(); } catch (e) {}
    }
    engine.oscillators = [];
  }, MUSIC_GAMEOVER_FADE_MS + 50);
}

// === Reduced Motion Preference ===

let reducedMotionEnabled = false;

/**
 * Checks the prefers-reduced-motion media query and returns the result.
 * Also sets up a listener for changes so the preference updates dynamically.
 */
function checkReducedMotion() {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotionEnabled = mql.matches;
  mql.addEventListener('change', (e) => {
    reducedMotionEnabled = e.matches;
  });
  return reducedMotionEnabled;
}

// === Background Grid Functions ===

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

// === Shield Power-Up Constants ===

const SHIELD_RADIUS = 14;
const SHIELD_SPAWN_CHANCE = 0.10;
const SHIELD_DURATION = 5000;       // milliseconds

// === Data Packet Constants ===

const DATA_PACKET_RADIUS = 12;

// === Pipe Cap Constants ===

const CAP_OVERHANG = 6;                 // extra pixels on each side of pipe cap
const CAP_HEIGHT = 20;                  // height of pipe cap rectangle

// === Screen Shake Constants ===

const SHAKE_DURATION = 300;             // milliseconds
const SHAKE_INTENSITY = 5;              // max pixel offset in any direction

// === Phase Mode Constants ===

const CHARGE_PER_PACKET = 25;           // percentage per Data Packet
const MAX_CHARGE = 100;                 // percentage cap
const STEERING_MODE_DURATION = 5000;    // milliseconds



// === Magnet Power-Up Constants ===

const MAGNET_RADIUS = 14;
const MAGNET_SPAWN_CHANCE = 0.08;
const MAGNET_DURATION = 6000;            // ms
const MAGNET_ATTRACT_RADIUS = 150;       // px
const MAGNET_ATTRACT_SPEED = 3;          // px/frame at 60fps, scaled by dt

// === Trail Effect Constants ===

const TRAIL_BUFFER_SIZE = 12;
const TRAIL_SAMPLE_INTERVAL = 2;   // frames between samples
const TRAIL_COLOR = '#b366ff';

// === Grace Period Constants ===

const GRACE_DURATION = 1500;     // milliseconds of invincibility at game start
const GRACE_FLASH_RATE = 150;    // milliseconds per flash cycle

// === Day/Night Cycle Constants ===

const DAY_NIGHT_PERIOD = 60000;          // ms for full cycle (60 seconds)
const NIGHT_COLOR = '#0a0a2e';           // dark blue (night sky)
const DAY_COLOR = '#4a90d9';             // sky blue (daytime)
const STAR_OPACITY_MIN = 0.2;
const STAR_OPACITY_MAX = 0.8;

// === Themed Worlds Constants ===

const THEME_INTERVAL = 50;               // score interval for theme change
const THEME_TRANSITION_DURATION = 300;   // ms fade
const WORLD_THEMES = [
  { pipe: '#00d400', accent: '#2d5a27', particle: '#00ff88' },   // Forest
  { pipe: '#0088ff', accent: '#1a3a5e', particle: '#00ccff' },   // Ocean
  { pipe: '#ff4400', accent: '#5e1a1a', particle: '#ff8800' },   // Volcano
  { pipe: '#b366ff', accent: '#2e1065', particle: '#e879f9' }    // Space
];

// === Pipe Color Gradient Constants ===

const PIPE_COLOR_START = { r: 0, g: 212, b: 0 };     // #00d400 green
const PIPE_COLOR_END = { r: 212, g: 0, b: 0 };       // #d40000 red

// === Death Animation Constants ===

const DEATH_ANIM_DURATION = 800;         // ms total animation time
const DEATH_SPIN_RATE = 360;             // degrees per second (clockwise)
const DEATH_RECAP_FADE_IN = 400;         // ms for death recap overlay fade-in
const DEATH_RED_TINT_DURATION = 200;     // ms red tint flash before spin-and-fall

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
 * Mutates the player object in-place (zero allocation).
 */
function updatePlayerPosition(player) {
  const newVelocity = applyGravity(player.velocity);
  player.velocity = newVelocity;
  player.y = player.y + newVelocity;
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
 * Mutates the pipe object in-place (zero allocation).
 */
function movePipe(pipe) {
  pipe.x -= PIPE_SPEED;
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

// === Pipe Color Gradient System ===

/**
 * Calculates the pipe color interpolation factor based on current speed.
 * Returns 0 at base speed (green), 1 at max speed (red), clamped to [0, 1].
 */
function calculatePipeColorFactor(currentSpeed, baseSpeed, maxSpeed) {
  if (maxSpeed === baseSpeed) return 0;
  return Math.max(0, Math.min(1, (currentSpeed - baseSpeed) / (maxSpeed - baseSpeed)));
}

/**
 * Interpolates between PIPE_COLOR_START and PIPE_COLOR_END using per-channel
 * linear RGB interpolation. Returns a hex color string like '#rrggbb'.
 */
function interpolatePipeColor(factor) {
  const r = Math.round(PIPE_COLOR_START.r + factor * (PIPE_COLOR_END.r - PIPE_COLOR_START.r));
  const g = Math.round(PIPE_COLOR_START.g + factor * (PIPE_COLOR_END.g - PIPE_COLOR_START.g));
  const b = Math.round(PIPE_COLOR_START.b + factor * (PIPE_COLOR_END.b - PIPE_COLOR_START.b));
  return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
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
 * Mutates the packet object in-place (zero allocation).
 */
function moveDataPacket(packet) {
  packet.x -= PIPE_SPEED;
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

// === Shield Pickup System ===

/**
 * Spawns a shield pickup within a pipe's gap with SHIELD_SPAWN_CHANCE probability.
 * The center is constrained so the full circle (radius 14px) stays within the gap.
 * Returns a shield pickup object or null if the random check fails.
 */
function spawnShieldPickup(pipe) {
  if (Math.random() >= SHIELD_SPAWN_CHANCE) {
    return null;
  }
  const minY = pipe.gapTop + SHIELD_RADIUS;
  const maxY = pipe.gapBottom - SHIELD_RADIUS;
  if (minY > maxY) {
    return null; // gap too small for pickup
  }
  const y = Math.random() * (maxY - minY) + minY;
  return {
    x: pipe.x + pipe.width / 2,
    y: y,
    radius: SHIELD_RADIUS,
    active: true
  };
}

/**
 * Moves a shield pickup leftward at the given speed scaled by delta time.
 * Mutates the pickup object in-place (zero allocation).
 */
function moveShieldPickup(pickup, speed, dt) {
  pickup.x -= speed;
}

/**
 * Checks whether a shield pickup has moved entirely off the left edge.
 * A pickup is off-screen when its rightmost point (x + radius) is at or below 0.
 */
function isShieldOffScreen(pickup) {
  return pickup.x + pickup.radius <= 0;
}

/**
 * Circle-rect collision detection between a player rectangle and a shield pickup.
 * Finds the closest point on the rectangle to the circle center,
 * then checks if the distance is within the circle's radius.
 */
function checkShieldPickupCollision(playerRect, pickup) {
  const closestX = Math.max(playerRect.x, Math.min(pickup.x, playerRect.x + playerRect.width));
  const closestY = Math.max(playerRect.y, Math.min(pickup.y, playerRect.y + playerRect.height));
  const distX = pickup.x - closestX;
  const distY = pickup.y - closestY;
  return (distX * distX + distY * distY) <= (pickup.radius * pickup.radius);
}

/**
 * Activates the shield effect on the game context, setting the timer to SHIELD_DURATION.
 * If shield is already active, resets the timer to 5 seconds (re-collection).
 * Returns the updated game context.
 */
function activateShield(gameContext) {
  gameContext.shieldActive = true;
  gameContext.shieldTimer = SHIELD_DURATION;
  return gameContext;
}

/**
 * Attempts to absorb a pipe collision using the active shield.
 * If shield is active, deactivates it and returns true (collision absorbed).
 * If shield is not active, returns false (collision not absorbed).
 */
function absorbCollision(gameContext) {
  if (gameContext.shieldActive) {
    gameContext.shieldActive = false;
    gameContext.shieldTimer = 0;
    return true;
  }
  return false;
}

// === Magnet Pickup System ===

/**
 * Spawns a magnet pickup within a pipe's gap with MAGNET_SPAWN_CHANCE (8%) probability.
 * The center is constrained so the full circle (radius 14px) stays within the gap.
 * Returns a magnet pickup object or null if the random check fails.
 */
function spawnMagnetPickup(pipe) {
  if (Math.random() >= MAGNET_SPAWN_CHANCE) {
    return null;
  }
  const minY = pipe.gapTop + MAGNET_RADIUS;
  const maxY = pipe.gapBottom - MAGNET_RADIUS;
  if (minY > maxY) {
    return null; // gap too small for pickup
  }
  const y = Math.random() * (maxY - minY) + minY;
  return {
    x: pipe.x + pipe.width / 2,
    y: y,
    radius: MAGNET_RADIUS
  };
}

/**
 * Moves a magnet pickup leftward at the given speed (already scaled by dt externally).
 * Mutates the pickup object in-place (zero allocation).
 */
function moveMagnetPickup(pickup, speed, dt) {
  pickup.x -= speed;
}

/**
 * Checks whether a magnet pickup has moved entirely off the left edge.
 * A pickup is off-screen when its rightmost point (x + radius) is at or below 0.
 */
function isMagnetOffScreen(pickup) {
  return pickup.x + pickup.radius <= 0;
}

/**
 * Renders a magnet pickup as a magenta circle (radius 14px) with shadowBlur 10
 * and a U-shaped magnet icon drawn using canvas arcs and lines.
 * Does NOT mutate state.
 */
function renderMagnetPickup(ctx, pickup) {
  // Magenta glow circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.closePath();

  // U-shaped magnet icon
  const cx = pickup.x;
  const cy = pickup.y;
  const iconScale = pickup.radius / 14; // scale icon to match pickup size

  // Draw the U-shape (horseshoe magnet)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * iconScale;
  ctx.lineCap = 'round';

  // U-arc at the bottom
  ctx.beginPath();
  ctx.arc(cx, cy + 1 * iconScale, 5 * iconScale, 0, Math.PI, false);
  ctx.stroke();

  // Left arm going up
  ctx.beginPath();
  ctx.moveTo(cx - 5 * iconScale, cy + 1 * iconScale);
  ctx.lineTo(cx - 5 * iconScale, cy - 5 * iconScale);
  ctx.stroke();

  // Right arm going up
  ctx.beginPath();
  ctx.moveTo(cx + 5 * iconScale, cy + 1 * iconScale);
  ctx.lineTo(cx + 5 * iconScale, cy - 5 * iconScale);
  ctx.stroke();

  // Red tip on left arm
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(cx - 6.5 * iconScale, cy - 7 * iconScale, 3 * iconScale, 3 * iconScale);

  // Blue tip on right arm
  ctx.fillStyle = '#0088ff';
  ctx.fillRect(cx + 3.5 * iconScale, cy - 7 * iconScale, 3 * iconScale, 3 * iconScale);

  ctx.restore();
}

/**
 * Renders a shield pickup as a glowing blue circle with a simple shield icon.
 * Uses Canvas arc primitives with shadowColor/shadowBlur for glow effect.
 * Does NOT mutate state.
 */
function renderShieldPickup(ctx, pickup) {
  ctx.save();

  // Glowing blue circle
  ctx.beginPath();
  ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 136, 255, 0.8)';
  ctx.shadowColor = '#0088ff';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.closePath();

  // Shield icon: chevron/arc shape inside the circle
  const cx = pickup.x;
  const cy = pickup.y;
  const iconScale = pickup.radius / 14;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * iconScale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw a shield shape (rounded chevron pointing up)
  ctx.beginPath();
  ctx.arc(cx, cy - 2 * iconScale, 6 * iconScale, Math.PI, 0, false);
  ctx.lineTo(cx + 6 * iconScale, cy + 2 * iconScale);
  ctx.lineTo(cx, cy + 7 * iconScale);
  ctx.lineTo(cx - 6 * iconScale, cy + 2 * iconScale);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders the active shield effect as a translucent blue circular outline
 * around Ghosty. Outline radius = half diagonal of sprite + 6px, scaled.
 * Does NOT mutate state.
 */
function renderActiveShield(ctx, player, scaleFactor) {
  const sprW = SPRITE_WIDTH * scaleFactor;
  const sprH = SPRITE_HEIGHT * scaleFactor;
  const centerX = player.x + sprW / 2;
  const centerY = player.y + sprH / 2;
  const diagonal = Math.sqrt(sprW * sprW + sprH * sprH);
  const radius = diagonal / 2 + 6 * scaleFactor;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 136, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

/**
 * Circle-rect collision detection between a player rectangle and a magnet pickup.
 * Finds the closest point on the rectangle to the circle center,
 * then checks if the distance is within the circle's radius.
 */
function checkMagnetPickupCollision(playerRect, pickup) {
  const closestX = Math.max(playerRect.x, Math.min(pickup.x, playerRect.x + playerRect.width));
  const closestY = Math.max(playerRect.y, Math.min(pickup.y, playerRect.y + playerRect.height));
  const distX = pickup.x - closestX;
  const distY = pickup.y - closestY;
  return (distX * distX + distY * distY) <= (pickup.radius * pickup.radius);
}

/**
 * Activates the Magnet effect by setting the active flag and initializing
 * the 6-second duration timer. If already active, resets the timer without
 * stacking effects.
 */
function activateMagnet(gameContext) {
  gameContext.magnetActive = true;
  gameContext.magnetTimer = MAGNET_DURATION;
  return gameContext;
}

/**
 * Attracts Data Packets within the given attract radius of playerCenter
 * toward Ghosty at the given attract speed scaled by dt.
 * At 60fps one frame = ~16.67ms, so speed is scaled by (dt / 16.67).
 * Packets outside the radius are unaffected.
 * Mutates packets in-place for performance (no new allocations).
 */
function attractDataPackets(packets, playerCenter, dt, attractRadius, attractSpeed) {
  const frameScale = dt / 16.67;
  const speed = attractSpeed * frameScale;
  const radiusSq = attractRadius * attractRadius;

  for (let i = 0; i < packets.length; i++) {
    const packet = packets[i];
    const dx = playerCenter.x - packet.x;
    const dy = playerCenter.y - packet.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > 0 && distSq <= radiusSq) {
      const dist = Math.sqrt(distSq);
      // Normalize direction and apply speed
      packet.x += (dx / dist) * speed;
      packet.y += (dy / dist) * speed;
    }
  }
}

/**
 * Renders the magnet active effect as a purple ring around Ghosty.
 * The ring radius is MAGNET_ATTRACT_RADIUS scaled by scaleFactor.
 * Opacity oscillates between 0.3 and 0.8 over a 600ms cycle using a sine wave.
 * Does NOT mutate state.
 */
function renderMagnetActiveEffect(ctx, player, scaleFactor, deltaMs) {
  const sprW = SPRITE_WIDTH * scaleFactor;
  const sprH = SPRITE_HEIGHT * scaleFactor;
  const centerX = player.x + sprW / 2;
  const centerY = player.y + sprH / 2;
  const radius = MAGNET_ATTRACT_RADIUS * scaleFactor;

  // Compute oscillating opacity using magnetTimer as a phase accumulator
  // magnetTimer counts down from MAGNET_DURATION, so use elapsed time
  const elapsed = MAGNET_DURATION - (gameContext.magnetTimer || 0);
  const opacity = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(2 * Math.PI * elapsed / 600));

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = '#b366ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}



// === Day/Night Cycle System ===

/**
 * Returns the initial Day/Night cycle state with elapsed time at 0.
 * The cycle starts at the midpoint of the sinusoidal oscillation.
 */
function initDayNightCycle() {
  return { elapsedMs: 0 };
}

/**
 * Updates the Day/Night cycle state by advancing elapsed time.
 * If paused, returns the state unchanged (cycle freezes).
 * Wraps elapsedMs at DAY_NIGHT_PERIOD to prevent unbounded growth.
 * Returns the updated state object.
 */
function updateDayNightCycle(state, deltaMs, isPaused) {
  if (isPaused) {
    return state;
  }
  const newElapsed = (state.elapsedMs + deltaMs) % DAY_NIGHT_PERIOD;
  return { elapsedMs: newElapsed };
}

/**
 * Computes the cycle position as a sinusoidal oscillation over the period.
 * Returns a value from 0 (night) to 1 (day).
 * Formula: 0.5 + 0.5 * sin(2π * elapsedMs / DAY_NIGHT_PERIOD)
 */
function getDayNightPosition(state) {
  return 0.5 + 0.5 * Math.sin(2 * Math.PI * state.elapsedMs / DAY_NIGHT_PERIOD);
}

/**
 * Interpolates between NIGHT_COLOR and DAY_COLOR based on cyclePosition (0=night, 1=day).
 * Parses hex color strings into RGB, linearly interpolates each channel,
 * and returns a hex color string.
 * When reducedMotionEnabled, returns the static NIGHT_COLOR without interpolation.
 */
function interpolateBackground(cyclePosition) {
  if (reducedMotionEnabled) {
    return NIGHT_COLOR;
  }
  // Parse NIGHT_COLOR hex to RGB
  const nr = parseInt(NIGHT_COLOR.slice(1, 3), 16);
  const ng = parseInt(NIGHT_COLOR.slice(3, 5), 16);
  const nb = parseInt(NIGHT_COLOR.slice(5, 7), 16);
  // Parse DAY_COLOR hex to RGB
  const dr = parseInt(DAY_COLOR.slice(1, 3), 16);
  const dg = parseInt(DAY_COLOR.slice(3, 5), 16);
  const db = parseInt(DAY_COLOR.slice(5, 7), 16);
  // Linear interpolation per channel
  const r = Math.round(nr + cyclePosition * (dr - nr));
  const g = Math.round(ng + cyclePosition * (dg - ng));
  const b = Math.round(nb + cyclePosition * (db - nb));
  return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
}

/**
 * Returns the star opacity based on cycle position.
 * At night (cyclePosition=0): returns STAR_OPACITY_MAX (0.8)
 * At day (cyclePosition=1): returns STAR_OPACITY_MIN (0.2)
 * Linear interpolation between them.
 */
function getStarOpacity(cyclePosition) {
  return STAR_OPACITY_MAX - cyclePosition * (STAR_OPACITY_MAX - STAR_OPACITY_MIN);
}

// === Trail Effect System ===

/**
 * Initializes a ring buffer for the trail effect.
 * Returns a buffer object with empty positions array, head pointer,
 * count of entries, and frame counter for sampling interval.
 */
function initTrailBuffer() {
  return { positions: [], head: 0, count: 0, frameCounter: 0 };
}

/**
 * Samples Ghosty's position into the ring buffer every TRAIL_SAMPLE_INTERVAL frames.
 * Increments frameCounter each call; only writes when frameCounter % TRAIL_SAMPLE_INTERVAL === 0.
 * Writes {x, y} at the head position, advances head (wraps at TRAIL_BUFFER_SIZE),
 * increments count (capped at TRAIL_BUFFER_SIZE).
 */
function sampleTrailPosition(buffer, x, y) {
  buffer.frameCounter++;
  if (buffer.frameCounter % TRAIL_SAMPLE_INTERVAL !== 0) {
    return;
  }
  buffer.positions[buffer.head] = { x: x, y: y };
  buffer.head = (buffer.head + 1) % TRAIL_BUFFER_SIZE;
  if (buffer.count < TRAIL_BUFFER_SIZE) {
    buffer.count++;
  }
}

/**
 * Renders the trail as circles from oldest to newest in the ring buffer.
 * Radius interpolates linearly from 3px (oldest) to 10px (newest).
 * Opacity interpolates linearly from 0.0 (oldest) to 0.6 (newest).
 * Color: TRAIL_COLOR. Does NOT mutate state.
 */
function renderTrail(ctx, buffer) {
  if (buffer.count === 0) return;

  ctx.save();
  for (let i = 0; i < buffer.count; i++) {
    // Iterate from oldest to newest
    const index = (buffer.head - buffer.count + i + TRAIL_BUFFER_SIZE) % TRAIL_BUFFER_SIZE;
    const pos = buffer.positions[index];
    if (!pos) continue;

    // i=0 is oldest, i=buffer.count-1 is newest
    const t = buffer.count > 1 ? i / (buffer.count - 1) : 1;
    const radius = 3 + t * (10 - 3);
    const opacity = t * 0.6;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = TRAIL_COLOR;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Clears the trail ring buffer by resetting positions array, head, count,
 * and frameCounter to initial values.
 */
function clearTrailBuffer(buffer) {
  buffer.positions = [];
  buffer.head = 0;
  buffer.count = 0;
  buffer.frameCounter = 0;
}

// === Death Animation System ===

/**
 * Initializes a death animation state from the player's current position and velocity.
 * Returns an object tracking the animation's progress: position, velocity, rotation, and timer.
 */
function initDeathAnimation(player, velocity) {
  return {
    active: true,
    timer: 0,
    x: player.x,
    y: player.y,
    velocity: velocity,
    rotation: 0
  };
}

/**
 * Advances the death animation state by deltaMs.
 * Applies gravity to vertical velocity and position, increments rotation at DEATH_SPIN_RATE,
 * and clamps the y position to the canvas bottom edge.
 * When the timer exceeds DEATH_ANIM_DURATION, marks the animation as complete (active = false).
 */
function updateDeathAnimation(state, deltaMs, canvasHeight, scaleFactor) {
  const dt = deltaMs / 1000; // convert to seconds for physics
  const newTimer = state.timer + deltaMs;
  const newVelocity = state.velocity + GRAVITY * scaleFactor * (deltaMs / 16.67);
  const newY = Math.min(state.y + newVelocity, canvasHeight - SPRITE_HEIGHT * scaleFactor);
  const newRotation = state.rotation + DEATH_SPIN_RATE * dt;

  return {
    active: newTimer < DEATH_ANIM_DURATION,
    timer: newTimer,
    x: state.x,
    y: newY,
    velocity: newVelocity,
    rotation: newRotation
  };
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
 * Applies charge-pulse animation class when charge reaches 100%.
 * Removes pulse class when charge drops below 100%.
 * Skips update gracefully if the bar element is not found in the DOM.
 */
function updateChargeBar(charge) {
  const bar = domCache.steeringChargeBar;
  if (bar) {
    bar.style.width = `${charge}%`;
    if (charge >= MAX_CHARGE) {
      if (!bar.classList.contains('charge-pulse')) {
        bar.classList.add('charge-pulse');
      }
    } else {
      bar.classList.remove('charge-pulse');
    }
  }
  // Add/remove charge-full class on the container for pulse animation
  const container = domCache.steeringChargeContainer;
  if (container) {
    if (charge >= MAX_CHARGE) {
      if (!container.classList.contains('charge-full')) {
        container.classList.add('charge-full');
      }
    } else {
      container.classList.remove('charge-full');
    }
  }
}

// === Phase Mode Controller ===

/**
 * Activates Phase Mode by setting the active flag and initializing
 * the 5-second duration timer. Player keeps manual control but
 * becomes invincible to pipe collisions (phases through like a ghost).
 */
function activateSteeringMode(gameContext) {
  gameContext.steeringModeActive = true;
  gameContext.steeringModeTimer = STEERING_MODE_DURATION;
  return gameContext;
}

/**
 * Deactivates Phase Mode, restoring normal gameplay state.
 * Clears the active flag, resets the timer, and zeroes the charge meter.
 */
function deactivateSteeringMode(gameContext) {
  gameContext.steeringModeActive = false;
  gameContext.steeringModeTimer = 0;
  gameContext.steeringCharge = 0;
  return gameContext;
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

  gameContext.steeringModeTimer = newTimer;
  gameContext.steeringCharge = newCharge;
  return gameContext;
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
    shakeState.active = false;
    shakeState.timer = 0;
    shakeState.offsetX = 0;
    shakeState.offsetY = 0;
    return shakeState;
  }
  shakeState.timer = newTimer;
  return shakeState;
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
    graceState.active = false;
    graceState.timer = 0;
    return graceState;
  }
  graceState.timer = newTimer;
  return graceState;
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

// === Themed Worlds System ===

/**
 * Initializes the theme system state.
 * Returns the initial state with the first theme active and no transition.
 */
function initThemeSystem() {
  return {
    currentIndex: 0,
    lastScoreThreshold: 0,
    transitioning: false,
    transitionTimer: 0
  };
}

/**
 * Updates the theme system state based on score and elapsed time.
 * Checks if score has crossed a 50-point threshold. If so, advances the theme index
 * (wrapping around). Handles multi-step score jumps by advancing to the correct theme.
 * Manages the 300ms transition timer for the white fade overlay.
 * Mutates state in-place (zero allocation).
 */
function updateThemeSystem(state, score, deltaMs) {
  // Compute which theme index we should be at based on score
  const targetIndex = Math.floor(score / THEME_INTERVAL) % WORLD_THEMES.length;
  const currentThreshold = Math.floor(score / THEME_INTERVAL) * THEME_INTERVAL;

  // Check if we crossed a new threshold (score advanced past a multiple of 50)
  if (currentThreshold > state.lastScoreThreshold && score > 0) {
    state.currentIndex = targetIndex;
    state.lastScoreThreshold = currentThreshold;
    state.transitioning = true;
    state.transitionTimer = THEME_TRANSITION_DURATION;
  }

  // Decrement transition timer
  if (state.transitioning) {
    state.transitionTimer -= deltaMs;
    if (state.transitionTimer <= 0) {
      state.transitionTimer = 0;
      state.transitioning = false;
    }
  }

  return state;
}

/**
 * Returns the current World_Theme object based on the theme system state.
 */
function getCurrentTheme(state) {
  return WORLD_THEMES[state.currentIndex];
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

// === Particle System ===

// Particle Constants
const PARTICLE_MIN_RADIUS = 2;
const PARTICLE_MAX_RADIUS = 4;
const PARTICLE_MIN_LIFE = 400;    // milliseconds
const PARTICLE_MAX_LIFE = 600;    // milliseconds
const PARTICLE_COLOR = '#b366ff'; // accent-primary matching palette
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

// === Object Pool Constants ===

const PARTICLE_POOL_SIZE = 30;
const PIPE_POOL_SIZE = 10;

// === Object Pool System ===

/**
 * Creates a generic object pool with pre-allocated slots.
 * @param {number} size - Number of slots to pre-allocate
 * @param {function} factory - Factory function that returns a new default object for a slot
 * @returns {{ items: Array, activeFlags: Array<boolean>, activeCount: number }}
 */
function createPool(size, factory) {
  const items = [];
  const activeFlags = [];
  for (let i = 0; i < size; i++) {
    items.push(factory());
    activeFlags.push(false);
  }
  return { items, activeFlags, activeCount: 0 };
}

/**
 * Acquires an inactive slot from the pool and marks it active.
 * Returns the index of the acquired slot, or -1 if pool is exhausted.
 * @param {Object} pool - Pool created by createPool
 * @returns {number} Index of the acquired slot, or -1 if none available
 */
function acquireFromPool(pool) {
  for (let i = 0; i < pool.items.length; i++) {
    if (!pool.activeFlags[i]) {
      pool.activeFlags[i] = true;
      pool.activeCount++;
      return i;
    }
  }
  return -1;
}

/**
 * Releases a slot back to the pool by index, marking it inactive for reuse.
 * @param {Object} pool - Pool created by createPool
 * @param {number} index - Index of the slot to release
 */
function releaseToPool(pool, index) {
  if (pool.activeFlags[index]) {
    pool.activeFlags[index] = false;
    pool.activeCount--;
  }
}

// === Particle Pool (specialized) ===

/**
 * Creates a particle pool with pre-allocated particle objects.
 * All particles start inactive and available for reuse.
 * Returns a pool object with items, activeFlags, and activeCount.
 */
function createParticlePool(size) {
  return createPool(size, function () {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 0,
      color: PARTICLE_COLOR,
      alpha: 0,
      life: 0,
      maxLife: 0
    };
  });
}

/**
 * Acquires an inactive particle from the pool.
 * Returns the particle object if one is available, or null if pool is exhausted.
 * Marks the acquired particle as active.
 */
function acquireParticle(pool) {
  const idx = acquireFromPool(pool);
  if (idx === -1) return null;
  return pool.items[idx];
}

/**
 * Releases a particle back to the pool, marking it inactive.
 * The particle becomes available for future acquire calls.
 */
function releaseParticle(pool, particle) {
  for (let i = 0; i < pool.items.length; i++) {
    if (pool.items[i] === particle) {
      releaseToPool(pool, i);
      return;
    }
  }
}

/**
 * Spawns particles using the pool instead of array allocation.
 * Acquires particles from pool, initializes properties in-place.
 * @param {Object} pool - The particle pool
 * @param {number} x - Spawn X position
 * @param {number} y - Spawn Y position
 * @param {number} count - Number of particles to spawn
 * @param {Object} config - Color, speed, lifetime config
 * @returns {number} Number of particles actually spawned (pool capacity limited)
 */
function spawnParticlesPooled(pool, x, y, count, config) {
  const color = (config && config.color) || PARTICLE_COLOR;
  const minLife = (config && config.minLife) || PARTICLE_MIN_LIFE;
  const maxLife = (config && config.maxLife) || PARTICLE_MAX_LIFE;
  const minRadius = (config && config.minRadius) || PARTICLE_MIN_RADIUS;
  const maxRadius = (config && config.maxRadius) || PARTICLE_MAX_RADIUS;
  const speed = (config && config.speed) || PARTICLE_SPEED;

  let spawned = 0;
  for (let i = 0; i < count; i++) {
    const idx = acquireFromPool(pool);
    if (idx === -1) break;
    const p = pool.items[idx];
    const angle = Math.random() * Math.PI * 2;
    const spd = speed * (0.5 + Math.random() * 0.5);
    const life = minLife + Math.random() * (maxLife - minLife);
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * spd;
    p.vy = Math.sin(angle) * spd;
    p.radius = minRadius + Math.random() * (maxRadius - minRadius);
    p.color = color;
    p.alpha = 1.0;
    p.life = life;
    p.maxLife = life;
    spawned++;
  }
  return spawned;
}

/**
 * Updates all active particles in the pool in-place.
 * Releases expired particles back to pool.
 * @param {Object} pool - The particle pool
 * @param {number} dt - Delta time in milliseconds
 */
function updateParticlesPooled(pool, dt) {
  const dtSec = dt / 1000;
  for (let i = 0; i < pool.items.length; i++) {
    if (!pool.activeFlags[i]) continue;
    const p = pool.items[i];
    p.life -= dt;
    if (p.life <= 0) {
      releaseToPool(pool, i);
    } else {
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
  }
}

/**
 * Renders all active particles from the pool.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} pool - The particle pool
 */
function renderParticlesPooled(ctx, pool) {
  if (pool.activeCount === 0) return;
  ctx.save();
  for (let i = 0; i < pool.items.length; i++) {
    if (!pool.activeFlags[i]) continue;
    const p = pool.items[i];
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Returns the number of currently active items in the pool.
 */
function getActiveCount(pool) {
  return pool.activeCount;
}

// === Pipe Pool (specialized) ===

/**
 * Creates a pipe pool with pre-allocated pipe pair objects.
 * All pipes start inactive and available for reuse.
 * Returns a pool object with items, activeFlags, and activeCount.
 */
function createPipePool(size) {
  return createPool(size, function () {
    return {
      x: 0,
      gapTop: 0,
      gapBottom: 0,
      width: PIPE_WIDTH,
      scored: false
    };
  });
}

/**
 * Acquires an inactive pipe from the pool.
 * Returns the pipe object if one is available, or null if pool is exhausted.
 * Marks the acquired pipe as active.
 */
function acquirePipe(pool) {
  const idx = acquireFromPool(pool);
  if (idx === -1) return null;
  return pool.items[idx];
}

/**
 * Releases a pipe back to the pool, marking it inactive.
 * The pipe becomes available for future acquire calls.
 */
function releasePipe(pool, pipe) {
  for (let i = 0; i < pool.items.length; i++) {
    if (pool.items[i] === pipe) {
      releaseToPool(pool, i);
      return;
    }
  }
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
 * Mutates the layers object in-place (zero allocation).
 */
function updateParallaxLayers(layers, pipeSpeed, dt) {
  // Normalize dt from milliseconds to frame units (16.67ms = 1 frame at 60fps)
  const frameScale = dt / 16.67;
  const backAdvance = pipeSpeed * layers.back.speedRatio * frameScale;
  const frontAdvance = pipeSpeed * layers.front.speedRatio * frameScale;

  layers.back.offset = (layers.back.offset + backAdvance) % layers.back.tileWidth;
  layers.front.offset = (layers.front.offset + frontAdvance) % layers.front.tileWidth;

  return layers;
}

/**
 * Renders both parallax layers onto the canvas.
 * Draws the dark base color, then stars (back layer) and grid lines (front layer),
 * each drawn twice for seamless horizontal wrapping.
 * This function does NOT mutate state.
 */
function renderParallaxLayers(ctx, layers, canvasWidth, canvasHeight, dayNightPosition, themeAccent) {
  // Dark base background
  // When themeAccent is provided, use it as the base background color
  // When dayNightPosition is provided, interpolate background color based on cycle position
  if (themeAccent) {
    ctx.fillStyle = themeAccent;
  } else if (dayNightPosition != null) {
    ctx.fillStyle = interpolateBackground(dayNightPosition);
  } else {
    ctx.fillStyle = '#0f0f23';
  }
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Back layer: stars/dots
  // Use interpolated star opacity when dayNightPosition is provided
  const starAlpha = (dayNightPosition != null) ? getStarOpacity(dayNightPosition) : 0.6;
  ctx.fillStyle = 'rgba(200, 200, 255, ' + starAlpha + ')';
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
  ctx.strokeStyle = 'rgba(179, 102, 255, 0.15)';
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

// === Responsive Canvas System ===

/**
 * Calculates canvas dimensions that fit within the viewport while maintaining
 * the 2:3 aspect ratio. Applies horizontal and vertical padding, clamps width
 * to [MIN_CANVAS_WIDTH, MAX_CANVAS_WIDTH], and handles landscape orientation
 * where height is the constraining dimension.
 * Returns { width, height }.
 */
function calculateCanvasDimensions(viewportWidth, viewportHeight) {
  const availableWidth = viewportWidth - PADDING_HORIZONTAL;
  const availableHeight = viewportHeight - PADDING_VERTICAL;

  // Determine if height is the constraining dimension (landscape)
  // Width from height: if we fill height, what width would we need?
  const widthFromHeight = availableHeight * ASPECT_RATIO;
  // Height from width: if we fill width, what height would we need?
  const heightFromWidth = availableWidth / ASPECT_RATIO;

  let width;
  let height;

  if (heightFromWidth > availableHeight) {
    // Height-constrained (landscape): size from available height
    width = widthFromHeight;
    height = availableHeight;
  } else {
    // Width-constrained (portrait): size from available width
    width = availableWidth;
    height = heightFromWidth;
  }

  // Clamp width to [MIN_CANVAS_WIDTH, MAX_CANVAS_WIDTH]
  width = Math.max(MIN_CANVAS_WIDTH, Math.min(MAX_CANVAS_WIDTH, width));
  // Derive height from clamped width to maintain aspect ratio
  height = width / ASPECT_RATIO;

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Returns the scale factor as the ratio of current canvas width to the base width.
 * Used to scale all game coordinates uniformly.
 */
function getScaleFactor(currentWidth) {
  return currentWidth / BASE_WIDTH;
}

/**
 * Applies the calculated dimensions to the canvas element, updating both
 * the drawing surface size and the CSS display size.
 */
function applyCanvasResize(canvas, width, height) {
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
}

/**
 * Sets up a debounced window resize handler that recalculates and applies
 * canvas dimensions when the viewport changes. Debounce delay is RESIZE_DEBOUNCE_MS (100ms).
 */
function setupResizeHandler(canvas, onResize) {
  let resizeTimer = null;

  window.addEventListener('resize', () => {
    if (resizeTimer !== null) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      const dims = calculateCanvasDimensions(window.innerWidth, window.innerHeight);
      applyCanvasResize(canvas, dims.width, dims.height);
      if (onResize) {
        onResize(dims.width, dims.height);
      }
    }, RESIZE_DEBOUNCE_MS);
  });
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

  // Falling matrix-style characters (render only, no mutation)
  ctx.fillStyle = 'rgba(0, 255, 100, 0.7)';
  ctx.font = '14px monospace';
  const columnWidth = 20;
  for (let i = 0; i < matrixColumns.length; i++) {
    const col = matrixColumns[i];
    const char = String.fromCharCode(0x30A0 + Math.random() * 96);
    ctx.fillText(char, i * columnWidth, col.y);
  }
}

/**
 * Updates the matrix column positions using delta time for frame-rate independence.
 * Called from the update loop, NOT from render.
 */
function updateMatrixGrid(deltaMs, canvasHeight) {
  const frameScale = deltaMs / 16.67;
  for (let i = 0; i < matrixColumns.length; i++) {
    const col = matrixColumns[i];
    col.y += col.speed * frameScale;
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

// === Chiptune Music Engine ===

const MUSIC_NOTE_DURATION = 200;   // ms per note
const MUSIC_VOLUME = 0.15;
const MUSIC_FADE_OUT = 100;        // ms fade-out on stop
const PENTATONIC_SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C4 pentatonic extended

/**
 * Creates a procedural chiptune music engine using Web Audio API OscillatorNodes.
 * Returns an object with startMusic, stopMusic, pauseMusic, resumeMusic methods.
 * This is SEPARATE from the existing createProceduralAudioEngine (sound effects).
 */
function createChiptuneEngine(audioContext) {
  let masterGain = null;
  let melodyOsc = null;
  let melodyGain = null;
  let bassOsc = null;
  let bassGain = null;
  let noteIndex = 0;
  let melodyInterval = null;
  let isPlaying = false;
  let isPaused = false;

  /**
   * Ensures the AudioContext is resumed (handles autoplay policy).
   * Called before starting playback.
   */
  function ensureResumed() {
    try {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
    } catch (e) {}
  }

  /**
   * Starts the chiptune melody and bass line.
   * Melody: repeating sequence of pentatonic scale notes (square wave, 200ms each).
   * Bass: square wave one octave below, playing root on beats 1 and 3 of a 4-beat pattern.
   */
  function startMusic() {
    try {
      if (isPlaying) return;
      ensureResumed();
      if (!audioContext) return;

      // Master gain node for combined volume control
      masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(MUSIC_VOLUME, audioContext.currentTime);
      masterGain.connect(audioContext.destination);

      // Melody oscillator (square wave)
      melodyOsc = audioContext.createOscillator();
      melodyOsc.type = 'square';
      melodyOsc.frequency.setValueAtTime(PENTATONIC_SCALE[0], audioContext.currentTime);
      melodyGain = audioContext.createGain();
      melodyGain.gain.setValueAtTime(0.6, audioContext.currentTime);
      melodyOsc.connect(melodyGain);
      melodyGain.connect(masterGain);
      melodyOsc.start();

      // Bass oscillator (square wave, one octave below)
      bassOsc = audioContext.createOscillator();
      bassOsc.type = 'square';
      bassOsc.frequency.setValueAtTime(PENTATONIC_SCALE[0] / 2, audioContext.currentTime);
      bassGain = audioContext.createGain();
      bassGain.gain.setValueAtTime(0, audioContext.currentTime); // starts silent, plays on beats 1 & 3
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start();

      noteIndex = 0;
      isPlaying = true;
      isPaused = false;

      // Schedule notes using setInterval at MUSIC_NOTE_DURATION
      melodyInterval = setInterval(() => {
        try {
          if (!audioContext || !melodyOsc) return;
          const now = audioContext.currentTime;

          // Advance melody note
          noteIndex = (noteIndex + 1) % PENTATONIC_SCALE.length;
          melodyOsc.frequency.setValueAtTime(PENTATONIC_SCALE[noteIndex], now);

          // Bass line: plays root (first note) on beats 1 and 3 of a 4-beat pattern
          // Beat position within 4-beat cycle (each beat = one note = 200ms)
          const beatPosition = noteIndex % 4;
          if (beatPosition === 0 || beatPosition === 2) {
            // Play bass note (root, one octave below)
            bassOsc.frequency.setValueAtTime(PENTATONIC_SCALE[0] / 2, now);
            bassGain.gain.setValueAtTime(0.4, now);
          } else {
            // Silence bass on beats 2 and 4
            bassGain.gain.setValueAtTime(0, now);
          }
        } catch (e) {}
      }, MUSIC_NOTE_DURATION);
    } catch (e) {}
  }

  /**
   * Stops music with a 100ms gain fade-out to prevent audio pops.
   * Clears the scheduling interval and disconnects oscillators.
   */
  function stopMusic() {
    try {
      if (!isPlaying && !isPaused) return;

      if (melodyInterval) {
        clearInterval(melodyInterval);
        melodyInterval = null;
      }

      if (masterGain && audioContext) {
        const now = audioContext.currentTime;
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0, now + MUSIC_FADE_OUT / 1000);

        // Stop oscillators after fade-out completes
        setTimeout(() => {
          try {
            if (melodyOsc) { melodyOsc.stop(); melodyOsc.disconnect(); melodyOsc = null; }
            if (bassOsc) { bassOsc.stop(); bassOsc.disconnect(); bassOsc = null; }
            if (melodyGain) { melodyGain.disconnect(); melodyGain = null; }
            if (bassGain) { bassGain.disconnect(); bassGain = null; }
            if (masterGain) { masterGain.disconnect(); masterGain = null; }
          } catch (e) {}
        }, MUSIC_FADE_OUT);
      }

      isPlaying = false;
      isPaused = false;
    } catch (e) {}
  }

  /**
   * Pauses music by suspending the scheduling interval and silencing gain.
   * Preserves the current note index for resume.
   */
  function pauseMusic() {
    try {
      if (!isPlaying || isPaused) return;

      if (melodyInterval) {
        clearInterval(melodyInterval);
        melodyInterval = null;
      }

      // Silence gain but keep oscillators alive
      if (masterGain && audioContext) {
        masterGain.gain.setValueAtTime(0, audioContext.currentTime);
      }

      isPaused = true;
      isPlaying = false;
    } catch (e) {}
  }

  /**
   * Resumes music from the last note position after pause.
   * Restores gain and restarts the scheduling interval.
   */
  function resumeMusic() {
    try {
      if (!isPaused) return;
      ensureResumed();

      // Restore volume
      if (masterGain && audioContext) {
        masterGain.gain.setValueAtTime(MUSIC_VOLUME, audioContext.currentTime);
      }

      isPaused = false;
      isPlaying = true;

      // Resume scheduling from current noteIndex
      melodyInterval = setInterval(() => {
        try {
          if (!audioContext || !melodyOsc) return;
          const now = audioContext.currentTime;

          noteIndex = (noteIndex + 1) % PENTATONIC_SCALE.length;
          melodyOsc.frequency.setValueAtTime(PENTATONIC_SCALE[noteIndex], now);

          const beatPosition = noteIndex % 4;
          if (beatPosition === 0 || beatPosition === 2) {
            bassOsc.frequency.setValueAtTime(PENTATONIC_SCALE[0] / 2, now);
            bassGain.gain.setValueAtTime(0.4, now);
          } else {
            bassGain.gain.setValueAtTime(0, now);
          }
        } catch (e) {}
      }, MUSIC_NOTE_DURATION);
    } catch (e) {}
  }

  return {
    startMusic,
    stopMusic,
    pauseMusic,
    resumeMusic
  };
}

// === Accessibility: ARIA Label ===

/**
 * Updates the canvas aria-label to reflect the current game state.
 * Called on every state transition so screen readers announce changes.
 * Format: "Flappy Kiro game: [waiting to start | playing, score N | paused | game over, score N]"
 */
function updateAriaLabel(canvas, state, score) {
  let descriptor;
  switch (state) {
    case GameState.START_SCREEN:
      descriptor = 'waiting to start';
      break;
    case GameState.PLAYING:
      descriptor = `playing, score ${score}`;
      break;
    case GameState.PAUSED:
      descriptor = 'paused';
      break;
    case GameState.GAME_OVER:
      descriptor = `game over, score ${score}`;
      break;
    default:
      descriptor = 'waiting to start';
  }
  canvas.setAttribute('aria-label', `Flappy Kiro game: ${descriptor}`);
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
  const overlay = domCache.deathRecapOverlay;
  const scoreEl = domCache.deathRecapScore;
  const highScoreEl = domCache.deathRecapHighscore;
  const newHighEl = domCache.deathRecapNewHigh;
  const countdownEl = domCache.deathRecapCountdown;
  const restartEl = domCache.deathRecapRestart;

  if (scoreEl) scoreEl.textContent = `Score: ${score}`;
  if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
  if (newHighEl) newHighEl.style.display = isNewHighScore ? 'block' : 'none';
  if (countdownEl) {
    countdownEl.textContent = `Restarting in ${RECAP_COUNTDOWN}...`;
    countdownEl.style.display = 'block';
  }
  if (restartEl) restartEl.style.display = 'none';
  // Don't show overlay directly — fadeIn()/showOverlay() handles display and visibility
  if (overlay) {
    overlay.classList.remove('visible');
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

    const countdownEl = domCache.deathRecapCountdown;
    const restartEl = domCache.deathRecapRestart;
    if (countdownEl) countdownEl.style.display = 'none';
    if (restartEl) {
      restartEl.style.display = 'block';
      restartEl.focus();
    }
  } else {
    const secondsLeft = Math.ceil(gameContext.deathRecap.countdown / 1000);
    const countdownEl = domCache.deathRecapCountdown;
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
 * Shows an overlay element with a CSS class-based fade-in transition.
 * Sets display to flex, forces reflow, then adds the .visible class
 * which triggers opacity + transform transitions defined in CSS.
 */
function showOverlay(element) {
  if (!element) return;
  element.style.display = 'flex';
  void element.offsetHeight; // force reflow
  element.classList.add('visible');
}

/**
 * Hides an overlay element by removing the .visible class.
 * CSS transitions handle the fade-out animation.
 * Note: display is NOT set to none here — CSS or a transitionend listener handles that.
 */
function hideOverlay(element) {
  if (!element) return;
  element.classList.remove('visible');
}

/**
 * Triggers the score pulse animation on increment.
 * Removes and re-adds the .score-pulse CSS class with a reflow
 * in between to re-trigger the keyframe animation.
 */
function triggerScorePulse(scoreElement) {
  if (!scoreElement) return;
  scoreElement.classList.remove('score-pulse');
  void scoreElement.offsetHeight; // force reflow
  scoreElement.classList.add('score-pulse');
}

/**
 * Fades out an element by removing the .visible class.
 * After the specified duration, hides the element with display: none.
 * Uses class-based transitions via the .visible pattern.
 */
function fadeOut(element, durationMs) {
  if (!element) return;
  hideOverlay(element);
  setTimeout(() => {
    element.style.display = 'none';
  }, durationMs);
}

/**
 * Fades in an element by showing it with the class-based transition.
 * Delegates to showOverlay which sets display:flex, forces reflow,
 * and adds .visible class for CSS-driven animation.
 */
function fadeIn(element, durationMs) {
  if (!element) return;
  showOverlay(element);
}

/**
 * Sets the transition lock on the game context.
 * When locked, input is blocked to prevent actions during fade transitions.
 */
function setTransitionLock(locked) {
  gameContext.transitionLock = locked;
}

/**
 * Shows or hides the score overlay based on the current game state.
 * The overlay is visible (with 0.5 opacity via CSS) only during PLAYING state.
 */
function updateScoreOverlayVisibility(state) {
  const el = domCache.scoreOverlay;
  if (!el) return;
  if (state === GameState.PLAYING) {
    showOverlay(el);
  } else {
    hideOverlay(el);
  }
}

// === Help Overlay System ===

/**
 * Returns whether the help button should be visible for the given game state.
 * Visible only during START_SCREEN and PAUSED states.
 * @param {string} gameState - Current GameState value
 * @returns {boolean}
 */
function isHelpButtonVisible(gameState) {
  return gameState === GameState.START_SCREEN || gameState === GameState.PAUSED;
}

/**
 * Returns whether a given input event should be processed.
 * Blocks all gameplay inputs (flap, steering, game_start) while help overlay is open.
 * Only allows help_toggle and escape through when overlay is visible.
 * @param {string} eventType - The input event type ('flap', 'steering', 'game_start', 'help_toggle', 'escape')
 * @param {boolean} helpOverlayVisible - Whether overlay is showing
 * @returns {boolean}
 */
function shouldProcessInput(eventType, helpOverlayVisible) {
  if (!helpOverlayVisible) return true;
  return eventType === 'help_toggle' || eventType === 'escape';
}

/**
 * Toggles the help overlay visibility.
 * If opening: records previous state, shows overlay, updates helpOverlayVisible.
 * If closing: hides overlay, restores previous state tracking.
 */
function toggleHelpOverlay() {
  if (!domCache.helpOverlay || !domCache.helpBtn) return;

  if (gameContext.helpOverlayVisible) {
    // Close overlay with fade-out
    hideOverlay(domCache.helpOverlay);
    // Set display none after transition completes
    setTimeout(() => {
      if (!gameContext.helpOverlayVisible) {
        domCache.helpOverlay.style.display = 'none';
      }
    }, 250);
    gameContext.helpOverlayVisible = false;
    gameContext.helpOverlayPreviousState = null;
  } else {
    // Only open if help button is visible (START_SCREEN or PAUSED)
    if (!isHelpButtonVisible(gameContext.state)) return;
    gameContext.helpOverlayPreviousState = gameContext.state;
    // Use showOverlay for fade-in with scale transition
    showOverlay(domCache.helpOverlay);
    gameContext.helpOverlayVisible = true;
  }
}

/**
 * Auto-closes the help overlay if it is currently visible.
 * Called before processing external state transitions.
 */
function closeHelpOverlayIfOpen() {
  if (gameContext.helpOverlayVisible) {
    hideOverlay(domCache.helpOverlay);
    domCache.helpOverlay.style.display = 'none';
    gameContext.helpOverlayVisible = false;
    gameContext.helpOverlayPreviousState = null;
  }
}

/**
 * Updates the help button visibility based on the current game state.
 * Shows the button during START_SCREEN and PAUSED, hides otherwise.
 */
function updateHelpButtonVisibility(state) {
  if (!domCache.helpBtn) return;
  if (isHelpButtonVisible(state)) {
    domCache.helpBtn.style.display = '';
  } else {
    domCache.helpBtn.style.display = 'none';
  }
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
  // Block pause during death animation
  if (gameContext.deathAnimation && gameContext.deathAnimation.active) return gameContext;

  // Auto-close help overlay before state transition
  closeHelpOverlayIfOpen();

  const newState = transitionState(gameContext.state, 'ESCAPE');
  if (newState === gameContext.state) return gameContext;

  // Clear trail buffer when transitioning away from PLAYING (to PAUSED)
  if (gameContext.state === GameState.PLAYING && newState === GameState.PAUSED && gameContext.trail) {
    clearTrailBuffer(gameContext.trail);
  }

  gameContext.state = newState;
  gameContext.paused = (newState === GameState.PAUSED);

  // Pause/resume chiptune music on state change
  if (chiptuneEngine) {
    if (newState === GameState.PAUSED) {
      chiptuneEngine.pauseMusic();
    } else if (newState === GameState.PLAYING) {
      chiptuneEngine.resumeMusic();
    }
  }

  // Pause/resume ambient music on state change
  if (musicEngine.ctx) {
    if (newState === GameState.PAUSED) {
      pauseMusic(musicEngine);
    } else if (newState === GameState.PLAYING) {
      resumeMusic(musicEngine);
    }
  }

  const pauseOverlay = domCache.pauseOverlay;
  if (pauseOverlay) {
    if (gameContext.paused) {
      showOverlay(pauseOverlay);
    } else {
      hideOverlay(pauseOverlay);
    }
  }

  updateScoreOverlayVisibility(gameContext.state);
  updateHelpButtonVisibility(gameContext.state);
  updateAriaLabel(domCache.canvas, gameContext.state, gameContext.score);

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
      // If help overlay is open, close it instead of toggling pause
      if (gameContext.helpOverlayVisible) {
        toggleHelpOverlay();
        return;
      }
      togglePause(gameContext);
    }
  });

  canvas.addEventListener('click', () => {
    onInput();
  });

  // Help button toggle
  const helpBtn = domCache.helpBtn;
  if (helpBtn) {
    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleHelpOverlay();
    });
  }

  // On-screen activation button for Steering Mode
  const activateBtn = domCache.steeringActivateBtn;
  if (activateBtn) {
    activateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onActivateSteering();
    });
  }

  // Restart button in death recap overlay
  const restartBtn = domCache.deathRecapRestart;
  if (restartBtn) {
    restartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onInput();
    });
  }
}

// === Pipe Cap Renderer ===

/**
 * Renders a single pipe pair with cap rectangles at the pipe openings.
 * The cap is wider than the pipe body by capOverhang on each side
 * and capHeight pixels tall, drawn at the opening end of each pipe.
 * Uses the provided pipeColor or defaults to green (#00d400).
 * Accepts optional scaled capOverhang and capHeight for responsive sizing.
 */
function renderPipeWithCaps(ctx, pipe, canvasHeight, capOverhang, capHeight, pipeColor) {
  const overhang = capOverhang !== undefined ? capOverhang : CAP_OVERHANG;
  const height = capHeight !== undefined ? capHeight : CAP_HEIGHT;

  ctx.fillStyle = pipeColor || '#00d400';

  // Top pipe body
  ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapTop);
  // Top pipe cap (at bottom of top pipe)
  ctx.fillRect(
    pipe.x - overhang,
    pipe.gapTop - height,
    pipe.width + overhang * 2,
    height
  );

  // Bottom pipe body
  ctx.fillRect(pipe.x, pipe.gapBottom, pipe.width, canvasHeight - pipe.gapBottom);
  // Bottom pipe cap (at top of bottom pipe)
  ctx.fillRect(
    pipe.x - overhang,
    pipe.gapBottom,
    pipe.width + overhang * 2,
    height
  );
}

/**
 * Calculates a highlight color that is 20% lighter than the base hex color.
 * Used for the 3D lighting effect on pipe cap top edges.
 * @param {string} baseColor - Hex color string (e.g., '#00d400')
 * @returns {string} Lighter hex color string
 */
function calculateHighlightColor(baseColor) {
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const lighterR = Math.min(255, Math.round(r + (255 - r) * 0.2));
  const lighterG = Math.min(255, Math.round(g + (255 - g) * 0.2));
  const lighterB = Math.min(255, Math.round(b + (255 - b) * 0.2));
  return '#' + lighterR.toString(16).padStart(2, '0') + lighterG.toString(16).padStart(2, '0') + lighterB.toString(16).padStart(2, '0');
}

/**
 * Renders all pipes with batched style assignments.
 * Sets fillStyle once per color group, draws all pipe bodies,
 * then sets cap style once and draws all caps, then highlights.
 * Minimizes context state changes for better performance.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} pipes - Active pipe objects
 * @param {string} pipeColor - Current pipe body color
 * @param {string} capColor - Current pipe cap color
 * @param {string} highlightColor - Lighter shade for cap top edge
 * @param {number} canvasHeight
 * @param {number} capOverhang - Scaled cap overhang in pixels
 * @param {number} capHeight - Scaled cap height in pixels
 */
function renderPipesBatched(ctx, pipes, pipeColor, capColor, highlightColor, canvasHeight, capOverhang, capHeight) {
  if (pipes.length === 0) return;

  const overhang = capOverhang !== undefined ? capOverhang : CAP_OVERHANG;
  const height = capHeight !== undefined ? capHeight : CAP_HEIGHT;

  // Pass 1: Draw all pipe bodies with a single fillStyle assignment
  ctx.fillStyle = pipeColor;
  for (let i = 0; i < pipes.length; i++) {
    const pipe = pipes[i];
    // Top pipe body
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapTop);
    // Bottom pipe body
    ctx.fillRect(pipe.x, pipe.gapBottom, pipe.width, canvasHeight - pipe.gapBottom);
  }

  // Pass 2: Draw all pipe caps with a single fillStyle assignment
  ctx.fillStyle = capColor;
  for (let i = 0; i < pipes.length; i++) {
    const pipe = pipes[i];
    // Top pipe cap (at bottom of top pipe)
    ctx.fillRect(
      pipe.x - overhang,
      pipe.gapTop - height,
      pipe.width + overhang * 2,
      height
    );
    // Bottom pipe cap (at top of bottom pipe)
    ctx.fillRect(
      pipe.x - overhang,
      pipe.gapBottom,
      pipe.width + overhang * 2,
      height
    );
  }

  // Pass 3: Draw all cap highlight lines with a single strokeStyle assignment
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = 1;
  for (let i = 0; i < pipes.length; i++) {
    const pipe = pipes[i];
    const capX = pipe.x - overhang;
    const capW = pipe.width + overhang * 2;

    // Top cap highlight (top edge of the top cap rect)
    ctx.beginPath();
    ctx.moveTo(capX, pipe.gapTop - height + 0.5);
    ctx.lineTo(capX + capW, pipe.gapTop - height + 0.5);
    ctx.stroke();

    // Bottom cap highlight (top edge of the bottom cap rect)
    ctx.beginPath();
    ctx.moveTo(capX, pipe.gapBottom + 0.5);
    ctx.lineTo(capX + capW, pipe.gapBottom + 0.5);
    ctx.stroke();
  }
}

// === Score Popup ===

/**
 * Removes a popup element safely (no-op if already removed).
 * Cancels the fallback timer if animationend fired first.
 * @param {HTMLElement} popup - The popup DOM element
 * @param {number|null} fallbackTimerId - Timer ID to cancel if animationend fired first
 */
function removeScorePopup(popup, fallbackTimerId) {
  if (fallbackTimerId !== null) {
    clearTimeout(fallbackTimerId);
  }
  if (popup.parentNode !== null) {
    popup.remove();
  }
}

/**
 * Creates a DOM-based "+1" score popup element positioned near the player.
 * The popup floats upward and fades out over 800ms via CSS animation.
 * Lifecycle:
 * - Normal: animationend listener removes popup; 1000ms fallback timeout as safety net
 * - Reduced motion: skip animation listener; remove popup after 50ms timeout
 */
function createScorePopup(playerX, playerY) {
  const container = domCache.scorePopupContainer;
  if (!container) return;
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = '+1';
  popup.style.left = `${playerX + 20}px`;
  popup.style.top = `${playerY - 10}px`;
  container.appendChild(popup);

  if (reducedMotionEnabled) {
    // Skip animation listener; remove after 50ms
    setTimeout(() => {
      removeScorePopup(popup, null);
    }, 50);
  } else {
    // Set up fallback timeout that removes popup if animationend doesn't fire
    let fallbackTimerId = setTimeout(() => {
      fallbackTimerId = null;
      removeScorePopup(popup, null);
    }, 1000);

    // Primary removal via animationend; cancel fallback timer
    popup.addEventListener('animationend', () => {
      removeScorePopup(popup, fallbackTimerId);
    }, { once: true });
  }
}

// === Renderer ===

/**
 * Renders a single data packet as a glowing circle with accent-secondary glow.
 * Uses canvas shadowBlur for the neon glow effect.
 * When reduced motion is enabled, renders with static glow at 70% opacity.
 */
function renderDataPacket(ctx, packet) {
  ctx.beginPath();
  ctx.arc(packet.x, packet.y, packet.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(179, 102, 255, 0.8)';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
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

  // Render canvas background (gradient + scrolling grid) — replaces clearRect
  const gridOffset = calculateGridOffset(bgFrameCount, reducedMotionEnabled);
  renderBackground(ctx, canvasWidth, canvasHeight, gridOffset);

  // Apply screen shake offset via temporary transform
  const shakeOffset = getShakeOffset(screenShake);
  const shakeActive = shakeOffset.offsetX !== 0 || shakeOffset.offsetY !== 0;
  if (shakeActive) {
    ctx.save();
    ctx.translate(shakeOffset.offsetX, shakeOffset.offsetY);
  }

  // Background
  const theme = getCurrentTheme(gameContext.themeSystem);
  if (steeringModeActive) {
    renderNeonMatrixGrid(ctx, canvasWidth, canvasHeight);
  } else {
    const dayNightPos = gameContext.dayNightCycle ? getDayNightPosition(gameContext.dayNightCycle) : null;
    renderParallaxLayers(ctx, gameContext.parallaxLayers, canvasWidth, canvasHeight, dayNightPos, theme.accent);
  }

  if (state === GameState.PLAYING || state === GameState.GAME_OVER || state === GameState.PAUSED) {
    // Pipes with theme color — batched rendering for minimal style changes
    const scaledCapOverhang = CAP_OVERHANG * gameContext.scaleFactor;
    const scaledCapHeight = CAP_HEIGHT * gameContext.scaleFactor;
    const pipeColor = theme.pipe;
    const capColor = pipeColor;
    const highlightColor = calculateHighlightColor(pipeColor);
    renderPipesBatched(ctx, pipes, pipeColor, capColor, highlightColor, canvasHeight, scaledCapOverhang, scaledCapHeight);

    // Data packets (glowing purple circles)
    for (const packet of dataPackets) {
      renderDataPacket(ctx, packet);
    }

    // Magnet pickups (magenta circles with magnet icon)
    for (const pickup of gameContext.magnetPickups) {
      renderMagnetPickup(ctx, pickup);
    }

    // Shield pickups (glowing blue circles with shield icon)
    for (const pickup of gameContext.shieldPickups) {
      renderShieldPickup(ctx, pickup);
    }

    // Particles (collection burst effects)
    renderParticlesPooled(ctx, gameContext.particlePool);

    // Trail_Effect rendering (disabled when reduced motion is enabled)
    // Trail system renders behind the player sprite when active
    if (!reducedMotionEnabled && gameContext.trail) {
      renderTrail(ctx, gameContext.trail);
    }

    // Player sprite (with translucent purple overlay during Steering Mode)
    const graceOpacity = getGraceOpacity(gameContext.gracePeriod);
    const sprW = SPRITE_WIDTH * gameContext.scaleFactor;
    const sprH = SPRITE_HEIGHT * gameContext.scaleFactor;

    // Death animation: render Ghosty at animation position/rotation
    if (gameContext.deathAnimation) {
      const da = gameContext.deathAnimation;
      ctx.save();
      if (spriteLoadFailed) {
        ctx.fillStyle = '#b366ff';
        renderRotatedSprite(ctx, null, da.x, da.y, sprW, sprH, da.rotation);
      } else {
        renderRotatedSprite(ctx, spriteImage, da.x, da.y, sprW, sprH, da.rotation);
      }
      ctx.restore();
    } else {
      const rotationAngle = calculateRotation(player.velocity / gameContext.scaleFactor);
      if (steeringModeActive) {
        // Steering Mode: enhanced glow with pulsing opacity
        const glowElapsed = performance.now();
        const glowOpacity = calculateGlowOpacity(glowElapsed, reducedMotionEnabled);
        ctx.save();
        ctx.shadowColor = '#b366ff';
        ctx.shadowBlur = 25;
        ctx.globalAlpha = glowOpacity * graceOpacity;
        if (spriteLoadFailed) {
          ctx.fillStyle = '#b366ff';
          renderRotatedSprite(ctx, null, player.x, player.y, sprW, sprH, rotationAngle);
        } else {
          renderRotatedSprite(ctx, spriteImage, player.x, player.y, sprW, sprH, rotationAngle);
        }
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'rgba(179, 102, 255, 0.3)';
        renderRotatedSprite(ctx, null, player.x, player.y, sprW, sprH, rotationAngle);
        ctx.restore();
      } else {
        // Normal play: accent-primary glow on Ghosty
        ctx.save();
        ctx.shadowColor = '#b366ff';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = graceOpacity;
        if (spriteLoadFailed) {
          ctx.fillStyle = '#b366ff';
          renderRotatedSprite(ctx, null, player.x, player.y, sprW, sprH, rotationAngle);
        } else {
          renderRotatedSprite(ctx, spriteImage, player.x, player.y, sprW, sprH, rotationAngle);
        }
        ctx.restore();
      }
    }

    // Magnet active effect (purple ring around Ghosty)
    if (gameContext.magnetActive) {
      renderMagnetActiveEffect(ctx, player, gameContext.scaleFactor, 0);
    }

    // Active shield effect (translucent blue circular outline around Ghosty)
    if (gameContext.shieldActive) {
      renderActiveShield(ctx, player, gameContext.scaleFactor);
    }

    // Score displayed via DOM overlay (updated below)
    if (domCache.scoreOverlay) {
      domCache.scoreOverlay.textContent = score;
    }


    // Theme transition white fade overlay
    if (gameContext.themeSystem.transitioning) {
      ctx.save();
      ctx.globalAlpha = (gameContext.themeSystem.transitionTimer / THEME_TRANSITION_DURATION) * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }

    // Death red tint flash overlay (200ms red overlay before spin-and-fall)
    if (gameContext.deathRedTint && gameContext.deathRedTint.active) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }

  // START_SCREEN and GAME_OVER text is handled by DOM overlays — no canvas text needed

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
let chiptuneEngine = null;
let musicEngine = createMusicEngine();
let lastTimestamp = 0;
let ctx = null;
let bgFrameCount = 0;

// DOM element cache — initialized once at startup, reused throughout the session
let domCache = null;

/**
 * Resets the game context to initial playing state.
 * Called when transitioning from START_SCREEN or restarting after GAME_OVER.
 */
function resetGame() {
  const s = gameContext.scaleFactor;
  gameContext.player = { x: 80 * s, y: 250 * s, velocity: 0 };

  // Release all active pipes back to pool
  for (let i = 0; i < gameContext.pipes.length; i++) {
    releasePipe(gameContext.pipePool, gameContext.pipes[i]);
  }
  gameContext.pipes = [];

  gameContext.dataPackets = [];
  gameContext.shieldPickups = [];
  gameContext.shieldActive = false;
  gameContext.shieldTimer = 0;
  gameContext.shieldAbsorbing = false;
  gameContext.magnetPickups = [];
  gameContext.score = 0;
  gameContext.steeringCharge = 0;
  gameContext.steeringModeActive = false;
  gameContext.steeringModeTimer = 0;
  gameContext.frameCount = 0;
  gameContext.currentDifficulty = getBaseDifficulty();
  gameContext.gracePeriod = activateGracePeriod();
  gameContext.screenShake = { active: false, timer: 0, offsetX: 0, offsetY: 0 };

  // Release all active particles back to pool
  for (let i = 0; i < gameContext.particlePool.items.length; i++) {
    if (gameContext.particlePool.activeFlags[i]) {
      releaseToPool(gameContext.particlePool, i);
    }
  }

  gameContext.parallaxLayers = initParallaxLayers(gameContext.canvasWidth, gameContext.canvasHeight);
  gameContext.deathRecap = { active: false, countdown: 0, inputEnabled: true };
  gameContext.transitionLock = false;
  gameContext.deathAnimation = null;
  gameContext.deathRedTint = { active: false, timer: 0 };
  gameContext.magnetActive = false;
  gameContext.magnetTimer = 0;
  gameContext.pipeColor = '#00d400';
  gameContext.dayNightCycle = initDayNightCycle();
  gameContext.themeSystem = initThemeSystem();
  if (gameContext.trail) {
    clearTrailBuffer(gameContext.trail);
  } else {
    gameContext.trail = initTrailBuffer();
  }
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

  // Block gameplay inputs while help overlay is visible
  if (!shouldProcessInput('flap', gameContext.helpOverlayVisible)) return;

  // Block all input during death animation
  if (gameContext.deathAnimation && gameContext.deathAnimation.active) return;

  // Block all input during death red tint flash
  if (gameContext.deathRedTint && gameContext.deathRedTint.active) return;

  if (gameContext.state === GameState.START_SCREEN) {
    // Auto-close help overlay before state transition
    closeHelpOverlayIfOpen();

    // Fade out the start overlay when transitioning to PLAYING
    const startOverlay = domCache.startOverlay;
    setTransitionLock(true);
    fadeOut(startOverlay, FADE_DURATION);
    setTimeout(() => {
      setTransitionLock(false);
    }, FADE_DURATION);

    resetGame();
    gameContext.state = transitionState(gameContext.state, 'INPUT');
    updateScoreOverlayVisibility(gameContext.state);
    updateHelpButtonVisibility(gameContext.state);
    updateAriaLabel(domCache.canvas, gameContext.state, gameContext.score);
    audioManager.startBackgroundHum();
    if (chiptuneEngine) chiptuneEngine.startMusic();
    if (musicEngine.ctx) {
      if (musicEngine.isPlaying) {
        resumeMusic(musicEngine);
      } else {
        startMusic(musicEngine);
      }
    }
  } else if (gameContext.state === GameState.PLAYING) {
    gameContext.player.velocity = FLAP_IMPULSE * gameContext.scaleFactor;
    audioManager.playFlap();
  } else if (gameContext.state === GameState.GAME_OVER) {
    if (!gameContext.deathRecap.inputEnabled) return;

    // Cross-fade: fade out death recap, fade in start overlay
    const deathRecapOverlay = domCache.deathRecapOverlay;
    const startOverlay = domCache.startOverlay;

    setTransitionLock(true);
    fadeOut(deathRecapOverlay, FADE_DURATION);
    fadeIn(startOverlay, FADE_DURATION);
    setTimeout(() => {
      setTransitionLock(false);
    }, FADE_DURATION);

    hideDeathRecap();
    gameContext.state = transitionState(gameContext.state, 'INPUT');
    updateScoreOverlayVisibility(gameContext.state);
    updateHelpButtonVisibility(gameContext.state);
    updateAriaLabel(domCache.canvas, gameContext.state, gameContext.score);
  }
}

/**
 * Handles Steering Mode activation input (Shift / Button).
 * Only activates if PLAYING and charge is full.
 */
function onActivateSteering() {
  // Block steering activation while help overlay is visible
  if (!shouldProcessInput('steering', gameContext.helpOverlayVisible)) return;

  if (gameContext.state === GameState.PLAYING && canActivateSteering(gameContext.steeringCharge, gameContext.steeringModeActive)) {
    gameContext = activateSteeringMode(gameContext);
    audioManager.playSteeringWhoosh();
    const btn = domCache.steeringActivateBtn;
    if (btn) {
      btn.classList.remove('visible');
      btn.classList.remove('btn-reveal');
      btn.style.display = 'none';
    }
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
    // Update death red tint timer (counts down from 200ms)
    if (gameContext.deathRedTint && gameContext.deathRedTint.active) {
      gameContext.deathRedTint.timer -= deltaMs;
      if (gameContext.deathRedTint.timer <= 0) {
        gameContext.deathRedTint.active = false;
        gameContext.deathRedTint.timer = 0;
        // Tint complete — start the spin-and-fall death animation
        gameContext.deathAnimation = initDeathAnimation(gameContext.player, gameContext.player.velocity);
      }
    }

    // Update death animation if active
    if (gameContext.deathAnimation && gameContext.deathAnimation.active) {
      gameContext.deathAnimation = updateDeathAnimation(
        gameContext.deathAnimation,
        deltaMs,
        gameContext.canvasHeight,
        gameContext.scaleFactor
      );
      // When animation completes, trigger death recap overlay fade-in
      if (!gameContext.deathAnimation.active) {
        const deathRecapOverlay = domCache.deathRecapOverlay;
        fadeIn(deathRecapOverlay, DEATH_RECAP_FADE_IN);
      }
    }
    updateDeathRecap(deltaMs);
    return;
  }

  if (gameContext.state !== GameState.PLAYING) return;

  // Increment background grid frame counter for scrolling animation
  bgFrameCount++;

  // Get current scale factor for physics calculations
  const s = gameContext.scaleFactor;
  const canvasW = gameContext.canvasWidth;
  const canvasH = gameContext.canvasHeight;

  // Update difficulty based on current score
  gameContext.currentDifficulty = getDifficultyParams(gameContext.score);

  // Player movement: apply scaled gravity and terminal velocity (frame-rate independent)
  const frameScalePhysics = deltaMs / 16.67;
  const scaledGravity = GRAVITY * s * frameScalePhysics;
  const scaledTerminalVelocity = TERMINAL_VELOCITY * s;

  // During Phase Mode, normal physics apply (player keeps manual control)
  // Pipe collisions are already disabled via isInvincible check
  const newVelocity = Math.min(gameContext.player.velocity + scaledGravity, scaledTerminalVelocity);
  gameContext.player.velocity = newVelocity;
  gameContext.player.y = gameContext.player.y + newVelocity * frameScalePhysics;

  // Trail_Effect: sample player position (disabled when reduced motion is enabled)
  if (!reducedMotionEnabled && gameContext.trail) {
    const sprW = SPRITE_WIDTH * s;
    const sprH = SPRITE_HEIGHT * s;
    const centerX = gameContext.player.x + sprW / 2;
    const centerY = gameContext.player.y + sprH / 2;
    sampleTrailPosition(gameContext.trail, centerX, centerY);
  }

  // Update steering mode timer and depletion
  gameContext = updateSteeringMode(gameContext, deltaMs);


  // Update magnet timer: decrement and deactivate when expired
  if (gameContext.magnetActive) {
    gameContext.magnetTimer -= deltaMs;
    if (gameContext.magnetTimer <= 0) {
      gameContext.magnetTimer = 0;
      gameContext.magnetActive = false;
    }
  }

  // Update grace period timer
  gameContext.gracePeriod = updateGracePeriod(gameContext.gracePeriod, deltaMs);

  // Update parallax background layers
  gameContext.parallaxLayers = updateParallaxLayers(gameContext.parallaxLayers, gameContext.currentDifficulty.pipeSpeed * s, deltaMs);

  // Update matrix grid columns if steering mode is active (frame-rate independent)
  if (gameContext.steeringModeActive) {
    updateMatrixGrid(deltaMs, canvasH);
  }

  // Update Day/Night cycle (freezes when paused; paused is already handled above)
  gameContext.dayNightCycle = updateDayNightCycle(gameContext.dayNightCycle, deltaMs, gameContext.paused);

  // Update particles using pool (in-place mutation, release dead particles)
  updateParticlesPooled(gameContext.particlePool, deltaMs);

  // Move pipes in-place using current difficulty speed scaled (frame-rate independent)
  const frameScale = deltaMs / 16.67;
  const currentSpeed = gameContext.currentDifficulty.pipeSpeed * s * frameScale;
  for (let i = 0; i < gameContext.pipes.length; i++) {
    gameContext.pipes[i].x -= currentSpeed;
  }

  // Spawn new pipes based on frame count (acquire from pool)
  gameContext.frameCount++;
  if (gameContext.frameCount >= PIPE_INTERVAL) {
    gameContext.frameCount = 0;
    const pooledPipe = acquirePipe(gameContext.pipePool);
    if (pooledPipe !== null) {
      // Configure the acquired pipe with scaled gap properties
      const gap = gameContext.currentDifficulty.pipeGap * s;
      const minGapTop = MIN_GAP_Y * s;
      const maxGapTop = canvasH - gap - MAX_GAP_Y_OFFSET * s;
      const gapTop = Math.random() * (maxGapTop - minGapTop) + minGapTop;
      pooledPipe.x = canvasW;
      pooledPipe.gapTop = gapTop;
      pooledPipe.gapBottom = gapTop + gap;
      pooledPipe.width = PIPE_WIDTH * s;
      pooledPipe.scored = false;
      gameContext.pipes.push(pooledPipe);

      // Spawn data packet with 70% chance per new pipe
      if (Math.random() < 0.7) {
        const packet = spawnDataPacket(pooledPipe);
        packet.radius = DATA_PACKET_RADIUS * s;
        gameContext.dataPackets.push(packet);
      }

      // Spawn shield pickup with 10% chance per new pipe
      const shieldPickup = spawnShieldPickup(pooledPipe);
      if (shieldPickup !== null) {
        shieldPickup.radius = SHIELD_RADIUS * s;
        gameContext.shieldPickups.push(shieldPickup);
      }

      // Spawn magnet pickup with 8% chance per new pipe
      const magnetPickup = spawnMagnetPickup(pooledPipe);
      if (magnetPickup !== null) {
        magnetPickup.radius = MAGNET_RADIUS * s;
        gameContext.magnetPickups.push(magnetPickup);
      }
    }
    // If pool exhausted (null), skip spawn gracefully
  }

  // Remove off-screen pipes (release back to pool)
  {
    const pipes = gameContext.pipes;
    let writeIdx = 0;
    for (let i = 0; i < pipes.length; i++) {
      const pipe = pipes[i];
      if (pipe.x + pipe.width < 0) {
        releasePipe(gameContext.pipePool, pipe);
      } else {
        pipes[writeIdx] = pipe;
        writeIdx++;
      }
    }
    pipes.length = writeIdx;
  }

  // Move and clean up data packets in-place using current difficulty speed
  {
    let writeIdx = 0;
    for (let i = 0; i < gameContext.dataPackets.length; i++) {
      const packet = gameContext.dataPackets[i];
      packet.x -= currentSpeed;
      if (packet.x + packet.radius > 0) {
        gameContext.dataPackets[writeIdx] = packet;
        writeIdx++;
      }
    }
    gameContext.dataPackets.length = writeIdx;
  }

  // Move shield pickups in-place and remove off-screen ones
  {
    let writeIdx = 0;
    for (let i = 0; i < gameContext.shieldPickups.length; i++) {
      const pickup = gameContext.shieldPickups[i];
      pickup.x -= currentSpeed;
      if (pickup.x + pickup.radius > 0) {
        gameContext.shieldPickups[writeIdx] = pickup;
        writeIdx++;
      }
    }
    gameContext.shieldPickups.length = writeIdx;
  }

  // Move magnet pickups in-place and remove off-screen ones
  {
    let writeIdx = 0;
    for (let i = 0; i < gameContext.magnetPickups.length; i++) {
      const pickup = gameContext.magnetPickups[i];
      pickup.x -= currentSpeed;
      if (pickup.x + pickup.radius > 0) {
        gameContext.magnetPickups[writeIdx] = pickup;
        writeIdx++;
      }
    }
    gameContext.magnetPickups.length = writeIdx;
  }


  // Collect data packets with scaled player hitbox
  const scaledSpriteW = SPRITE_WIDTH * s;
  const scaledSpriteH = SPRITE_HEIGHT * s;
  const padding = 4 * s;
  const playerRect = {
    x: gameContext.player.x + padding,
    y: gameContext.player.y + padding,
    width: scaledSpriteW - padding * 2,
    height: scaledSpriteH - padding * 2
  };

  // Check magnet pickup collisions: activate on collection, remove collected pickups
  {
    let writeIdx = 0;
    for (let i = 0; i < gameContext.magnetPickups.length; i++) {
      const pickup = gameContext.magnetPickups[i];
      if (checkMagnetPickupCollision(playerRect, pickup)) {
        // Spawn particle burst on collection (magenta for Magnet)
        if (!reducedMotionEnabled) {
          const count = Math.floor(Math.random() * 5) + 8;
          spawnParticlesPooled(gameContext.particlePool, pickup.x, pickup.y, count, { color: '#ff00ff', maxLife: 500 });
        }
        // Activate or reset magnet timer
        gameContext = activateMagnet(gameContext);
      } else {
        gameContext.magnetPickups[writeIdx] = pickup;
        writeIdx++;
      }
    }
    gameContext.magnetPickups.length = writeIdx;
  }

  // Attract data packets toward Ghosty when magnet is active (before collection check)
  if (gameContext.magnetActive) {
    const playerCenter = {
      x: gameContext.player.x + scaledSpriteW / 2,
      y: gameContext.player.y + scaledSpriteH / 2
    };
    attractDataPackets(gameContext.dataPackets, playerCenter, deltaMs, MAGNET_ATTRACT_RADIUS * s, MAGNET_ATTRACT_SPEED * s);
  }

  const { collected, remaining } = collectDataPackets(playerRect, gameContext.dataPackets);
  gameContext.dataPackets = remaining;

  if (collected.length > 0) {
    gameContext.steeringCharge = addSteeringCharge(gameContext.steeringCharge, collected.length);
    updateChargeBar(gameContext.steeringCharge);

    // Spawn particles at each collected packet's position using pool
    // Skip particle effects when reduced motion is enabled (accessibility)
    if (!reducedMotionEnabled) {
      for (const packet of collected) {
        const count = Math.floor(Math.random() * 5) + 8; // 8-12 particles
        spawnParticlesPooled(gameContext.particlePool, packet.x, packet.y, count, { color: '#b366ff', maxLife: 500 });
      }
    }
  }

  // Show/hide activation button based on charge readiness
  const btn = domCache.steeringActivateBtn;
  if (btn) {
    if (canActivateSteering(gameContext.steeringCharge, gameContext.steeringModeActive)) {
      if (!btn.classList.contains('btn-reveal')) {
        btn.style.display = 'block';
        btn.classList.add('btn-reveal');
        // Force reflow then add .visible for transition
        void btn.offsetHeight;
        btn.classList.add('visible');
      }
    } else {
      if (btn.classList.contains('btn-reveal')) {
        btn.classList.remove('visible');
        btn.classList.remove('btn-reveal');
        btn.style.display = 'none';
      }
    }
  }


  // Shield pickup collision: check if player collides with any shield pickup
  {
    const pickups = gameContext.shieldPickups;
    let writeIdx = 0;
    for (let i = 0; i < pickups.length; i++) {
      if (checkShieldPickupCollision(playerRect, pickups[i])) {
        // Spawn particle burst on collection (blue for Shield)
        if (!reducedMotionEnabled) {
          const count = Math.floor(Math.random() * 5) + 8;
          spawnParticlesPooled(gameContext.particlePool, pickups[i].x, pickups[i].y, count, { color: '#0088ff', maxLife: 500 });
        }
        // Activate or reset shield timer
        gameContext = activateShield(gameContext);
      } else {
        pickups[writeIdx] = pickups[i];
        writeIdx++;
      }
    }
    pickups.length = writeIdx;
  }

  // Update shield timer: decrement by deltaMs, deactivate when expired
  if (gameContext.shieldActive) {
    gameContext.shieldTimer -= deltaMs;
    if (gameContext.shieldTimer <= 0) {
      gameContext.shieldActive = false;
      gameContext.shieldTimer = 0;
    }
  }

  // Scoring: check if player passed any pipe
  for (const pipe of gameContext.pipes) {
    if (shouldIncrementScore(gameContext.player.x, pipe)) {
      pipe.scored = true;
      gameContext.score++;
      audioManager.playScorePing();
      createScorePopup(gameContext.player.x, gameContext.player.y);
      updateAriaLabel(domCache.canvas, gameContext.state, gameContext.score);

      // Score animation: pulse scale + text-shadow intensification
      const scoreEl = domCache.scoreOverlay;
      if (scoreEl) {
        triggerScorePulse(scoreEl);
        scoreEl.style.textShadow = '0 0 10px var(--accent-secondary), 0 0 20px rgba(0,229,255,0.8)';
        setTimeout(() => {
          scoreEl.style.textShadow = '0 0 10px var(--accent-secondary), 0 0 20px rgba(0,229,255,0.5)';
        }, 300);
      }
    }
  }

  // Update theme system based on current score
  gameContext.themeSystem = updateThemeSystem(gameContext.themeSystem, gameContext.score, deltaMs);

  // Collision detection with scaled dimensions
  const isInvincible = gameContext.steeringModeActive || isGracePeriodActive(gameContext.gracePeriod) || gameContext.shieldActive;
  const scaledCapOverhang = CAP_OVERHANG * s;
  const scaledCapHeight = CAP_HEIGHT * s;

  // Boundary collision (scaled canvas)
  let collision = playerRect.y <= 0 || playerRect.y + playerRect.height >= canvasH;

  // Pipe collision (if not invincible)
  let pipeCollision = false;
  if (!collision && !isInvincible) {
    for (const pipe of gameContext.pipes) {
      const topPipeRect = { x: pipe.x, y: 0, width: pipe.width, height: pipe.gapTop };
      const bottomPipeRect = { x: pipe.x, y: pipe.gapBottom, width: pipe.width, height: canvasH - pipe.gapBottom };
      const topCapRect = {
        x: pipe.x - scaledCapOverhang,
        y: pipe.gapTop - scaledCapHeight,
        width: pipe.width + scaledCapOverhang * 2,
        height: scaledCapHeight
      };
      const bottomCapRect = {
        x: pipe.x - scaledCapOverhang,
        y: pipe.gapBottom,
        width: pipe.width + scaledCapOverhang * 2,
        height: scaledCapHeight
      };

      if (rectsOverlap(playerRect, topPipeRect) || rectsOverlap(playerRect, bottomPipeRect) ||
          rectsOverlap(playerRect, topCapRect) || rectsOverlap(playerRect, bottomCapRect)) {
        pipeCollision = true;
        break;
      }
    }
  }

  // Shield: consume shield when overlapping a pipe while invincible due to shield
  if (gameContext.shieldActive && !gameContext.steeringModeActive && !isGracePeriodActive(gameContext.gracePeriod)) {
    // Check if currently overlapping any pipe
    let overlappingPipe = false;
    for (const pipe of gameContext.pipes) {
      const topPipeRect = { x: pipe.x, y: 0, width: pipe.width, height: pipe.gapTop };
      const bottomPipeRect = { x: pipe.x, y: pipe.gapBottom, width: pipe.width, height: canvasH - pipe.gapBottom };
      const topCapRect = { x: pipe.x - scaledCapOverhang, y: pipe.gapTop - scaledCapHeight, width: pipe.width + scaledCapOverhang * 2, height: scaledCapHeight };
      const bottomCapRect = { x: pipe.x - scaledCapOverhang, y: pipe.gapBottom, width: pipe.width + scaledCapOverhang * 2, height: scaledCapHeight };
      if (rectsOverlap(playerRect, topPipeRect) || rectsOverlap(playerRect, bottomPipeRect) ||
          rectsOverlap(playerRect, topCapRect) || rectsOverlap(playerRect, bottomCapRect)) {
        overlappingPipe = true;
        break;
      }
    }
    // If overlapping a pipe, mark shield as absorbing (it will deactivate once player clears the pipe)
    if (overlappingPipe) {
      gameContext.shieldAbsorbing = true;
    } else if (gameContext.shieldAbsorbing) {
      // Player has cleared the pipe — deactivate shield
      gameContext.shieldActive = false;
      gameContext.shieldTimer = 0;
      gameContext.shieldAbsorbing = false;
    }
  }

  // Legacy shield absorption fallback (should not be needed with new logic)
  if (pipeCollision) {
    collision = true;
  }
  if (collision) {
    // Auto-close help overlay before state transition
    closeHelpOverlayIfOpen();
    gameContext.state = transitionState(gameContext.state, 'COLLISION');
    updateScoreOverlayVisibility(gameContext.state);
    updateHelpButtonVisibility(gameContext.state);
    updateAriaLabel(domCache.canvas, gameContext.state, gameContext.score);
    // Clear trail buffer on state transition away from PLAYING
    if (gameContext.trail) {
      clearTrailBuffer(gameContext.trail);
    }
    // Skip screen shake when reduced motion is enabled (accessibility)
    if (!reducedMotionEnabled) {
      gameContext.screenShake = activateScreenShake();
    }
    audioManager.playCrash();
    audioManager.stopBackgroundHum();
    if (chiptuneEngine) chiptuneEngine.stopMusic();
    if (musicEngine.ctx) stopMusic(musicEngine);
    const previousHighScore = gameContext.highScore;
    gameContext.highScore = saveHighScore(gameContext.score, gameContext.highScore);
    const isNewHighScore = gameContext.score > 0 && gameContext.score > previousHighScore;
    showDeathRecap(gameContext.score, gameContext.highScore, isNewHighScore);

    // Death_Animation: skip when reduced motion is enabled (accessibility)
    if (!reducedMotionEnabled) {
      // Activate red tint flash before spin-and-fall
      gameContext.deathRedTint = { active: true, timer: DEATH_RED_TINT_DURATION };
      // Death animation will be initiated after tint completes (handled in update loop)
      gameContext.deathAnimation = null;
      // Death recap fade-in is deferred until animation completes (handled in update loop)
    } else {
      // No animation — immediately fade in the death recap overlay
      gameContext.deathRedTint = { active: false, timer: 0 };
      const deathRecapOverlay = domCache.deathRecapOverlay;
      fadeIn(deathRecapOverlay, DEATH_RECAP_FADE_IN);
    }

  }
}

/**
 * Main game loop driven by requestAnimationFrame.
 * Calculates delta time and orchestrates update + render each frame.
 */
function gameLoop(timestamp) {
  // Guard against first-frame spike: skip the first frame where lastTimestamp is 0
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp;
    requestAnimationFrame(gameLoop);
    return;
  }

  const deltaMs = Math.min(timestamp - lastTimestamp, 50); // Cap at 50ms to prevent physics explosions
  lastTimestamp = timestamp;

  update(deltaMs);
  render(ctx, gameContext, spriteImage, gameContext.canvasWidth, gameContext.canvasHeight);
  requestAnimationFrame(gameLoop);
}

/**
 * Initializes the game: sets up canvas, loads assets, initializes subsystems,
 * and starts the game loop.
 */
function initGame() {
  const canvas = document.getElementById('game-canvas');

  // Initialize DOM cache — all element references queried once and reused
  domCache = {
    canvas: canvas,
    scorePopupContainer: document.getElementById('score-popup-container'),
    startOverlay: document.getElementById('start-overlay'),
    pauseOverlay: document.getElementById('pause-overlay'),
    deathRecapOverlay: document.getElementById('death-recap-overlay'),
    deathRecapScore: document.getElementById('death-recap-score'),
    deathRecapHighscore: document.getElementById('death-recap-highscore'),
    deathRecapNewHigh: document.getElementById('death-recap-new-high'),
    deathRecapCountdown: document.getElementById('death-recap-countdown'),
    deathRecapRestart: document.getElementById('death-recap-restart'),
    steeringChargeBar: document.getElementById('steering-charge-bar'),
    steeringChargeContainer: document.getElementById('steering-charge-container'),
    steeringActivateBtn: document.getElementById('steering-activate-btn'),
    scoreOverlay: document.getElementById('score-overlay'),
    helpBtn: document.getElementById('help-btn'),
    helpOverlay: document.getElementById('help-overlay')
  };

  // Calculate responsive canvas dimensions and apply
  const dims = calculateCanvasDimensions(window.innerWidth, window.innerHeight);
  applyCanvasResize(canvas, dims.width, dims.height);
  ctx = canvas.getContext('2d');

  const scaleFactor = getScaleFactor(dims.width);

  // Check reduced motion preference and listen for changes
  checkReducedMotion();

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

  // Create chiptune music engine (shares AudioContext approach, separate system)
  try {
    const musicAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    chiptuneEngine = createChiptuneEngine(musicAudioCtx);

    // Handle AudioContext autoplay policy: resume on first user interaction
    const resumeAudioContext = () => {
      if (musicAudioCtx && musicAudioCtx.state === 'suspended') {
        musicAudioCtx.resume();
      }
      // Initialize the ambient music engine AudioContext on first user gesture
      if (!musicEngine.ctx) {
        try {
          initMusicContext(musicEngine);
        } catch (e) {
          // AudioContext init failed — ambient music disabled silently
        }
      }
      document.removeEventListener('click', resumeAudioContext);
      document.removeEventListener('keydown', resumeAudioContext);
      document.removeEventListener('touchstart', resumeAudioContext);
    };
    document.addEventListener('click', resumeAudioContext);
    document.addEventListener('keydown', resumeAudioContext);
    document.addEventListener('touchstart', resumeAudioContext);
  } catch (e) {
    // AudioContext unavailable — game continues without music
    chiptuneEngine = null;
  }

  // Fallback: if chiptune engine failed, still set up user gesture listener for ambient music
  if (!chiptuneEngine && !musicEngine.ctx) {
    const initMusicOnGesture = () => {
      if (!musicEngine.ctx) {
        try {
          initMusicContext(musicEngine);
        } catch (e) {
          // AudioContext init failed — ambient music disabled silently
        }
      }
      document.removeEventListener('click', initMusicOnGesture);
      document.removeEventListener('keydown', initMusicOnGesture);
      document.removeEventListener('touchstart', initMusicOnGesture);
    };
    document.addEventListener('click', initMusicOnGesture);
    document.addEventListener('keydown', initMusicOnGesture);
    document.addEventListener('touchstart', initMusicOnGesture);
  }

  // Initialize matrix grid for steering mode background
  initMatrixGrid(dims.width, dims.height);

  // Pre-allocate object pools before first frame
  const particlePool = createParticlePool(PARTICLE_POOL_SIZE);
  const pipePool = createPipePool(PIPE_POOL_SIZE);

  // Initialize game context with scale factor and dynamic canvas dimensions
  gameContext = {
    state: GameState.START_SCREEN,
    player: { x: 80 * scaleFactor, y: 250 * scaleFactor, velocity: 0 },
    pipes: [],
    dataPackets: [],
    shieldPickups: [],
    shieldActive: false,
    shieldTimer: 0,
    shieldAbsorbing: false,
    magnetPickups: [],
    score: 0,
    highScore: highScore,
    frameCount: 0,
    steeringCharge: 0,
    steeringModeActive: false,
    steeringModeTimer: 0,
    paused: false,
    gracePeriod: { active: false, timer: 0 },
    screenShake: { active: false, timer: 0, offsetX: 0, offsetY: 0 },
    parallaxLayers: initParallaxLayers(dims.width, dims.height),
    deathRecap: { active: false, countdown: 0, inputEnabled: true },
    transitionLock: false,
    currentDifficulty: { pipeSpeed: PIPE_SPEED, pipeGap: PIPE_GAP },
    magnetActive: false,
    magnetTimer: 0,
    pipeColor: '#00d400',
    particlePool: particlePool,
    pipePool: pipePool,
    scaleFactor: scaleFactor,
    canvasWidth: dims.width,
    canvasHeight: dims.height,
    dayNightCycle: initDayNightCycle(),
    trail: initTrailBuffer(),
    themeSystem: initThemeSystem(),
    deathAnimation: null,
    deathRedTint: { active: false, timer: 0 },
    helpOverlayVisible: false,
    helpOverlayPreviousState: null
  };

  // Update charge bar to initial state
  updateChargeBar(0);

  // Setup input handlers
  setupInputHandlers(canvas, onInput, onActivateSteering);
  setupTouchHandlers(canvas, onInput);

  // Set initial help button visibility (visible on START_SCREEN)
  updateHelpButtonVisibility(gameContext.state);

  // Setup responsive resize handler to update scale factor and canvas dimensions
  setupResizeHandler(canvas, (newWidth, newHeight) => {
    gameContext.scaleFactor = getScaleFactor(newWidth);
    gameContext.canvasWidth = newWidth;
    gameContext.canvasHeight = newHeight;
    initMatrixGrid(newWidth, newHeight);
    gameContext.parallaxLayers = initParallaxLayers(newWidth, newHeight);
  });

  // Start game loop
  requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', initGame);

// === Service Worker Registration ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
