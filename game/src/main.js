// main.js — boots the game: canvas, state, input, screenshots, then the loop.
import { Game } from './game.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { applyShot, exposeDebugHook } from './shots.js';

const canvas = document.getElementById('game');
const fallback = document.getElementById('fallback');
const ctx = canvas.getContext('2d');

if (!ctx) {
  if (fallback) fallback.style.display = 'block';
} else {
  const game = new Game();
  applyShot(game);
  exposeDebugHook(game);
  attachInput(canvas, game);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(100, now - last);
    last = now;
    game.tick(dt, now);
    render(ctx, game, now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
