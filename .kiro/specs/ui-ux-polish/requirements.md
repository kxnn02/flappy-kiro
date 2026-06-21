# Requirements Document

## Introduction

A comprehensive UI/UX polish pass for Flappy Kiro that replaces the current chiptune music with an ambient lo-fi procedural soundtrack, refines the retro-neon visual aesthetic with improved contrast and glow effects, and adds animation polish across all state transitions and interactive elements. All changes respect the single-page architecture (index.html, style.css, app.js) with no external libraries.

## Glossary

- **Music_Engine**: The procedural Web Audio API system responsible for generating and controlling the ambient background soundtrack during gameplay
- **UI_Overlay**: The DOM-based layer of HTML elements positioned absolutely over the game canvas for displaying scores, menus, and informational text
- **Canvas_Renderer**: The HTML5 Canvas 2D context responsible for drawing all game world entities (Ghosty, pipes, data packets, backgrounds, particles)
- **Transition_System**: The CSS and JavaScript mechanisms that control fade, slide, and glow animations between game states and UI element visibility changes
- **Color_Palette**: The defined set of hex color values used consistently across the game for backgrounds, accents, glows, and text
- **Glow_Effect**: A visual emphasis technique using CSS box-shadow, text-shadow, or Canvas shadowBlur to create neon-light illumination around elements

## Requirements

### Requirement 1: Ambient Lo-Fi Music Engine

**User Story:** As a player, I want gentle ambient background music that creates atmosphere without being repetitive or distracting, so that I can focus on gameplay while enjoying a warm audio experience.

#### Acceptance Criteria

1. WHEN the game transitions to the PLAYING state, THE Music_Engine SHALL begin generating an ambient lo-fi pad using sine and triangle wave OscillatorNodes connected through GainNodes via the Web Audio API.
2. WHILE the game is in the PLAYING state, THE Music_Engine SHALL produce slowly evolving chords by cycling through a defined set of warm chord voicings with note durations between 3 and 6 seconds per chord change.
3. THE Music_Engine SHALL layer a minimum of 2 and a maximum of 4 simultaneous oscillator voices to create chord textures with detuning offsets between voices of 2 to 8 cents.
4. THE Music_Engine SHALL apply a slow attack envelope of at least 500 milliseconds and a slow release envelope of at least 800 milliseconds to each chord transition to prevent abrupt tonal shifts.
5. WHEN the game transitions to the PAUSED state, THE Music_Engine SHALL reduce the master gain to 0 over a 300 millisecond linear ramp.
6. WHEN the game transitions from the PAUSED state to the PLAYING state, THE Music_Engine SHALL restore the master gain to the configured volume over a 300 millisecond linear ramp.
7. WHEN the game transitions to the GAME_OVER state, THE Music_Engine SHALL fade the master gain to 0 over a 500 millisecond linear ramp and stop all active oscillators after the fade completes.
8. THE Music_Engine SHALL use only the Web Audio API with no external audio files loaded or referenced.
9. THE Music_Engine SHALL set the master gain volume to a value no greater than 0.12 to remain unobtrusive beneath sound effects.

### Requirement 2: Refined Color Palette

**User Story:** As a player, I want a more cohesive and visually refined retro-neon color scheme, so that the game feels polished and the dark aesthetic has better contrast and readability.

#### Acceptance Criteria

1. THE Color_Palette SHALL define a primary background color of #0f0f23 for the body and canvas base to deepen the dark foundation.
2. THE Color_Palette SHALL define a primary neon accent of #b366ff for interactive elements, headings, and primary glow effects.
3. THE Color_Palette SHALL define a secondary accent of #00e5ff for score displays, data packet glows, and secondary UI highlights.
4. THE Color_Palette SHALL define a text color of #f0e6ff for all body text to ensure a contrast ratio of at least 7:1 against the primary background.
5. THE Color_Palette SHALL define a muted surface color of #1a1a3e for overlay backgrounds and container fills.
6. WHEN the Color_Palette is applied, THE UI_Overlay SHALL update all CSS color, background-color, border-color, box-shadow, and text-shadow values to use the defined palette colors consistently.
7. WHEN the Color_Palette is applied, THE Canvas_Renderer SHALL update background gradient colors, particle colors, and entity glow colors to align with the defined palette.

### Requirement 3: Enhanced Glow and Neon Effects

**User Story:** As a player, I want sharper and more vibrant neon glow effects on interactive elements, so that the retro-neon theme feels more intentional and visually striking.

#### Acceptance Criteria

1. THE UI_Overlay SHALL apply a multi-layer box-shadow glow to all interactive buttons using the primary accent color with an inner glow of 0 0 8px, a mid glow of 0 0 16px at 60% opacity, and an outer glow of 0 0 32px at 30% opacity.
2. WHEN a player hovers over an interactive button, THE UI_Overlay SHALL increase the outer glow radius to 48px and the mid glow opacity to 80% over a 200 millisecond CSS transition.
3. THE UI_Overlay SHALL apply text-shadow glow to all heading elements using the primary accent color with layers at 0 0 10px, 0 0 20px at 60% opacity, and 0 0 40px at 30% opacity.
4. THE Canvas_Renderer SHALL render data packets with a shadowBlur of 15 pixels and shadowColor set to the secondary accent color.
5. THE Canvas_Renderer SHALL render the Ghosty sprite or fallback shape with a shadowBlur of 10 pixels and shadowColor set to the primary accent color during normal play.
6. WHILE Steering Mode is active, THE Canvas_Renderer SHALL increase the Ghosty glow shadowBlur to 25 pixels and pulse the glow opacity between 60% and 100% over a 1000 millisecond cycle.

### Requirement 4: Smooth State Transition Animations

**User Story:** As a player, I want smooth animated transitions between game states (start, playing, paused, game over), so that state changes feel polished rather than abrupt.

#### Acceptance Criteria

1. WHEN the game transitions from START_SCREEN to PLAYING, THE Transition_System SHALL fade the start overlay opacity from 1 to 0 over 400 milliseconds using a CSS ease-out timing function.
2. WHEN the game transitions from PLAYING to PAUSED, THE Transition_System SHALL fade the pause overlay opacity from 0 to 1 over 300 milliseconds using a CSS ease timing function.
3. WHEN the game transitions from PAUSED to PLAYING, THE Transition_System SHALL fade the pause overlay opacity from 1 to 0 over 300 milliseconds using a CSS ease timing function.
4. WHEN the game transitions to GAME_OVER, THE Transition_System SHALL fade the death recap overlay opacity from 0 to 1 over 400 milliseconds using a CSS ease-in timing function, beginning after the death animation completes.
5. WHEN the game transitions from GAME_OVER to START_SCREEN, THE Transition_System SHALL fade the death recap overlay out over 300 milliseconds and simultaneously fade the start overlay in over 400 milliseconds.
6. THE Transition_System SHALL apply a translateY slide of 10 pixels (downward to final position) combined with the opacity fade on overlay text elements during fade-in transitions.

### Requirement 5: Score Display Animation Polish

**User Story:** As a player, I want animated visual feedback when my score increases, so that scoring feels rewarding and dynamic.

#### Acceptance Criteria

1. WHEN the score increments, THE UI_Overlay SHALL trigger a CSS scale transform from 1.0 to 1.3 and back to 1.0 on the score display element over a 200 millisecond duration.
2. WHEN the score increments, THE UI_Overlay SHALL apply a temporary glow pulse on the score text using text-shadow that intensifies to full opacity and returns to 50% opacity over 300 milliseconds.
3. WHEN a score popup element is created, THE Transition_System SHALL animate the popup with a translateY of -40 pixels and opacity fade from 1 to 0 over 800 milliseconds using ease-out timing.
4. WHEN a new high score is achieved during the death recap, THE UI_Overlay SHALL apply a continuous pulse animation on the high score text that oscillates text-shadow intensity over a 1500 millisecond cycle.

### Requirement 6: Interactive Element Feedback

**User Story:** As a player, I want visual feedback when I interact with buttons and clickable elements, so that the UI feels responsive and alive.

#### Acceptance Criteria

1. WHEN a player presses an interactive button, THE UI_Overlay SHALL apply a scale transform of 0.95 for the duration of the press and return to 1.0 on release over a 100 millisecond transition.
2. WHEN the steering charge bar reaches 100%, THE UI_Overlay SHALL apply a continuous glow pulse animation on the steering charge container border using the primary accent color oscillating between 40% and 100% opacity over a 1200 millisecond cycle.
3. WHEN the steering activate button becomes visible, THE Transition_System SHALL fade the button opacity from 0 to 1 and scale from 0.8 to 1.0 over a 300 millisecond duration with ease-out timing.
4. WHEN the help button is pressed, THE Transition_System SHALL fade the help overlay from opacity 0 to 1 over 250 milliseconds with a slight scale from 0.95 to 1.0.

### Requirement 7: Typography Refinement

**User Story:** As a player, I want refined typography that maintains the retro monospace character while being more readable and visually appealing.

#### Acceptance Criteria

1. THE UI_Overlay SHALL use the CSS font-family declaration "'Courier New', Courier, monospace" for all text elements to maintain retro character with improved glyph rendering.
2. THE UI_Overlay SHALL set the game title heading to a font-size of 36 pixels with a letter-spacing of 6 pixels and text-transform uppercase.
3. THE UI_Overlay SHALL set overlay body text to a font-size of 15 pixels with a line-height of 1.6 for improved readability.
4. THE UI_Overlay SHALL set the score display to a font-size of 52 pixels with a font-weight of bold and a letter-spacing of 2 pixels.
5. THE UI_Overlay SHALL apply a subtle text-shadow of 0 1px 2px rgba(0,0,0,0.8) to all body text for depth against dark backgrounds.

### Requirement 8: Reduced Motion Accessibility

**User Story:** As a player with motion sensitivity, I want all animations and transitions to respect my operating system reduced motion preference, so that the game remains accessible.

#### Acceptance Criteria

1. WHEN the prefers-reduced-motion media query matches "reduce", THE Transition_System SHALL set all CSS transition-duration values to 0 milliseconds.
2. WHEN the prefers-reduced-motion media query matches "reduce", THE Transition_System SHALL disable all CSS keyframe animations by setting animation to none.
3. WHEN the prefers-reduced-motion media query matches "reduce", THE Canvas_Renderer SHALL disable glow pulse oscillations and render glows at a static 70% opacity.
4. WHEN the prefers-reduced-motion media query matches "reduce", THE UI_Overlay SHALL apply instant visibility toggling (display none/block) instead of fade transitions on all overlays.

### Requirement 9: Canvas Background Visual Enhancement

**User Story:** As a player, I want a more visually rich canvas background that complements the refined neon aesthetic, so that the game world feels more immersive.

#### Acceptance Criteria

1. THE Canvas_Renderer SHALL render a vertical linear gradient background from #0f0f23 at the top to #1a0a2e at the bottom as the base canvas fill each frame.
2. THE Canvas_Renderer SHALL render a grid of subtle horizontal and vertical lines at 40 pixel intervals with a stroke color of rgba(179, 102, 255, 0.04) to add depth without distracting from gameplay.
3. WHILE the game is in the PLAYING state, THE Canvas_Renderer SHALL slowly scroll the background grid downward at 0.5 pixels per frame to create a sense of movement.
4. IF the prefers-reduced-motion preference is set to "reduce", THEN THE Canvas_Renderer SHALL render the grid as static without scrolling.
