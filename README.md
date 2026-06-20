# Flappy Kiro

![Flappy Kiro Gameplay](img/example-ui.png)

A Flappy Bird-style browser game featuring Ghosty, a neon-purple spirit navigating through pipes in a dark retro world. Collect Data Packets to charge Steering Mode, grab power-ups like Shield, Slow-Motion, and Magnet, and compete on the online leaderboard. Built with vanilla JavaScript, HTML5 Canvas, and Web Audio API.

## Controls

| Input | Action |
|-------|--------|
| Spacebar / Click / Touch | Flap (jump upward) |
| Escape | Pause / Resume |
| Shift | Activate Steering Mode (when fully charged) |

## Features

- **Steering Mode** — Collect Data Packets to charge autopilot with invincibility
- **Power-ups** — Shield (absorbs one hit), Slow-Motion (half speed for 4s), Magnet (attracts Data Packets)
- **Day/Night Cycle** — Smooth 60-second sinusoidal transition between night and day backgrounds
- **Themed Worlds** — 4 color themes that cycle every 50 points with fade transitions
- **Trail Effect** — Purple trailing circles behind Ghosty during flight
- **Pipe Color Gradient** — Pipes shift from green to red as speed increases
- **Chiptune Music** — Procedurally generated pentatonic melody using Web Audio oscillators
- **Death Animation** — Ghosty spins and falls with gravity before the recap screen
- **Online Leaderboard** — Submit scores and view top 10 via Firebase
- **Object Pooling** — Pre-allocated particle and pipe pools for zero-allocation gameplay
- **Responsive Canvas** — Scales to fit any viewport while maintaining 2:3 aspect ratio
- **Accessibility** — ARIA labels, reduced motion support, keyboard-focusable controls
- **PWA Support** — Installable as a standalone app with offline caching

## How to Run Locally

The game is a static single-page app with no build step required.

**Option 1 — Open directly:**

```bash
# Just open index.html in your browser
open index.html
```

**Option 2 — Local server (recommended for full PWA features):**

```bash
npx serve .
```

Then navigate to `http://localhost:3000` in your browser.

## Deployment

The game is deployed to GitHub Pages via GitHub Actions. Every push to `main` triggers an automatic deployment.

**Live URL:** [https://\<username\>.github.io/buildNights/](https://<username>.github.io/buildNights/)

## Project Structure

```
├── index.html          # Game page with canvas and UI overlays
├── style.css           # Styling for overlays and layout
├── app.js              # All game logic (single-file architecture)
├── assets/             # Sprites and audio files
│   ├── ghosty.png      # Ghosty sprite
│   ├── jump.wav        # Flap sound effect
│   └── game_over.wav   # Death sound effect
└── img/
    └── example-ui.png  # Gameplay screenshot
```

## License

See [LICENCE.md](LICENCE.md) for details.
