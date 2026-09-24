# Nokia Snake

Old Nokia 3310 style snake game in a single page. Monochrome green LCD, pixel font, phone keypad, beeps included. No build step, no dependencies - plain HTML/CSS/JS, hostable on GitHub Pages.

Live: https://santh0sh.github.io/nokia-snake-game/

## Play

- **START** begins, **REPLAY** restarts after game over, **START OVER** resets to the title screen.
- Steer with arrow keys, WASD, the on-screen d-pad, keypad 2-4-6-8, or swipe on the screen.
- Snake speeds up with every bite. Best score is saved in your browser (localStorage).

## Run locally

Open `index.html` in any browser. No server needed.

## Deploy to GitHub Pages (from your phone)

1. Open the repo: https://github.com/santh0sh/nokia-snake-game
2. Tap **Add file > Upload files** and upload these 4 files (all in the zip root, no folders):
   - `index.html`
   - `style.css`
   - `snake-core.js`
   - `app.js`
   (`README.md`, `LICENSE`, `test.js` and `.gitignore` are optional extras - the game does not need them.)
3. Repo **Settings > Pages > Build and deployment**: Source = **Deploy from a branch**, Branch = **main / (root)**, Save.
4. Wait a minute, then open https://santh0sh.github.io/nokia-snake-game/

## Tests

Core game logic (movement, growth, collisions, speed ramp, food placement) is covered by `test.js`:

```
node test.js    # 13 checks
```
