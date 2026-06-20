# Requirements Document

## Introduction

Flappy Kiro Foundation is the project scaffold for the Flappy Kiro browser game. This spec covers the creation of the three foundational files (`index.html`, `style.css`, `app.js`) that establish the correct architecture for future game development. The scaffold demonstrates the single-page architecture, game loop with delta time, explicit state machine, DOM/canvas separation, entity rendering with geometric shapes, and Web Audio API placeholder functions. It does not implement full gameplay — it provides the structural skeleton that subsequent tasks build upon.

## Glossary

- **Game**: The Flappy Kiro single-page application consisting of `index.html`, `style.css`, and `app.js`
- **Canvas**: The HTML5 `<canvas>` element used as the primary rendering surface with a 2D drawing context
- **Ghosty**: The player character, rendered as a purple geometric shape (circle or rounded rectangle) on the Canvas
- **Pipe_Pair**: A vertical obstacle consisting of a top pipe and a bottom pipe with a gap between them, rendered as green rectangles
- **Data_Packet**: A collectible power-up item rendered as a glowing purple circle on the Canvas
- **Game_State**: The current phase of the game, one of: START_SCREEN, PLAYING, or GAME_OVER
- **Game_Loop**: The animation cycle driven by `requestAnimationFrame` that computes delta time and calls update and render functions each frame
- **Delta_Time**: The elapsed time between the current and previous frame, computed in seconds from `requestAnimationFrame` timestamps, used for frame-rate-independent physics
- **Score_Overlay**: An HTML DOM element positioned over the Canvas that displays the current score during gameplay
- **Game_Over_Overlay**: An HTML DOM element positioned over the Canvas that displays the game over screen with restart instructions
- **Start_Screen_Overlay**: An HTML DOM element positioned over the Canvas that displays the title and start instructions
- **Physics_Constants**: Named UPPER_SNAKE_CASE constants grouped at the top of `app.js` including GRAVITY, TERMINAL_VELOCITY, and FLAP_IMPULSE
- **Sound_Placeholder**: An empty function stub that uses the Web Audio API pattern (AudioContext, OscillatorNode, GainNode) for procedural sound generation
- **Render_Function**: A pure function that receives game state and draws it to the Canvas without mutating state

## Requirements

### Requirement 1: Single-Page File Structure

**User Story:** As a developer, I want the project delivered as exactly three files with no external dependencies, so that the codebase remains simple and aligns with the single-page architecture constraint.

#### Acceptance Criteria

1. THE Game SHALL consist of exactly three source code files: `index.html`, `style.css`, and `app.js`, with no additional `.html`, `.css`, or `.js` files in the project
2. THE Game SHALL use vanilla JavaScript with no external frameworks, libraries, module bundlers, CDN-linked scripts, or remotely loaded dependencies of any kind
3. THE `index.html` file SHALL include `style.css` via a `<link>` element and `app.js` via a `<script>` element with the `defer` attribute, ensuring the DOM is available when the script executes
4. THE Game SHALL load and function correctly when `index.html` is opened directly in a modern browser without any build step, server, or pre-processing
5. IF asset files (images, audio) are present in the `assets/` directory, THEN THE Game SHALL treat them as optional resources and render geometric fallbacks when they fail to load

### Requirement 2: HTML Canvas Setup

**User Story:** As a developer, I want a properly configured HTML5 Canvas element, so that the game world can be rendered using the 2D drawing context.

#### Acceptance Criteria

1. THE `index.html` file SHALL contain a `<canvas>` element with the id attribute set to `game-canvas`
2. THE `app.js` file SHALL obtain the 2D rendering context from the Canvas element exactly once during game initialization and store the reference in a variable reused for all subsequent draw calls
3. THE Canvas SHALL have its `width` and `height` attributes set to fixed pixel dimensions defined as named UPPER_SNAKE_CASE constants at the top of `app.js`, with a width between 300 and 600 pixels and a height between 400 and 800 pixels

### Requirement 3: DOM UI Overlays

**User Story:** As a developer, I want UI text elements separated into HTML DOM overlays rather than drawn on the canvas, so that text remains crisp at any display density and the canvas is reserved for game world rendering.

#### Acceptance Criteria

1. THE `index.html` file SHALL contain a Score_Overlay element positioned absolutely over the Canvas for displaying the current Score and High_Score in the format "Score: X | High: Y"
2. THE `index.html` file SHALL contain a Game_Over_Overlay element positioned absolutely over the Canvas for displaying the final Score, High_Score, and a restart instruction
3. THE `index.html` file SHALL contain a Start_Screen_Overlay element positioned absolutely over the Canvas for displaying the game title "Flappy Kiro" and an instruction to provide input to begin
4. THE `style.css` file SHALL style all overlay elements with absolute positioning, a z-index above the Canvas, and `pointer-events: none` so that overlays do not intercept user input intended for the game
5. WHILE the Game_State is START_SCREEN, THE Game SHALL display only the Start_Screen_Overlay and hide the Score_Overlay and Game_Over_Overlay
6. WHILE the Game_State is PLAYING, THE Game SHALL display only the Score_Overlay and hide the Start_Screen_Overlay and Game_Over_Overlay
7. WHILE the Game_State is GAME_OVER, THE Game SHALL display only the Game_Over_Overlay and hide the Start_Screen_Overlay and Score_Overlay

### Requirement 4: Dark Retro Theme Styling

**User Story:** As a developer, I want the visual foundation to use the retro dark theme colors, so that future rendering builds on the correct aesthetic from the start.

#### Acceptance Criteria

1. THE `style.css` file SHALL apply a background color of `#1a1a2e` to the page body and remove default browser margins and padding
2. THE `style.css` file SHALL center the Canvas element horizontally and vertically within the viewport using CSS layout
3. THE `style.css` file SHALL style UI overlay text (score display, start screen, and game-over screen elements) with a monospace font family and a light text color of `#e0e0e0` or lighter to ensure legibility against the dark background
4. THE `style.css` file SHALL position UI overlay elements using absolute positioning over the Canvas element so that text remains independent of the canvas rendering surface

### Requirement 5: Explicit State Machine

**User Story:** As a developer, I want an explicit state machine with pure transition logic, so that game phase management is predictable and testable from the start.

#### Acceptance Criteria

1. THE `app.js` file SHALL define a Game_State object with exactly three states: START_SCREEN, PLAYING, and GAME_OVER
2. THE `app.js` file SHALL implement a `transitionState` function that accepts a current state and an event, returns the next state, and does not modify any external variable or the inputs provided
3. WHEN the Game initializes, THE Game_State SHALL be set to START_SCREEN
4. WHILE the Game_State is START_SCREEN, WHEN a USER_INPUT event is passed to `transitionState`, THE function SHALL return PLAYING
5. WHILE the Game_State is PLAYING, WHEN a COLLISION event is passed to `transitionState`, THE function SHALL return GAME_OVER
6. WHILE the Game_State is GAME_OVER, WHEN a USER_INPUT event is passed to `transitionState`, THE function SHALL return START_SCREEN
7. IF `transitionState` is called with a state and event combination that does not match any defined transition, THEN THE function SHALL return the current state unchanged

### Requirement 6: Game Loop with Delta Time

**User Story:** As a developer, I want the game loop to use requestAnimationFrame with delta time computation, so that physics calculations are frame-rate-independent from the start.

#### Acceptance Criteria

1. THE `app.js` file SHALL drive the Game_Loop using `requestAnimationFrame`
2. THE Game_Loop SHALL compute Delta_Time as the difference between the current and previous timestamp converted to seconds, clamping the result to a maximum of 0.1 seconds to prevent physics instability after tab-away or long pauses
3. WHEN the Game_Loop executes its first frame with no previous timestamp available, THE Game_Loop SHALL use a Delta_Time of 0 seconds for that frame
4. THE Game_Loop SHALL call an update function passing Delta_Time before calling a render function each frame
5. THE Game_Loop SHALL strictly separate the update phase from the render phase with no interleaving of state mutations and draw calls
6. THE Game_Loop SHALL continue running via `requestAnimationFrame` regardless of the current Game_State

### Requirement 7: Physics Constants Declaration

**User Story:** As a developer, I want all physics constants defined and grouped at the top of the script, so that future physics code references named constants rather than magic numbers.

#### Acceptance Criteria

1. THE `app.js` file SHALL define GRAVITY as a `const` declaration using UPPER_SNAKE_CASE at the top of the script with a positive numeric value representing downward acceleration in pixels per second squared
2. THE `app.js` file SHALL define TERMINAL_VELOCITY as a `const` declaration using UPPER_SNAKE_CASE at the top of the script with a positive numeric value representing the maximum downward speed in pixels per second
3. THE `app.js` file SHALL define FLAP_IMPULSE as a `const` declaration using UPPER_SNAKE_CASE at the top of the script with a negative numeric value representing upward velocity impulse in pixels per second
4. THE `app.js` file SHALL group all physics and game configuration `const` declarations together at the top of the file before any `function`, `let`, or `var` declarations

### Requirement 8: Entity Rendering with Geometric Shapes

**User Story:** As a developer, I want placeholder rendering functions for Ghosty, Pipes, and Data Packets using basic geometric shapes and the correct theme colors, so that the visual architecture is established before full gameplay is added.

#### Acceptance Criteria

1. THE `app.js` file SHALL implement a render function that draws Ghosty as a purple geometric shape (circle or rounded rectangle) using neon purple fill color `#9d00ff`, where the function receives the Canvas 2D context and Ghosty's position state as input and does not mutate any game state
2. THE `app.js` file SHALL implement a render function that draws a Pipe_Pair as two solid green rectangles (one extending downward from the top of the Canvas, one extending upward from the bottom) using fill color `#00d400`, where the function receives the Canvas 2D context and the Pipe_Pair's position and gap state as input and does not mutate any game state
3. THE `app.js` file SHALL implement a render function that draws a Data_Packet as a purple circle with a neon glow effect by setting `shadowColor` to `#b026ff` and `shadowBlur` to a value of at least 10, where the function receives the Canvas 2D context and the Data_Packet's position state as input and does not mutate any game state
4. THE `app.js` file SHALL clear the Canvas exactly once per frame at the start of the render pass using `ctx.clearRect(0, 0, canvasWidth, canvasHeight)` before any other draw calls
5. THE `app.js` file SHALL fill the Canvas background with the dark theme color `#1a1a2e` each frame after clearing and before drawing any entities

### Requirement 9: Procedural Web Audio API Placeholders

**User Story:** As a developer, I want empty placeholder functions for procedural sound generation using the Web Audio API, so that the audio architecture is in place for future implementation.

#### Acceptance Criteria

1. THE `app.js` file SHALL define a placeholder function for playing a jump sound that creates an AudioContext, an OscillatorNode, and a GainNode, connects them, but does not start the oscillator
2. THE `app.js` file SHALL define a placeholder function for playing a score sound that creates an AudioContext, an OscillatorNode, and a GainNode, connects them, but does not start the oscillator
3. THE `app.js` file SHALL define a placeholder function for playing a crash sound that creates an AudioContext, an OscillatorNode, and a GainNode, connects them, but does not start the oscillator
4. THE `app.js` file SHALL define a placeholder function for playing a power-up collection sound that creates an AudioContext, an OscillatorNode, and a GainNode, connects them, but does not start the oscillator
5. EACH Sound_Placeholder function SHALL contain a comment describing the intended oscillator type, frequency range, and gain envelope shape for that sound effect
6. EACH Sound_Placeholder function SHALL wrap its Web Audio API calls in a try/catch block so that invoking the function does not throw an error

### Requirement 10: Input Handler Setup

**User Story:** As a developer, I want input event listeners registered for keyboard and mouse, so that the game can respond to player actions from the start.

#### Acceptance Criteria

1. THE `app.js` file SHALL register a keydown event listener on the `document` that detects Spacebar presses and prevents the default browser scroll behavior
2. THE `app.js` file SHALL register a click event listener on the Canvas element
3. WHEN a Spacebar press or Canvas click occurs during the START_SCREEN state, THE input handler SHALL invoke the `transitionState` function to transition from START_SCREEN to PLAYING
4. WHEN a Spacebar press or Canvas click occurs during the PLAYING state, THE input handler SHALL invoke the Flap action applying an upward impulse to the Player velocity
5. WHEN a Spacebar press or Canvas click occurs during the GAME_OVER state, THE input handler SHALL invoke the `transitionState` function to transition from GAME_OVER to START_SCREEN

### Requirement 11: Modular Function Architecture

**User Story:** As a developer, I want all code organized as small, single-purpose functions with pure logic where possible, so that the codebase is maintainable and future tasks can extend individual functions without refactoring.

#### Acceptance Criteria

1. THE `app.js` file SHALL implement rendering logic as pure functions that receive the current game state and the Canvas 2D context as parameters, draw to the context, and return without mutating the game state or accessing global mutable variables
2. THE `app.js` file SHALL implement the state transition function as a pure function that accepts the current Game_State and an event, returns the next Game_State, and produces no side effects
3. THE `app.js` file SHALL implement collision detection as an isolated pure function that accepts geometric parameters (positions, dimensions) and returns a boolean indicating overlap, without referencing global state
4. THE `app.js` file SHALL keep each function to a single responsibility, where no function both mutates game state and draws to the Canvas
5. THE `app.js` file SHALL separate the Game_Loop into distinct update and render phases, where all state mutations complete before any Canvas draw calls execute within a frame
6. THE `app.js` file SHALL keep each function body to no more than 40 lines of code (excluding blank lines and comments)
