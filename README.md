# CSIWP
(full name not revealed yet >:D)

A pixel art rage platformer built with HTML5 Canvas 2D.

## Play

Open `index.html` in a localhost or [visit the hosted version on CRZ.Network](https://crz.network:21212/csiwp/).

## Controls

| Action | Keyboard | Controller |
|--------|----------|------------|
| Move | A/D or Arrow Keys | Left Stick / D-Pad |
| Jump | Space / W / Up | A / B |
| Skip Splash | Space | A / Start |

## Project Structure

```
index.html          - Game entry point
editor.html         - Level editor (drag to draw, exports JSON)
js/
  game.js           - Game loop, state machine, camera
  player.js         - Player physics & input
  renderer.js       - Sprite drawing, platform tiling
  sprites.js        - Sprite sheet loader
  camera.js         - Smooth follow camera with easing
  level.js          - Level data
  text.js           - Bitmap font renderer (csiwp-text.png)
  titlescreen.js    - Title screen with logo + badge drop
  splash.js         - CRZ.Network splash
  splash2.js        - Random message splash (+ bee movie easter egg)
  deatheffect.js    - Fragment shatter/reassemble on death
  respawn.js        - Respawn animation (blue channel = opacity)
  gamepad.js        - Controller support via Gamepad API
gamesprites.png     - Game sprite sheet (8x8 tiles)
csiwp-text.png      - Bitmap font + CRZ.Network logo
csiwp.png           - Game logo
logobadges.png      - Version badges (DEMO/BETA/ALPHA/UNAUTHORIZED)
generate_bee.py     - Generates bee.txt from the Bee Movie script
```

## Level Editor

The editor should be easy to use.

## Easter Eggs

- Add `?bee` to the URL to force the Bee Movie script splash

- Add `#bad` to the URL to force the Bad URL changes.

## Building

No build step. Just serve the files with any static HTTP server.

```bash
python3 -m http.server 8000
```

## Music Credit

- The current temporary music the game uses is Chaoz Fantasy by ParagonX9. It is licensed under CC-BY-SA.