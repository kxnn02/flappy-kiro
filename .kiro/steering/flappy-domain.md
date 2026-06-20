# Flappy Kiro Domain Rules

Domain-specific rules, entities, and aesthetics for the Flappy Kiro game.

## Core Entities

- The player character is named **Ghosty**. Use this name in code comments, variable prefixes (`player`, `ghosty`), and UI text.
- Vertical obstacles are named **Pipes**. They consist of a top pipe and bottom pipe with a gap between them.
- Collectable power-up items are named **Data Packets**. They appear as glowing circles within pipe gaps.
- Use consistent naming throughout the codebase — do NOT mix terms (e.g., "bird", "obstacle", "orb").

## Visual Theme

- Enforce a retro, dark-themed aesthetic. The canvas background MUST use a dark color (e.g., `#1a1a2e`).
- Ghosty MUST use purple neon accents. Render with the `assets/ghosty.png` sprite; fallback to a purple circle or rounded rectangle.
- Data Packets MUST be rendered as glowing purple circles with a neon glow effect (`shadowColor`, `shadowBlur`).
- Pipes MUST be rendered as solid green rectangles (`#00d400` or similar bright green).
- During Steering Mode, the background switches to a neon matrix grid (dark purple base with green grid lines and falling characters).

## Flappy Mechanics

- Ghosty MUST fall due to constant gravity applied every frame. Gravity increases downward velocity additively.
- Ghosty rises ONLY through an applied upward velocity impulse (flap). There is no "hold to float" or gradual lift.
- Downward velocity MUST be capped at a terminal velocity constant to prevent unreasonably fast falling.
- A flap sets the velocity to a fixed negative (upward) value, regardless of current velocity.
- Ghosty's horizontal position is fixed. Only vertical movement is player-controlled.

## Power-Up Logic: Steering Mode

- Collecting a Data Packet adds 25% to the Steering Charge meter. The meter caps at 100%.
- When the meter reaches 100%, the player can activate Steering Mode via the Shift key or an on-screen button.
- Steering Mode lasts exactly 5 seconds and provides:
  - **Autopilot**: Ghosty's Y-velocity is automatically adjusted to navigate through upcoming pipe gaps. Manual flap input is ignored.
  - **Invincibility**: Pipe collisions are disabled. Ghosty passes through pipes without triggering Game Over.
- The charge meter drains linearly from 100% to 0% over the 5-second duration.
- When the meter reaches 0%, Steering Mode deactivates and normal physics, controls, and collision resume.
- Ground and ceiling collisions remain active during Steering Mode.

## Collision Triggers

- Intersecting with a Pipe (top or bottom rectangle) triggers an immediate Game Over state transition.
- Intersecting with the canvas ceiling (y ≤ 0) triggers an immediate Game Over state transition.
- Intersecting with the canvas ground (y + height ≥ canvas height) triggers an immediate Game Over state transition.
- Intersecting with a Data Packet triggers a collection event: the packet is removed and the Steering Charge meter is updated.
- During Steering Mode, pipe collisions are suppressed but boundary collisions (ceiling/ground) remain lethal.
