// === Physics & Game Configuration Constants ===
const CANVAS_WIDTH = 400;        // pixels
const CANVAS_HEIGHT = 600;       // pixels
const GRAVITY = 980;             // px/s² (positive = downward acceleration)
const TERMINAL_VELOCITY = 500;   // px/s (maximum downward speed)
const FLAP_IMPULSE = -300;       // px/s (negative = upward velocity impulse)

// === Canvas Setup ===
const canvas = document.getElementById('game-canvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

// === State Machine ===
const GAME_STATES = {
  START_SCREEN: 'START_SCREEN',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

const EVENTS = {
  USER_INPUT: 'USER_INPUT',
  COLLISION: 'COLLISION'
};

/**
 * Pure state transition function.
 * Returns the next state based on current state and event.
 * Returns current state unchanged for undefined combinations.
 */
function transitionState(currentState, event) {
  if (currentState === GAME_STATES.START_SCREEN && event === EVENTS.USER_INPUT) {
    return GAME_STATES.PLAYING;
  }
  if (currentState === GAME_STATES.PLAYING && event === EVENTS.COLLISION) {
    return GAME_STATES.GAME_OVER;
  }
  if (currentState === GAME_STATES.GAME_OVER && event === EVENTS.USER_INPUT) {
    return GAME_STATES.START_SCREEN;
  }
  return currentState;
}

// === Game State Initialization ===
let currentState = GAME_STATES.START_SCREEN;

// === Collision Detection (pure) ===
/**
 * Returns true if two axis-aligned bounding boxes overlap.
 * Each rect has shape: { x, y, width, height } where (x, y) is the top-left corner.
 * Pure function — no side effects, no global state references.
 */
function rectsOverlap(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

// === Entity Rendering (pure) ===

/**
 * Renders Ghosty as a purple rounded rectangle.
 * Pure function — draws to ctx without mutating the ghosty state object.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context
 * @param {{ x: number, y: number, width: number, height: number }} ghosty - Position and dimensions
 */
function renderGhosty(ctx, ghosty) {
  ctx.fillStyle = '#9d00ff';
  ctx.beginPath();
  ctx.roundRect(ghosty.x, ghosty.y, ghosty.width, ghosty.height, 8);
  ctx.fill();
}

/**
 * Renders a pipe pair as two solid green rectangles.
 * Top pipe extends from y=0 down to the top edge of the gap.
 * Bottom pipe extends from the bottom edge of the gap down to the canvas floor.
 * Pure function — does not mutate the pipe object or any external state.
 *
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context
 * @param {{ x: number, gapY: number, gapHeight: number, width: number }} pipe - Pipe state
 */
function renderPipePair(ctx, pipe) {
  const topPipeHeight = pipe.gapY - pipe.gapHeight / 2;
  const bottomPipeY = pipe.gapY + pipe.gapHeight / 2;
  const bottomPipeHeight = CANVAS_HEIGHT - bottomPipeY;

  ctx.fillStyle = '#00d400';

  // Top pipe: from top of canvas down to gap opening
  ctx.fillRect(pipe.x, 0, pipe.width, topPipeHeight);

  // Bottom pipe: from gap closing down to canvas bottom
  ctx.fillRect(pipe.x, bottomPipeY, pipe.width, bottomPipeHeight);
}

/**
 * Renders a Data Packet as a glowing purple circle.
 * Pure function — draws to ctx without mutating the packet object.
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {{x: number, y: number, radius: number}} packet - Data Packet state
 */
function renderDataPacket(ctx, packet) {
  ctx.save();
  ctx.shadowColor = '#b026ff';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#b026ff';
  ctx.beginPath();
  ctx.arc(packet.x, packet.y, packet.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// === Procedural Web Audio API Placeholders ===

/**
 * Plays a jump sound effect.
 * Intended: square wave, 400-600Hz frequency range, quick attack/decay gain envelope.
 * Currently a placeholder — oscillator is NOT started.
 */
function playJumpSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    // Do NOT call oscillator.start()
  } catch (e) {
    // Silently handle — audio is non-critical
  }
}

/**
 * Plays a score sound effect.
 * Intended: sine wave, 800-1200Hz frequency range, short blip gain envelope.
 * Currently a placeholder — oscillator is NOT started.
 */
function playScoreSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    // Do NOT call oscillator.start()
  } catch (e) {
    // Silently handle — audio is non-critical
  }
}

/**
 * Plays a crash sound effect.
 * Intended: sawtooth wave, 100-200Hz frequency range, slow decay gain envelope.
 * Currently a placeholder — oscillator is NOT started.
 */
function playCrashSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    // Do NOT call oscillator.start()
  } catch (e) {
    // Silently handle — audio is non-critical
  }
}

/**
 * Plays a power-up collection sound effect.
 * Intended: triangle wave, 600-1000Hz frequency range, rising sweep gain envelope.
 * Currently a placeholder — oscillator is NOT started.
 */
function playPowerUpSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    // Do NOT call oscillator.start()
  } catch (e) {
    // Silently handle — audio is non-critical
  }
}

// === Player Entity State ===
let ghosty = { x: 80, y: 250, width: 34, height: 34, velocity: 0 };

// === Input Handlers ===

/**
 * Unified input handler called by both keyboard and mouse listeners.
 * Dispatches action based on the current game state:
 * - START_SCREEN: transitions to PLAYING
 * - PLAYING: applies FLAP_IMPULSE to ghosty's velocity
 * - GAME_OVER: transitions to START_SCREEN
 */
function handleInput() {
  if (currentState === GAME_STATES.START_SCREEN) {
    currentState = transitionState(currentState, EVENTS.USER_INPUT);
  } else if (currentState === GAME_STATES.PLAYING) {
    ghosty.velocity = FLAP_IMPULSE;
  } else if (currentState === GAME_STATES.GAME_OVER) {
    currentState = transitionState(currentState, EVENTS.USER_INPUT);
  }
}

// Keyboard listener: detect Spacebar, prevent default scroll
document.addEventListener('keydown', function (e) {
  if (e.code === 'Space') {
    e.preventDefault();
    handleInput();
  }
});

// Mouse/touch listener: click on canvas triggers input
canvas.addEventListener('click', function () {
  handleInput();
});

// === Update Function ===

/**
 * Updates all game state for the current frame.
 * Applies gravity, clamps to terminal velocity, updates position.
 * Only mutates state when in PLAYING state. No draw calls.
 * @param {number} dt - Delta time in seconds
 */
function update(dt) {
  if (currentState !== GAME_STATES.PLAYING) {
    return;
  }

  ghosty.velocity += GRAVITY * dt;
  ghosty.velocity = Math.min(ghosty.velocity, TERMINAL_VELOCITY);
  ghosty.y += ghosty.velocity * dt;
}

// === Demo Entities for Render ===
const demoPipe = { x: 280, gapY: 300, gapHeight: 150, width: 52 };
const demoPacket = { x: 306, y: 300, radius: 10 };

// === Main Render Function ===

/**
 * Renders the current frame. Clears canvas, fills background,
 * draws demo entities, and toggles overlay visibility per game state.
 * Does NOT mutate any game state.
 */
function render() {
  // 1. Clear the entire canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Fill background with dark theme color
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 3. Render entities (Ghosty always visible, demo pipe and packet)
  renderGhosty(ctx, ghosty);
  renderPipePair(ctx, demoPipe);
  renderDataPacket(ctx, demoPacket);

  // 4. Toggle overlay visibility based on current game state
  const startOverlay = document.getElementById('start-overlay');
  const scoreOverlay = document.getElementById('score-overlay');
  const gameoverOverlay = document.getElementById('gameover-overlay');

  if (currentState === GAME_STATES.START_SCREEN) {
    startOverlay.style.display = 'flex';
    scoreOverlay.style.display = 'none';
    gameoverOverlay.style.display = 'none';
  } else if (currentState === GAME_STATES.PLAYING) {
    startOverlay.style.display = 'none';
    scoreOverlay.style.display = 'flex';
    gameoverOverlay.style.display = 'none';
  } else if (currentState === GAME_STATES.GAME_OVER) {
    startOverlay.style.display = 'none';
    scoreOverlay.style.display = 'none';
    gameoverOverlay.style.display = 'flex';
  }
}
