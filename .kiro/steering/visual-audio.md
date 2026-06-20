# Visual & Audio Standards

Mandatory rules for handling graphics, UI, and sound in vanilla JavaScript browser games in this workspace.

## Canvas Rendering

- All game rendering MUST use the HTML5 Canvas 2D API (`getContext('2d')`).
- Render functions MUST be completely decoupled from physics and state update logic.
- A render function receives the current game state as input and draws it — it MUST NOT mutate state.
- Do NOT use WebGL, SVG, or third-party rendering libraries.

## Asset Strategy

- Default to programmatically drawn geometric shapes (circles, rectangles, arcs, lines) and hex color codes for all game entities.
- Do NOT require external image or sprite assets unless the spec explicitly provides them.
- If a sprite file exists in `assets/`, load it with `new Image()` and always implement a geometric fallback rendered via canvas primitives on load failure.
- Do NOT use sprite sheets, texture atlases, or image manipulation libraries.

## Audio Implementation

- Generate sound effects procedurally using the native Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`).
- Create short, distinct tones for game events (jump, score, crash, power-up) using oscillator frequency and gain envelope shaping.
- Do NOT load external audio files (`.wav`, `.mp3`, `.ogg`) unless the spec explicitly provides them in `assets/`.
- If external audio files ARE provided by the spec, use simple `new Audio()` with `currentTime` reset — do NOT build complex audio loading pipelines.
- Wrap all `play()` calls in try/catch to handle browser autoplay policy silently.

## UI Overlay

- Scoring, menus, game-over screens, and text overlays MUST be rendered as HTML DOM elements positioned absolutely over the canvas.
- Do NOT draw text directly onto the canvas for UI purposes (score display, titles, instructions).
- Style all UI text with CSS for crisp resolution at any display density.
- Toggle visibility of DOM overlays via CSS classes or `style.display` — do NOT recreate elements each frame.
- The canvas is reserved for game world rendering only (entities, backgrounds, effects).

## Performance

- Clear the canvas exactly once per frame using `ctx.clearRect(0, 0, width, height)` at the start of the render function.
- Minimize redundant context state changes. Batch draws that share the same `fillStyle` or `strokeStyle`.
- Use `ctx.save()` / `ctx.restore()` sparingly — only when applying temporary transforms or alpha changes that must be reverted.
- Do NOT call `getContext('2d')` more than once. Cache the context reference at initialization.
- Avoid allocating new objects inside the render loop. Reuse coordinate variables where possible.
