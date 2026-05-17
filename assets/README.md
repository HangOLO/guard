# Assets

This prototype mostly uses code-generated Canvas assets. The title screen uses one user-provided image file:

- `title-screen-concept.png` is the full-screen title art for the opening screen.
- `runner-background.png` is the night pixel-art background used by the runner scene.
- `runner-background.prompt.txt` records the background generation brief.

- `src/modules/asset.js` contains the visual manifest and drawing helpers for the tomb, guards, player character, runway, and atmosphere.
- Audio is generated at runtime with Web Audio in `src/modules/audio.js`.
- No hosted, login-gated, or build-time assets are required.

The approach keeps the project runnable as plain `HTML/CSS/JS` while still giving each game state visible custom art.
