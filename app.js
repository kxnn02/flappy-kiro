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
