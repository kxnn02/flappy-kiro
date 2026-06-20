# Game Development Standards

Mandatory architectural rules for vanilla JavaScript browser games in this workspace.

## File Structure

- All game logic MUST reside in a single-page architecture: `index.html`, `style.css`, and `app.js`.
- Do NOT create additional JavaScript files or split logic across modules unless explicitly requested.
- No external frameworks or libraries (React, Phaser, Three.js, etc.) are permitted.

## Core Mechanics

- All game loops MUST use `requestAnimationFrame`. Never use `setInterval` or `setTimeout` for frame updates.
- Every game MUST implement an explicit state machine for game phases (e.g., `START_SCREEN`, `PLAYING`, `GAME_OVER`).
- State transitions MUST be handled by a pure function that takes the current state and an event, returning the next state.

## DOM and Canvas

- DOM manipulation (progress bars, buttons, overlays) MUST be kept separate from canvas rendering logic.
- Canvas rendering MUST use the vanilla HTML5 2D context API (`getContext('2d')`).
- Do NOT mix DOM element positioning with canvas draw calls in the same function.
- UI elements outside the canvas (meters, buttons) are styled via CSS and updated via simple DOM property assignments.

## Asset Management

- Do NOT use complex image loading scripts, sprite sheet parsers, or asset pipeline tools unless explicitly requested.
- Default to basic geometric shapes (rectangles, circles, arcs) and hex color codes for all game object placeholders.
- If a sprite image is provided in `assets/`, load it with a simple `new Image()` pattern and provide a geometric fallback on load failure.

## Version Control

- All automated commit messages MUST follow Conventional Commits format: `type(scope): description`
- Valid types: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `spec`
- Keep commit descriptions under 70 characters. Use the body for details.

## Token Efficiency

- Functions MUST be small, modular, and single-purpose (one responsibility per function).
- Prefer pure functions over stateful ones wherever possible.
- Do NOT generate redundant wrapper functions or unnecessary abstractions.
- Avoid code duplication — extract shared logic into reusable helpers.
- Keep constants grouped and named clearly at the top of the file.
- Do NOT add defensive checks or error handling beyond what the spec explicitly requires.
