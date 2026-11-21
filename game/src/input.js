// input.js — mouse clicks and keyboard play, plus button hit-testing.
// Converts page coordinates to canvas coordinates, then to scene coordinates.

import { PANELS, VIEW_W, VIEW_H } from './game.js';
import { hitTargets } from './render.js';

function canvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  };
}

/** Which panel (if any) a canvas point is over, and its scene coordinates. */
function panelAt(x, y) {
  for (const [name, panel] of Object.entries(PANELS)) {
    if (x >= panel.x && x < panel.x + panel.w && y >= panel.y && y < panel.y + panel.h) {
      return { name, sx: x - panel.x, sy: y - panel.y };
    }
  }
  return null;
}

function handleButton(game, id) {
  switch (id) {
    case 'hint':
      game.useHint();
      return true;
    case 'next':
      game.nextScene();
      return true;
    case 'restart':
      game.startGame(game.sceneIndex);
      return true;
    case 'sound':
      game.toggleMute();
      return true;
    case 'again':
      game.startGame(0);
      return true;
    case 'menu':
      game.toMenu();
      return true;
    default:
      if (id.startsWith('scene-')) {
        game.startGame(Number(id.slice(6)));
        return true;
      }
      return false;
  }
}

export function attachInput(canvas, game) {
  canvas.addEventListener('pointerdown', (event) => {
    game.sounds.ensure();
    const { x, y } = canvasPoint(canvas, event.clientX, event.clientY);
    // Buttons and menu cards first.
    for (const target of hitTargets(game)) {
      if (x >= target.x && x < target.x + target.w && y >= target.y && y < target.y + target.h) {
        game.sounds.tick();
        handleButton(game, target.id);
        return;
      }
    }
    if (game.screen !== 'play') return;
    const hit = panelAt(x, y);
    if (!hit) return;
    const result = game.checkPoint(hit.sx, hit.sy);
    if (result === 'miss') game.markWrong(x, y);
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key;
    if (game.screen === 'menu' && ['1', '2', '3'].includes(key)) {
      game.startGame(Number(key) - 1);
      return;
    }
    if (key === 'm' || key === 'M') {
      game.toggleMute();
      return;
    }
    if (key === 'r' || key === 'R') {
      if (game.screen === 'play' || game.screen === 'win') game.startGame(game.screen === 'win' ? 0 : game.sceneIndex);
      return;
    }
    if (game.screen !== 'play') return;
    if (key === 'h' || key === 'H') {
      game.useHint();
      return;
    }
    if (key === 'n' || key === 'N') {
      game.nextScene();
      return;
    }
    const step = event.shiftKey ? 40 : 12;
    if (key.startsWith('Arrow')) {
      event.preventDefault();
      game.crosshairUsed = true;
      if (key === 'ArrowLeft') game.crosshair.x = Math.max(0, game.crosshair.x - step);
      if (key === 'ArrowRight') game.crosshair.x = Math.min(VIEW_W, game.crosshair.x + step);
      if (key === 'ArrowUp') game.crosshair.y = Math.max(0, game.crosshair.y - step);
      if (key === 'ArrowDown') game.crosshair.y = Math.min(VIEW_H, game.crosshair.y + step);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      game.crosshairUsed = true;
      const hit = panelAt(game.crosshair.x, game.crosshair.y);
      if (!hit) return;
      const result = game.checkPoint(hit.sx, hit.sy);
      if (result === 'miss') game.markWrong(game.crosshair.x, game.crosshair.y);
    }
  });
}
