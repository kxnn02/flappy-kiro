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
