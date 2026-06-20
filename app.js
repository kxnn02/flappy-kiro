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
