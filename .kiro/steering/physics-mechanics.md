# Physics & Mechanics Standards

Mandatory rules for building game physics and mechanics in vanilla JavaScript in this workspace.

## Time Integration

- All velocity and position calculations MUST incorporate delta time (dt) to ensure frame-rate-independent movement.
- dt MUST be computed as the difference between the current and previous `requestAnimationFrame` timestamp, converted to seconds or milliseconds consistently throughout.
- Never assume a fixed frame rate. Movement formulas must be `position += velocity * dt`, not `position += velocity`.

## Collision Logic

- Collision detection MUST be implemented as explicit, isolated pure functions (e.g., `rectsOverlap(a, b)`, `circleRectOverlap(circle, rect)`).
- Use AABB (axis-aligned bounding box) for rectangular entities and circle-based detection for circular entities.
- Collision detection (does it overlap?) MUST be separated from collision response (what happens on overlap?).
- Detection functions return a boolean. Response logic lives in a separate function or the game update step.

## State Separation

- The physics update loop MUST finish calculating ALL entity positions and velocities before the render loop executes.
- Do NOT interleave state mutations with draw calls. The frame cycle is strictly: `update(dt)` → `render()`.
- Entity state (position, velocity, flags) MUST be fully resolved before any `ctx.fillRect`, `ctx.drawImage`, or other canvas call.

## Physics Constants

- All physical properties MUST be defined as named constants grouped at the top of the script.
- Required constants (adjust values per game): `GRAVITY`, `TERMINAL_VELOCITY`, `FLAP_IMPULSE` (or `JUMP_FORCE`), and any friction or drag values.
- Do NOT use magic numbers inline. Every physics value must reference a named constant.
- Constants MUST use UPPER_SNAKE_CASE naming.

## Native Math

- Do NOT use external physics libraries (Matter.js, Planck.js, Box2D, etc.).
- Build all momentum, gravity, acceleration, and vector calculations using native JavaScript `Math` methods (`Math.min`, `Math.max`, `Math.abs`, `Math.sqrt`, `Math.atan2`, etc.).
- Keep calculations simple and readable. Prefer explicit arithmetic over abstracted vector classes unless complexity demands it.
- Clamp values explicitly with `Math.min` / `Math.max` rather than conditional branches where possible.
