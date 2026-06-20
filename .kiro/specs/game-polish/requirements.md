# Requirements Document

## Introduction

Game Polish is a comprehensive set of improvements to the existing Flappy Kiro browser game that enhance gameplay feel, visual presentation, audio feedback, and quality of life. The game already has functional core mechanics (flap, pipes, collision, scoring, Steering Mode with invincibility). This feature adds progressive difficulty, screen effects, animations, procedural audio, mobile support, pause functionality, a death recap screen, and smooth state transitions — all implemented within the existing vanilla JS single-file architecture using Canvas 2D and Web Audio API.

## Glossary

- **Game**: The Flappy Kiro single-page application consisting of `index.html`, `style.css`, and `app.js`
- **Canvas**: The HTML5 `<canvas>` element used as the primary rendering surface with a 2D drawing context
- **Player**: The game character (Ghosty) rendered using the `assets/ghosty.png` sprite image
- **Pipe_Pair**: A vertical obstacle consisting of a top pipe and a bottom pipe with a gap between them
- **Score**: An integer counter representing the number of Pipe_Pairs the Player has successfully passed
- **High_Score**: The highest Score achieved, persisted across sessions via localStorage
- **Difficulty_Manager**: The subsystem that adjusts game parameters (pipe speed, gap size) based on the current Score
- **Screen_Shake**: A short-duration random offset applied to the Canvas rendering origin on collision to provide impact feedback
- **Grace_Period**: A brief invincibility window at the start of gameplay where pipe collisions are suppressed
- **Particle_System**: A lightweight system that spawns and animates small visual particles on the Canvas
- **Particle**: A small geometric shape (circle or square) with position, velocity, color, and lifespan properties
- **Rotation_Renderer**: The rendering logic that applies angular rotation to the Player sprite based on vertical velocity
- **Pipe_Cap**: A wider rectangle drawn at the opening edge of each pipe to provide visual depth
- **Parallax_Background**: A multi-layer scrolling background where layers move at different speeds to create depth
- **Score_Popup**: A floating "+1" text animation rendered as a DOM overlay element when the Player passes a Pipe_Pair
- **Audio_Engine**: The procedural sound generation subsystem built on Web Audio API using OscillatorNode and GainNode
- **Steering_Whoosh**: A procedural sound effect played when Steering Mode activates
- **Background_Hum**: A low-volume continuous procedural tone that plays during the PLAYING state
- **Touch_Input**: Input events from mobile touch interactions (touchstart) used as alternatives to keyboard and mouse
- **Pause_State**: A game state where the Game_Loop continues rendering but halts all physics and entity updates
- **Death_Recap**: A DOM overlay shown after Game Over displaying the final Score, High_Score, and a countdown timer before restart is available
- **Fade_Transition**: A smooth opacity animation applied when transitioning between game states

## Requirements

### Requirement 1: Progressive Difficulty

**User Story:** As a player, I want the game to become harder as my score increases, so that gameplay remains challenging and engaging over time.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Difficulty_Manager SHALL increase pipe movement speed by a fixed increment for every 5 points scored, starting from the base PIPE_SPEED value
2. WHILE the Game_State is PLAYING, THE Difficulty_Manager SHALL decrease the vertical gap between Pipe_Pairs by a fixed decrement for every 5 points scored, starting from the base PIPE_GAP value
3. THE Difficulty_Manager SHALL enforce a minimum gap size of 100 pixels to ensure the Player can always pass through
4. THE Difficulty_Manager SHALL enforce a maximum pipe speed of 6 pixels per frame to ensure the game remains playable
5. WHEN the Game_State transitions from GAME_OVER to START_SCREEN, THE Difficulty_Manager SHALL reset pipe speed and gap size to their base values

### Requirement 2: Screen Shake on Collision

**User Story:** As a player, I want visual impact feedback when I crash, so that the game over moment feels more dramatic.

#### Acceptance Criteria

1. WHEN the Game_State transitions to GAME_OVER due to collision, THE Game SHALL activate Screen_Shake for a duration of 300 milliseconds
2. WHILE Screen_Shake is active, THE Game SHALL apply a random horizontal and vertical offset (between -5 and +5 pixels) to the Canvas rendering origin each frame
3. WHEN Screen_Shake duration expires, THE Game SHALL restore the Canvas rendering origin to its default position (0, 0)

### Requirement 3: Start Grace Period

**User Story:** As a player, I want a brief moment of safety when starting a game, so that I do not collide with a pipe before I have a chance to react.

#### Acceptance Criteria

1. WHEN the Game_State transitions to PLAYING, THE Game SHALL activate a Grace_Period lasting 1500 milliseconds
2. WHILE the Grace_Period is active, THE Game SHALL suppress collision detection between the Player and Pipe_Pairs
3. WHILE the Grace_Period is active, THE Game SHALL render the Player with a flashing opacity effect (alternating between full opacity and 50% opacity) to indicate invincibility
4. WHEN the Grace_Period expires, THE Game SHALL restore normal pipe collision detection
5. WHILE the Grace_Period is active, THE Game SHALL maintain collision detection between the Player and the ground and ceiling boundaries

### Requirement 4: Data Packet Collection Particles

**User Story:** As a player, I want a visual burst effect when I collect a Data Packet, so that the collection feels rewarding.

#### Acceptance Criteria

1. WHEN the Player collects a Data_Packet, THE Particle_System SHALL spawn 8 to 12 Particles at the collected Data_Packet position
2. THE Particle_System SHALL assign each Particle a random outward velocity, a purple color matching the Data_Packet aesthetic, and a lifespan of 400 to 600 milliseconds
3. WHILE a Particle is alive, THE Particle_System SHALL update the Particle position based on its velocity and reduce its opacity linearly toward zero over its lifespan
4. WHEN a Particle lifespan expires, THE Particle_System SHALL remove that Particle from active rendering
5. THE Particle_System SHALL render each active Particle as a small filled circle (2 to 4 pixel radius) on the Canvas

### Requirement 5: Velocity-Based Player Rotation

**User Story:** As a player, I want Ghosty to visually tilt based on movement direction, so that the character feels more alive and responsive.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Rotation_Renderer SHALL rotate the Player sprite based on the Player vertical velocity
2. WHEN the Player velocity is negative (moving upward), THE Rotation_Renderer SHALL apply a rotation between 0 and -30 degrees (nose up), proportional to the upward speed
3. WHEN the Player velocity is positive (moving downward), THE Rotation_Renderer SHALL apply a rotation between 0 and +60 degrees (nose down), proportional to the downward speed
4. THE Rotation_Renderer SHALL clamp the rotation angle to the range of -30 degrees to +60 degrees
5. THE Rotation_Renderer SHALL apply the rotation around the center of the Player sprite using Canvas transform operations

### Requirement 6: Pipe Cap Details

**User Story:** As a player, I want pipes to look more detailed and polished, so that the game visuals feel higher quality.

#### Acceptance Criteria

1. THE Game SHALL render a Pipe_Cap rectangle at the bottom edge of each top pipe, wider than the pipe body by 6 pixels on each side
2. THE Game SHALL render a Pipe_Cap rectangle at the top edge of each bottom pipe, wider than the pipe body by 6 pixels on each side
3. THE Game SHALL render each Pipe_Cap with a height of 20 pixels and the same green color as the pipe body
4. THE Game SHALL include the Pipe_Cap dimensions in collision detection calculations for the Player

### Requirement 7: Parallax Scrolling Background

**User Story:** As a player, I want a layered scrolling background, so that the game world feels deeper and more dynamic.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Parallax_Background SHALL render at least two layers of visual elements (stars or grid lines) scrolling leftward at different speeds
2. THE Parallax_Background SHALL move the back layer at 20% of the current pipe speed and the front layer at 50% of the current pipe speed
3. THE Parallax_Background SHALL seamlessly loop each layer when its content scrolls off the left edge of the Canvas
4. WHILE Steering_Mode is active, THE Game SHALL render the neon matrix grid background instead of the Parallax_Background
5. WHEN Steering_Mode deactivates, THE Game SHALL restore the Parallax_Background rendering

### Requirement 8: Score Popup Animation

**User Story:** As a player, I want a visual "+1" indicator when I pass a pipe, so that score increases are satisfying and clearly communicated.

#### Acceptance Criteria

1. WHEN the Player passes a Pipe_Pair and the Score increments, THE Game SHALL display a Score_Popup element showing "+1" text
2. THE Game SHALL position the Score_Popup initially near the Player horizontal position and slightly above the Player vertical position
3. THE Game SHALL animate the Score_Popup by moving it upward and fading its opacity from 1.0 to 0.0 over a duration of 800 milliseconds
4. WHEN the Score_Popup animation completes, THE Game SHALL remove the Score_Popup element from the DOM

### Requirement 9: Procedural Sound Effects

**User Story:** As a player, I want distinct sound effects for game actions, so that the audio experience is engaging and responsive.

#### Acceptance Criteria

1. WHEN a Flap is triggered, THE Audio_Engine SHALL play a short upward-pitch oscillator tone (sine wave, 300Hz to 500Hz sweep, 80ms duration) using Web Audio API
2. WHEN the Game_State transitions to GAME_OVER, THE Audio_Engine SHALL play a descending-pitch oscillator tone (sawtooth wave, 400Hz to 100Hz sweep, 300ms duration) using Web Audio API
3. WHEN the Player passes a Pipe_Pair and the Score increments, THE Audio_Engine SHALL play a brief high-pitched ping (sine wave, 800Hz, 60ms duration) using Web Audio API
4. THE Audio_Engine SHALL create a single AudioContext instance on first user interaction and reuse it for all procedural sound generation
5. THE Audio_Engine SHALL shape each tone with a GainNode envelope (quick attack, short decay) to prevent audio pops and clicks

### Requirement 10: Steering Mode Activation Sound

**User Story:** As a player, I want an audio cue when Steering Mode activates, so that the power-up moment feels impactful.

#### Acceptance Criteria

1. WHEN Steering_Mode activates, THE Audio_Engine SHALL play a Steering_Whoosh sound effect using a noise-like oscillator sweep (ascending frequency from 200Hz to 1200Hz over 200ms) with a rapid gain fade-out
2. THE Audio_Engine SHALL use a sawtooth or square waveform for the Steering_Whoosh to create a textured whoosh quality

### Requirement 11: Background Gameplay Hum

**User Story:** As a player, I want subtle ambient audio during gameplay, so that the game feels more immersive.

#### Acceptance Criteria

1. WHEN the Game_State transitions to PLAYING, THE Audio_Engine SHALL start a Background_Hum using a low-frequency oscillator (sine wave at 60Hz) at low gain (volume below 10% of maximum)
2. WHILE the Game_State is PLAYING, THE Audio_Engine SHALL sustain the Background_Hum continuously
3. WHEN the Game_State transitions away from PLAYING, THE Audio_Engine SHALL stop the Background_Hum with a short fade-out (100ms) to avoid audio pops
4. THE Audio_Engine SHALL pulse the Background_Hum gain subtly (between 5% and 10% of maximum) at a slow rate to create a rhythmic feel

### Requirement 12: Mobile Touch Support

**User Story:** As a player on a mobile device, I want to play the game using touch controls, so that the game is accessible without a keyboard.

#### Acceptance Criteria

1. WHEN the player touches anywhere on the Canvas, THE Game SHALL treat the touch event as equivalent to a Spacebar press (triggering flap during PLAYING, or state transition during START_SCREEN and GAME_OVER)
2. THE Game SHALL prevent default touch behavior (scrolling, zooming) on the Canvas element during gameplay
3. THE Game SHALL ensure the on-screen Steering Mode activation button is accessible via touch input with a minimum tap target size of 44x44 pixels
4. THE Game SHALL register touch events using the touchstart event type for immediate response without 300ms tap delay

### Requirement 13: Pause Functionality

**User Story:** As a player, I want to pause the game, so that I can take a break without losing my progress.

#### Acceptance Criteria

1. WHEN the player presses the Escape key during the PLAYING state, THE Game SHALL enter the Pause_State
2. WHILE in the Pause_State, THE Game SHALL halt all physics updates, pipe movement, scoring, and timer countdowns
3. WHILE in the Pause_State, THE Game SHALL display a "PAUSED" DOM overlay element centered on the Canvas
4. WHEN the player presses the Escape key during the Pause_State, THE Game SHALL resume the PLAYING state and hide the pause overlay
5. WHILE in the Pause_State, THE Game SHALL continue rendering the last frame (frozen scene) on the Canvas

### Requirement 14: Death Recap Screen

**User Story:** As a player, I want to see my performance after dying and have a moment before restarting, so that I can reflect on my run.

#### Acceptance Criteria

1. WHEN the Game_State transitions to GAME_OVER, THE Game SHALL display a Death_Recap DOM overlay showing the final Score and the High_Score
2. THE Death_Recap SHALL display a countdown timer starting at 3 seconds, decrementing each second
3. WHILE the Death_Recap countdown is active, THE Game SHALL ignore restart inputs (Spacebar, Click, Touch)
4. WHEN the Death_Recap countdown reaches zero, THE Game SHALL enable restart inputs and display a "Press Space or Tap to Restart" prompt
5. WHEN the Player achieves a new High_Score, THE Death_Recap SHALL display a "NEW HIGH SCORE" indicator

### Requirement 15: Smooth State Transitions

**User Story:** As a player, I want smooth fade effects between game states, so that transitions feel polished instead of jarring.

#### Acceptance Criteria

1. WHEN the Game_State transitions from START_SCREEN to PLAYING, THE Game SHALL apply a Fade_Transition by fading the start screen overlay opacity from 1.0 to 0.0 over 400 milliseconds
2. WHEN the Game_State transitions from PLAYING to GAME_OVER, THE Game SHALL apply a Fade_Transition by fading in the Death_Recap overlay opacity from 0.0 to 1.0 over 400 milliseconds
3. WHEN the Game_State transitions from GAME_OVER to START_SCREEN, THE Game SHALL apply a Fade_Transition by cross-fading the Death_Recap out and the start screen in over 400 milliseconds
4. THE Game SHALL implement Fade_Transitions using CSS transition properties on DOM overlay elements
5. WHILE a Fade_Transition is active, THE Game SHALL prevent input events from triggering additional state transitions
