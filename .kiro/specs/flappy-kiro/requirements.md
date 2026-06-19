# Requirements Document

## Introduction

Flappy Kiro is a browser-based arcade game inspired by Flappy Bird. The player controls a character (rendered as a sprite) that must navigate through an endless series of vertical pipe obstacles by applying upward impulses. The game is delivered as a single-page vanilla JavaScript application with a dark-themed retro aesthetic rendered on an HTML5 Canvas. The game features a "Steering Mode" power-up mechanic where collecting Data Packets charges a meter that, once full, grants temporary autopilot navigation and invincibility.

## Glossary

- **Game**: The Flappy Kiro single-page application consisting of `index.html`, `style.css`, and `app.js`
- **Canvas**: The HTML5 `<canvas>` element used as the primary rendering surface with a 2D drawing context
- **Player**: The game character rendered using the `assets/ghosty.png` sprite image
- **Pipe_Pair**: A vertical obstacle consisting of a top pipe and a bottom pipe with a gap between them, rendered as green rectangles
- **Game_State**: The current phase of the game, one of: START_SCREEN, PLAYING, or GAME_OVER
- **Score**: An integer counter representing the number of Pipe_Pairs the Player has successfully passed
- **High_Score**: The highest Score achieved, persisted across sessions via localStorage
- **Flap**: An upward impulse applied to the Player velocity in response to user input
- **Gravity**: A constant downward acceleration applied to the Player each frame
- **Terminal_Velocity**: The maximum downward speed the Player can reach
- **Game_Loop**: The animation cycle driven by `requestAnimationFrame` that updates and renders the game each frame
- **Data_Packet**: A collectible power-up item rendered as a glowing purple circle that spawns randomly between Pipe_Pair gaps
- **Steering_Charge**: A percentage-based meter (0% to 100%) representing the accumulated energy from collected Data_Packets, displayed as a horizontal progress bar at the top of the screen
- **Steering_Mode**: A temporary power-up state lasting 5 seconds that activates when Steering_Charge reaches 100% and the player triggers activation, granting Autopilot and invincibility
- **Autopilot**: A behavior during Steering_Mode where the Game automatically adjusts the Player Y-velocity to navigate safely through upcoming Pipe_Pairs without player input

## Requirements

### Requirement 1: Application Structure

**User Story:** As a developer, I want the game delivered as a single-page app with three files, so that the codebase remains simple and dependency-free.

#### Acceptance Criteria

1. THE Game SHALL consist of exactly three files: `index.html`, `style.css`, and `app.js`
2. THE Game SHALL use vanilla JavaScript with no external frameworks or libraries
3. THE Game SHALL use a modular, function-based architecture within `app.js`

### Requirement 2: Canvas Rendering

**User Story:** As a player, I want the game rendered on an HTML5 Canvas with a dark retro look, so that the visual experience feels like a classic arcade game.

#### Acceptance Criteria

1. THE Game SHALL render all game visuals on an HTML5 Canvas element using the 2D rendering context
2. THE Game SHALL apply a dark-themed retro aesthetic to the Canvas background and visual elements
3. THE Game SHALL render the Player using the `assets/ghosty.png` sprite image

### Requirement 3: Game State Management

**User Story:** As a player, I want clear game states so that I know when the game is waiting to start, actively playing, or ended.

#### Acceptance Criteria

1. THE Game SHALL implement a state machine with exactly three states: START_SCREEN, PLAYING, and GAME_OVER
2. WHEN the Game loads, THE Game SHALL enter the START_SCREEN state
3. WHEN the player provides input during the START_SCREEN state, THE Game SHALL transition to the PLAYING state
4. WHEN a collision is detected, THE Game SHALL transition from PLAYING to the GAME_OVER state
5. WHEN the player provides input during the GAME_OVER state, THE Game SHALL transition to the START_SCREEN state

### Requirement 4: Game Loop

**User Story:** As a player, I want smooth animation, so that the gameplay feels responsive and fluid.

#### Acceptance Criteria

1. THE Game SHALL drive the Game_Loop using `requestAnimationFrame`
2. WHILE the Game_State is PLAYING, THE Game_Loop SHALL update Player position, Pipe_Pair positions, collision detection, and scoring each frame
3. WHILE the Game_State is PLAYING, THE Game_Loop SHALL render all game objects each frame

### Requirement 5: Player Physics

**User Story:** As a player, I want realistic gravity and responsive jumping, so that controlling the character feels satisfying.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Game SHALL apply constant Gravity acceleration to the Player velocity each frame
2. WHILE the Game_State is PLAYING, THE Game SHALL cap the Player downward velocity at Terminal_Velocity
3. WHEN the player presses the Spacebar, THE Game SHALL apply an upward impulse to the Player velocity
4. WHEN the player clicks the mouse, THE Game SHALL apply an upward impulse to the Player velocity

### Requirement 6: Pipe Obstacles

**User Story:** As a player, I want an endless stream of pipe obstacles, so that the game provides continuous challenge.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Game SHALL generate Pipe_Pairs at regular intervals with randomized vertical gap positions
2. THE Game SHALL render each Pipe_Pair as green rectangles (top pipe extending down from the ceiling, bottom pipe extending up from the ground)
3. WHILE the Game_State is PLAYING, THE Game SHALL move all Pipe_Pairs leftward at a constant speed each frame
4. WHEN a Pipe_Pair moves entirely off the left edge of the Canvas, THE Game SHALL remove that Pipe_Pair from active rendering

### Requirement 7: Collision Detection

**User Story:** As a player, I want accurate collision detection, so that the game feels fair.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Game SHALL check for collision between the Player and each Pipe_Pair every frame
2. WHILE the Game_State is PLAYING, THE Game SHALL check for collision between the Player and the ground boundary every frame
3. WHILE the Game_State is PLAYING, THE Game SHALL check for collision between the Player and the ceiling boundary every frame
4. WHEN the Player collides with a Pipe_Pair, the ground, or the ceiling, THE Game SHALL trigger Game Over

### Requirement 8: Scoring

**User Story:** As a player, I want to see my score increase as I pass pipes, so that I have a measure of progress.

#### Acceptance Criteria

1. WHEN the Player passes a Pipe_Pair (the Player horizontal position exceeds the Pipe_Pair trailing edge), THE Game SHALL increment the Score by 1
2. THE Game SHALL display the current Score on the Canvas during the PLAYING state
3. THE Game SHALL display the High_Score alongside the current Score in the format "Score: X | High: Y"

### Requirement 9: High Score Persistence

**User Story:** As a player, I want my high score saved between sessions, so that I can track my best performance over time.

#### Acceptance Criteria

1. WHEN the Game_State transitions to GAME_OVER, THE Game SHALL compare the current Score to the stored High_Score
2. WHEN the current Score exceeds the stored High_Score, THE Game SHALL save the new High_Score to localStorage
3. WHEN the Game loads, THE Game SHALL retrieve the High_Score from localStorage

### Requirement 10: Sound Effects

**User Story:** As a player, I want audio feedback for key actions, so that the game feels more engaging.

#### Acceptance Criteria

1. WHEN a Flap is triggered, THE Game SHALL play the `assets/jump.wav` audio file
2. WHEN the Game_State transitions to GAME_OVER, THE Game SHALL play the `assets/game_over.wav` audio file

### Requirement 11: Data Packet Spawning

**User Story:** As a player, I want collectible power-up items to appear during gameplay, so that I have an additional objective beyond avoiding pipes.

#### Acceptance Criteria

1. WHILE the Game_State is PLAYING, THE Game SHALL spawn Data_Packets at random positions within the vertical gap of Pipe_Pairs
2. THE Game SHALL render each Data_Packet as a glowing purple circle on the Canvas
3. WHILE the Game_State is PLAYING, THE Game SHALL move all Data_Packets leftward at the same speed as Pipe_Pairs each frame
4. WHEN a Data_Packet moves entirely off the left edge of the Canvas, THE Game SHALL remove that Data_Packet from active rendering
5. WHEN the Player overlaps a Data_Packet, THE Game SHALL remove that Data_Packet from the Canvas

### Requirement 12: Steering Charge Meter

**User Story:** As a player, I want a visible charge meter that fills as I collect Data Packets, so that I can track my progress toward activating the power-up.

#### Acceptance Criteria

1. THE Game SHALL display a Steering_Charge meter as a horizontal progress bar at the top of the screen using HTML and CSS elements
2. THE Game SHALL initialize the Steering_Charge value to 0% at the start of each game session
3. WHEN the Player collects a Data_Packet, THE Game SHALL increase the Steering_Charge value by 25%
4. THE Game SHALL cap the Steering_Charge value at a maximum of 100%
5. THE Game SHALL visually update the progress bar width to reflect the current Steering_Charge percentage each frame

### Requirement 13: Steering Mode Activation

**User Story:** As a player, I want to activate Steering Mode when my charge meter is full, so that I can gain a temporary advantage.

#### Acceptance Criteria

1. WHEN the Steering_Charge reaches 100% and the player presses the Shift key, THE Game SHALL activate Steering_Mode
2. WHEN the Steering_Charge reaches 100% and the player taps the on-screen activation button, THE Game SHALL activate Steering_Mode
3. WHILE the Steering_Charge is below 100%, THE Game SHALL ignore Shift key presses and activation button taps for Steering_Mode activation
4. WHEN Steering_Mode activates, THE Game SHALL set a 5-second duration timer for the Steering_Mode state

### Requirement 14: Steering Mode Autopilot Behavior

**User Story:** As a player, I want the character to navigate automatically during Steering Mode, so that I get a brief reprieve from manual control.

#### Acceptance Criteria

1. WHILE Steering_Mode is active, THE Game SHALL automatically adjust the Player Y-velocity to guide the Player through the vertical gap of the next upcoming Pipe_Pair
2. WHILE Steering_Mode is active, THE Game SHALL override manual Flap inputs from the player
3. WHILE Steering_Mode is active, THE Game SHALL continue applying Autopilot adjustments each frame until the Steering_Mode duration expires

### Requirement 15: Steering Mode Invincibility

**User Story:** As a player, I want to be invincible during Steering Mode, so that I can pass through obstacles without penalty.

#### Acceptance Criteria

1. WHILE Steering_Mode is active, THE Game SHALL disable collision detection between the Player and Pipe_Pairs
2. WHILE Steering_Mode is active, THE Game SHALL render the Player with a translucent purple visual effect
3. WHILE Steering_Mode is active, THE Game SHALL maintain collision detection between the Player and the ground and ceiling boundaries

### Requirement 16: Steering Mode Depletion

**User Story:** As a player, I want the Steering Mode to gradually deplete and end naturally, so that the power-up feels balanced.

#### Acceptance Criteria

1. WHILE Steering_Mode is active, THE Game SHALL drain the Steering_Charge meter linearly from 100% to 0% over the 5-second duration
2. WHEN the Steering_Charge meter reaches 0%, THE Game SHALL deactivate Steering_Mode
3. WHEN Steering_Mode deactivates, THE Game SHALL restore normal Gravity, manual Player controls, and Pipe_Pair collision detection

### Requirement 17: Steering Mode Visual Feedback

**User Story:** As a player, I want clear visual feedback when Steering Mode is active, so that I can easily identify the power-up state.

#### Acceptance Criteria

1. WHEN Steering_Mode activates, THE Game SHALL change the Canvas background from the dark theme to a neon matrix grid visual
2. WHEN Steering_Mode deactivates, THE Game SHALL restore the Canvas background to the dark theme
3. WHILE Steering_Mode is active, THE Game SHALL maintain the neon matrix grid background for the entire 5-second duration

### Requirement 18: Steering Mode Modular Implementation

**User Story:** As a developer, I want all Steering Mode logic handled through modular functions, so that the code remains maintainable and organized.

#### Acceptance Criteria

1. THE Game SHALL implement Data_Packet spawning, movement, and collection as a dedicated modular function in `app.js`
2. THE Game SHALL implement Steering_Charge tracking and meter updates as a dedicated modular function in `app.js`
3. THE Game SHALL implement Steering_Mode activation, Autopilot behavior, invincibility, and depletion as dedicated modular functions in `app.js`
4. THE Game SHALL implement the neon matrix grid background rendering as a dedicated modular function in `app.js`
