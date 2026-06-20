# Requirements Document

## Introduction

Game Enhancements is a comprehensive feature set that expands Flappy Kiro beyond core gameplay into a fully polished, distributable browser game. The enhancements cover four pillars: (1) Gameplay — online leaderboard, multiple power-ups, endless mode variations, and mobile responsiveness; (2) Visual & Audio — trail effects, dynamic pipe coloring, procedural chiptune music, and death animation; (3) Technical Quality — responsive canvas, accessibility, performance optimization via object pooling, and PWA support; (4) Distribution — GitHub Pages deployment and documentation. All features build on the existing vanilla JavaScript single-file architecture using Canvas 2D and Web Audio API.

## Glossary

- **Game**: The Flappy Kiro single-page application consisting of `index.html`, `style.css`, and `app.js`
- **Canvas**: The HTML5 `<canvas>` element used as the primary rendering surface with a 2D drawing context
- **Ghosty**: The player character rendered using the `assets/ghosty.png` sprite image
- **Pipe_Pair**: A vertical obstacle consisting of a top pipe and a bottom pipe with a gap between them
- **Score**: An integer counter representing the number of Pipe_Pairs Ghosty has successfully passed
- **Leaderboard_Service**: A serverless backend (Firebase Realtime Database or equivalent) that stores and retrieves player scores
- **Leaderboard_UI**: A DOM overlay displaying the top 10 global scores retrieved from the Leaderboard_Service
- **Shield_Pickup**: A power-up collectible that grants Ghosty temporary invincibility against pipe collisions
- **Slow_Motion_Pickup**: A power-up collectible that reduces game speed temporarily
- **Magnet_Pickup**: A power-up collectible that attracts nearby Data Packets toward Ghosty automatically
- **Power_Up**: A generic term for Shield_Pickup, Slow_Motion_Pickup, or Magnet_Pickup
- **World_Theme**: A visual color palette and background variation applied every 50 points in endless mode
- **Day_Night_Cycle**: A gradual shift in the Canvas background color palette between warm (day) and cool (night) tones
- **Trail_Effect**: A fading visual trail behind Ghosty composed of previous position samples stored in a ring buffer
- **Ring_Buffer**: A fixed-size circular array that stores the N most recent Ghosty positions for trail rendering
- **Pipe_Gradient**: A dynamic color transition applied to Pipe_Pairs shifting from green to red as difficulty increases
- **Music_System**: A procedural chiptune background melody generator using Web Audio API oscillator nodes
- **Death_Animation**: A tumbling spin animation applied to Ghosty after collision before the recap screen appears
- **Object_Pool**: A pre-allocated collection of reusable objects (particles, pipes) that avoids runtime allocation and garbage collection pressure
- **Service_Worker**: A background script that intercepts network requests to enable offline play and PWA installability
- **PWA_Manifest**: A `manifest.json` file declaring app metadata for Progressive Web App installability
- **Responsive_Canvas**: The system that dynamically resizes the Canvas element to fit the current viewport dimensions

## Requirements

### Requirement 1: Online Leaderboard

**User Story:** As a player, I want to submit my score to an online leaderboard and see top scores from other players, so that I can compete globally.

#### Acceptance Criteria

1. WHEN the Game_State transitions to GAME_OVER, THE Leaderboard_Service SHALL accept a score submission containing the player display name and final Score as an integer in the range 0 to 999,999
2. WHEN a player requests the leaderboard view, THE Leaderboard_UI SHALL display up to 10 scores retrieved from the Leaderboard_Service within 5 seconds, ordered from highest to lowest
3. THE Leaderboard_UI SHALL display each entry with a rank number (1-based position), player name (truncated to 15 characters if longer), and score value
4. IF the Leaderboard_Service does not respond within 5 seconds or returns a network error, THEN THE Game SHALL display an error message indicating the leaderboard is unavailable in the Leaderboard_UI and continue operating without blocking gameplay
5. IF the player has not previously entered a display name, THEN THE Game SHALL prompt the player to enter a display name of 3 to 15 alphanumeric characters before submitting a score
6. THE Game SHALL persist the player display name in localStorage so the player does not re-enter it each session
7. IF localStorage is unavailable or full, THEN THE Game SHALL prompt the player to enter a display name each session without displaying an error

### Requirement 2: Shield Power-Up

**User Story:** As a player, I want to collect shield pickups during gameplay, so that I can survive a single pipe collision.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Game SHALL spawn a Shield_Pickup at a random vertical position within a Pipe_Pair gap — constrained so the full pickup circle (radius 14px) remains within the gap bounds — with a 10% probability per Pipe_Pair generated
2. WHEN Ghosty collides with a Shield_Pickup, THE Game SHALL activate a shield effect, remove the Shield_Pickup from the Canvas, and start a 5-second shield timer; the shield effect ends when either the timer expires or the shield absorbs one pipe collision, whichever occurs first
3. WHILE the shield effect is active, THE Game SHALL suppress the first pipe collision by allowing Ghosty to pass through the colliding pipe without triggering Game_Over, and immediately deactivate the shield after absorbing that collision
4. WHILE the shield effect is active, THE Game SHALL render a translucent circular outline (radius equal to Ghosty's sprite diagonal plus 6px, stroke color blue with 50% opacity) around Ghosty to indicate protection
5. THE Game SHALL render the Shield_Pickup as a glowing blue circle with a radius of 14px and a shield icon drawn using Canvas arc primitives
6. IF the shield timer expires without absorbing a collision, THEN THE Game SHALL deactivate the shield effect without any visual burst or audio cue
7. IF Ghosty collides with a Shield_Pickup while a shield effect is already active, THEN THE Game SHALL reset the shield timer to 5 seconds and remove the collected Shield_Pickup from the Canvas

### Requirement 3: Slow-Motion Power-Up

**User Story:** As a player, I want to collect slow-motion pickups, so that I can temporarily reduce game speed to navigate difficult sections.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Game SHALL spawn a Slow_Motion_Pickup at a random vertical position within a Pipe_Pair gap with an 8% probability per Pipe_Pair generated, rendering the pickup as a yellow circle with a radius of 12 pixels, a shadowBlur of 10 pixels, and a clock icon drawn using Canvas arc and line primitives
2. WHEN Ghosty collides with a Slow_Motion_Pickup, THE Game SHALL remove the pickup from the game world and reduce the effective game speed to 50% of the current difficulty-adjusted speed for 4 seconds
3. IF Ghosty collects a Slow_Motion_Pickup while a slow-motion effect is already active, THEN THE Game SHALL reset the 4-second duration timer without compounding the speed reduction
4. WHILE the slow-motion effect is active, THE Game SHALL apply the 50% speed multiplier to pipe movement speed, gravity, and Ghosty velocity uniformly, and SHALL render a yellow-tinted border overlay with a 4-pixel width and 40% opacity on the Canvas edge
5. WHEN the slow-motion duration expires, THE Game SHALL restore game speed to the current difficulty-adjusted speed using a linear ramp over 500 milliseconds
6. WHILE Steering_Mode is active, THE Game SHALL suppress collection of Slow_Motion_Pickups and ignore collisions between Ghosty and any Slow_Motion_Pickup

### Requirement 4: Magnet Power-Up

**User Story:** As a player, I want to collect magnet pickups, so that nearby Data Packets are automatically attracted toward Ghosty.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, WHEN a Pipe_Pair is generated, THE Game SHALL spawn a Magnet_Pickup at a random vertical position within the Pipe_Pair gap with an 8% probability, constraining the pickup center so the full radius remains within the gap bounds
2. WHEN Ghosty collides with a Magnet_Pickup while no magnet effect is active, THE Game SHALL activate a magnet effect lasting 6 seconds; IF a magnet effect is already active, THEN THE Game SHALL reset the magnet timer to 6 seconds
3. WHILE the magnet effect is active, THE Game SHALL move each Data Packet within a 150-pixel radius of Ghosty's center toward Ghosty's center at a rate of 3 pixels per frame (scaled by delta time), with collection handled by standard collision detection upon contact
4. WHILE the magnet effect is active, THE Game SHALL render a purple ring around Ghosty at 150-pixel radius with opacity oscillating between 0.3 and 0.8 over a 600-millisecond cycle
5. THE Game SHALL render the Magnet_Pickup as a magenta circle with a 14-pixel radius, a shadowBlur of 10, and a U-shaped magnet icon drawn using Canvas arc primitives
6. WHEN the magnet timer expires, THE Game SHALL deactivate the attraction behavior and remove the visual ring indicator
7. THE Game SHALL move each Magnet_Pickup leftward at the current pipe speed per frame (scaled by delta time) and remove it when its rightmost edge passes the left canvas boundary

### Requirement 5: Endless Mode Day/Night Cycle

**User Story:** As a player, I want the visual palette to shift between day and night as I progress, so that the game world feels dynamic and alive.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Day_Night_Cycle SHALL transition the Canvas background color between a night palette (base dark theme `#1a1a2e`) and a day palette (warm tone `#2e3a5a`) over a full cycle period of 60 seconds, starting at the night palette (cycle position 0.0) when gameplay begins
2. THE Day_Night_Cycle SHALL compute the current cycle position as a sinusoidal oscillation (using a sine function over the 60-second period) and apply linear interpolation between the night and day color channel values at that position
3. WHILE the Game_State is PAUSED, THE Day_Night_Cycle SHALL freeze at its current cycle position and resume from that position when gameplay continues
4. THE Day_Night_Cycle SHALL adjust the parallax star layer opacity between a minimum of 0.2 (day) and a maximum of 0.8 (night), mapped proportionally to the current cycle position where 0.0 is full night and 1.0 is full day

### Requirement 6: Themed Worlds

**User Story:** As a player, I want the game to introduce new visual themes every 50 points, so that progression feels rewarding with fresh visuals.

#### Acceptance Criteria

1. WHEN the Score reaches a multiple of 50, THE Game SHALL transition to the next World_Theme by rendering a full-canvas white overlay that fades from full opacity to transparent over 300 milliseconds, while gameplay (physics, input, and scoring) continues uninterrupted during the transition
2. THE Game SHALL define at least 4 World_Themes, each specifying unique hex color values for pipe fill color, background accent color, and particle color
3. WHILE a World_Theme is active, THE Game SHALL render Pipe_Pairs, background parallax elements, and particles using that theme's color palette
4. THE Game SHALL cycle through World_Themes in a fixed sequential order, returning to the first theme after the last defined theme has been displayed
5. WHEN the Game_State transitions to GAME_OVER, THE Game SHALL reset the active World_Theme to the first theme in the sequence
6. IF the Score increases past multiple successive multiples of 50 within a single scoring event, THEN THE Game SHALL advance to the World_Theme corresponding to the highest reached multiple rather than triggering multiple transitions

### Requirement 7: Mobile Responsive Canvas

**User Story:** As a player on a mobile device, I want the game canvas to fit my screen, so that I can play comfortably without scrolling or content being cut off.

#### Acceptance Criteria

1. WHEN the page loads, THE Responsive_Canvas SHALL calculate the largest dimensions that fit within the viewport width and viewport height while maintaining the 2:3 aspect ratio (base 400×600), applying 16 pixels of total horizontal padding, and set the Canvas to those dimensions
2. WHEN the browser window resizes, THE Responsive_Canvas SHALL recalculate and apply new Canvas dimensions within 100 milliseconds using a debounced resize handler
3. THE Responsive_Canvas SHALL multiply all game coordinate values (positions, velocities, distances, and hitbox dimensions) by the ratio of current Canvas width to the base width of 400 pixels so that collision boundaries and movement distances scale uniformly
4. IF the calculated Canvas width is less than 280 pixels, THEN THE Responsive_Canvas SHALL clamp the Canvas width to 280 pixels and allow horizontal scrolling
5. THE Responsive_Canvas SHALL set a maximum Canvas width of 600 pixels to prevent the game from exceeding the base resolution on large viewports
6. IF the `prefers-reduced-motion` media query matches, THEN THE Responsive_Canvas SHALL disable the Day_Night_Cycle background color transitions and Data Packet glow animations
7. WHEN the viewport is in landscape orientation and the viewport height is the constraining dimension, THE Responsive_Canvas SHALL size the Canvas height to the viewport height minus 16 pixels of vertical padding and derive the width from the 2:3 aspect ratio

### Requirement 8: Ghosty Trail Effect

**User Story:** As a player, I want Ghosty to leave a fading trail behind, so that movement feels more fluid and visually appealing.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Trail_Effect SHALL store Ghosty position (x, y) in a Ring_Buffer of 12 entries, sampling one position every 2 frames
2. WHILE the Game_State is PLAYING, THE Trail_Effect SHALL render each stored position as a filled circle with radius linearly interpolated from 10 pixels (newest) to 3 pixels (oldest) and opacity linearly interpolated from 0.6 (newest) to 0.0 (oldest), skipping any unoccupied entries when fewer than 12 positions have been sampled
3. THE Trail_Effect SHALL use a purple color (`#a855f7`) for all trail circles
4. WHEN the Game_State transitions away from PLAYING, THE Trail_Effect SHALL clear the Ring_Buffer and cease rendering trail circles

### Requirement 9: Pipe Color Gradient

**User Story:** As a player, I want pipes to shift from green to red as difficulty increases, so that I have a visual indicator of how hard the game has become.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Pipe_Gradient SHALL interpolate the Pipe_Pair fill color from green (`#00d400`) at base pipe speed to red (`#d40000`) at maximum pipe speed using per-channel linear RGB interpolation
2. THE Pipe_Gradient SHALL calculate the interpolation factor as (current pipe speed minus base pipe speed) divided by (maximum pipe speed minus base pipe speed), clamped to the range [0, 1]
3. THE Pipe_Gradient SHALL apply the interpolated color uniformly to both the pipe body rectangles and the Pipe_Cap rectangles of each Pipe_Pair
4. WHEN the Game_State transitions from GAME_OVER to START_SCREEN, THE Pipe_Gradient SHALL restore pipe color to the base green value (`#00d400`)
5. WHILE the interpolation factor is 0, THE Pipe_Gradient SHALL render pipes in the base green color (`#00d400`), and WHILE the interpolation factor is 1, THE Pipe_Gradient SHALL render pipes in the maximum red color (`#d40000`)

### Requirement 10: Procedural Chiptune Music System

**User Story:** As a player, I want background chiptune music during gameplay, so that the audio experience feels complete and engaging.

#### Acceptance Criteria

1. WHEN the Game_State transitions to PLAYING, THE Music_System SHALL begin generating a looping chiptune melody using Web Audio API OscillatorNodes with square waveform
2. THE Music_System SHALL play a repeating sequence of at least 8 notes (pentatonic scale) with each note lasting 200 milliseconds
3. THE Music_System SHALL layer a bass line oscillator (square wave, one octave below the melody) playing root notes on beats 1 and 3 of a 4-beat pattern, where each beat duration equals the melody note duration of 200 milliseconds
4. WHEN the Game_State transitions to GAME_OVER or START_SCREEN, THE Music_System SHALL stop all active oscillators with a 100 millisecond gain fade-out to prevent audio pops
5. THE Music_System SHALL set the combined melody and bass volume to 15% of maximum gain to remain unobtrusive
6. WHEN the Game_State transitions to PAUSED, THE Music_System SHALL suspend oscillator playback; WHEN the Game_State transitions from PAUSED to PLAYING, THE Music_System SHALL resume playback from the last note position
7. IF the AudioContext is suspended due to browser autoplay policy, THEN THE Music_System SHALL call `audioContext.resume()` on the first user interaction before starting playback

### Requirement 11: Death Animation

**User Story:** As a player, I want Ghosty to tumble downward with a spin after dying, so that the death moment feels dramatic before the recap screen.

#### Acceptance Criteria

1. WHEN the Game_State transitions to GAME_OVER, THE Death_Animation SHALL animate Ghosty falling downward starting from the current velocity at time of collision, with gravity applied each frame (using the standard GRAVITY constant), while spinning clockwise at 360 degrees per second
2. WHEN the Death_Animation has run for 800 milliseconds, THE Game SHALL trigger the Death_Recap overlay display with a fade-in transition over 400 milliseconds
3. WHILE the Death_Animation is active, THE Game SHALL continue rendering the Canvas (pipes, background, parallax layers) at their last positions without advancing pipe movement or physics updates, while only Ghosty's vertical position and rotation are updated
4. WHILE the Death_Animation is active, THE Game SHALL ignore all player inputs (Spacebar, Click, Touch, Escape)
5. IF Ghosty's vertical position exceeds the Canvas height during the Death_Animation, THEN THE Death_Animation SHALL clamp Ghosty's rendered position to the bottom edge of the Canvas for the remainder of the 800-millisecond duration

### Requirement 12: Accessibility

**User Story:** As a player using assistive technology, I want the game to be navigable and understandable, so that I can play regardless of ability.

#### Acceptance Criteria

1. THE Game SHALL add `role="img"` and an `aria-label` attribute to the Canvas element with an initial value of "Flappy Kiro game: waiting to start"
2. THE Game SHALL make the restart button (in Death_Recap) keyboard-focusable with a visible focus indicator that uses a CSS outline of at least 2px with a minimum 3:1 contrast ratio against adjacent background colors
3. WHEN the Game_State transitions, THE Game SHALL update the Canvas `aria-label` to reflect the new state using the format: "Flappy Kiro game: [state]" where [state] is one of "waiting to start", "playing, score [N]", "paused", or "game over, score [N]"
4. IF the `prefers-reduced-motion` media query matches, THEN THE Game SHALL disable particle effects, the Trail_Effect, screen shake, the Death_Animation, and all CSS transitions and keyframe animations on overlay elements
5. THE Game SHALL ensure all interactive DOM elements (the steering-activate-btn button and the restart control in Death_Recap) have associated accessible labels via `aria-label` attributes
6. WHEN the Game_State transitions to GAME_OVER, THE Game SHALL move keyboard focus to the restart control within the Death_Recap overlay so that keyboard and screen reader users can discover and activate it without manual search
7. THE Game SHALL wrap the Canvas `aria-label` in an `aria-live="polite"` region or apply `aria-live="polite"` directly to the Canvas element so that screen readers announce state changes without requiring the user to move focus to the Canvas

### Requirement 13: Object Pooling for Performance

**User Story:** As a player, I want smooth frame rates even during intense visual effects, so that gameplay never stutters.

#### Acceptance Criteria

1. THE Object_Pool SHALL pre-allocate a pool of 100 Particle objects and a pool of 10 Pipe_Pair objects at game initialization, before the first frame of gameplay begins
2. WHEN the Particle_System needs a new particle, THE Object_Pool SHALL provide a particle whose life has reached zero, reset its position, velocity, alpha, life, and radius to the values specified by the spawn request, and mark it as active
3. WHEN a particle's remaining life reaches zero, THE Object_Pool SHALL mark it as inactive and make it available for reuse rather than discarding it for garbage collection
4. WHEN a Pipe_Pair moves entirely off the left edge of the canvas, THE Object_Pool SHALL mark it as inactive and make it available for reuse with new gap position and x-coordinate values when next activated
5. IF all 100 Particle objects in the pool are active, THEN THE Object_Pool SHALL skip spawning additional particles without affecting gameplay mechanics or pipe spawning
6. IF all 10 Pipe_Pair objects in the pool are active, THEN THE Object_Pool SHALL defer pipe spawning until an existing Pipe_Pair becomes inactive and available for reuse
7. WHILE the game is in the PLAYING state, THE Object_Pool SHALL not instantiate new Particle or Pipe_Pair objects via constructor or object literal allocation; all instances SHALL come from the pre-allocated pools

### Requirement 14: Progressive Web App Support

**User Story:** As a player, I want to install the game on my device and play offline, so that I can enjoy the game without an internet connection.

#### Acceptance Criteria

1. THE Game SHALL include a `manifest.json` file declaring app name ("Flappy Kiro"), short name, start URL, display mode ("standalone"), theme color, background color, and at least two icon sizes (192x192 and 512x512)
2. WHEN the Service_Worker is installed, THE Game SHALL cache `index.html`, `style.css`, `app.js`, `manifest.json`, and all files in the `assets/` directory
3. WHEN the network is unavailable, THE Service_Worker SHALL serve all cached assets so that the game loads, renders to the canvas, accepts player input, and tracks score without requiring a network connection
4. THE Game SHALL include a `<link rel="manifest">` tag in `index.html` pointing to `manifest.json`
5. THE Service_Worker SHALL use a cache-first strategy for static assets and a network-first strategy for Leaderboard_Service requests
6. IF a Leaderboard_Service request fails due to network unavailability, THEN THE Service_Worker SHALL serve a cached response if one exists, or return an error response indicating the leaderboard is unavailable
7. IF the Service_Worker fails to cache any required asset during installation, THEN THE Service_Worker SHALL not complete activation and SHALL reattempt caching on the next page load

### Requirement 15: GitHub Pages Deployment

**User Story:** As a developer, I want the game deployed to GitHub Pages as static files, so that players can access it via a public URL.

#### Acceptance Criteria

1. WHEN a push to the main branch occurs, THE deployment workflow (`.github/workflows/deploy.yml`) SHALL trigger and deploy the root directory contents to GitHub Pages
2. THE deployment workflow SHALL use the `actions/upload-pages-artifact` action to package the root directory and the `actions/deploy-pages` action to publish the artifact, with `pages` write permission and `id-token` write permission configured
3. THE repository SHALL contain all static files required for the game to run (`index.html`, `style.css`, `app.js`, and the `assets/` directory) in the root directory, requiring no build or compilation step before deployment
4. WHEN the deployment workflow completes successfully, THE published GitHub Pages site SHALL serve `index.html` as the entry point and all referenced static assets SHALL be accessible via relative paths from the public URL

### Requirement 16: README Documentation

**User Story:** As a visitor to the repository, I want a clear README with gameplay visuals and controls, so that I can quickly understand what the game is and how to play.

#### Acceptance Criteria

1. THE README SHALL include a gameplay GIF or animated screenshot demonstrating core gameplay above the first markdown heading or immediately after the project title heading, before any other content section
2. THE README SHALL include a controls section containing a list that documents all input methods (Spacebar/Click/Touch to flap, Escape to pause, Shift to activate Steering Mode) with each input method on a separate list item specifying the key/action and its effect
3. THE README SHALL include at least one static screenshot showing the game in the PLAYING state, where the screenshot file exists in the repository and the image path resolves correctly
4. THE README SHALL include the following sections each containing at least one descriptive sentence: game description, controls, features list, how to run locally (with terminal commands), and deployment information
5. THE README SHALL include a clickable markdown link to the live deployed game on GitHub Pages, formatted as a standard markdown hyperlink with a valid URL starting with "https://"
6. IF a gameplay GIF, screenshot, or image is referenced in the README, THEN THE README SHALL reference a file that exists in the repository under the `img/` or `assets/` directory
