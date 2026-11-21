// shots.js — deterministic states for screenshots, driven by the URL query:
//   ?shot=start                 the menu / title screen
//   ?shot=play&scene=N&found=k  scene N mid-game with the first k differences already found
//   ?shot=play&scene=N&found=k&hint=1   the same, with a hint pulsing on the next difference
//   ?shot=end                   the win screen with all three scenes complete
// In shot states the clock is frozen so every render is identical.
// Also exposes window.__game, a read-only debug hook for automated play-testing:
// its state() reports the live game state and diffScreenPositions() gives the
// canvas coordinates of every difference on both panels.

import { SCENES, TOTAL_DIFFERENCES } from './scenes.js';
import { PANELS } from './game.js';

export function applyShot(game) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return;
  game.frozen = true;
  if (shot === 'start') {
    game.toMenu();
    return;
  }
  if (shot === 'play') {
    const sceneIndex = Math.min(Math.max(0, Number(params.get('scene') || 0)), SCENES.length - 1);
    const foundCount = Math.min(Math.max(0, Number(params.get('found') || 0)), SCENES[sceneIndex].differences.length);
    game.startGame(sceneIndex);
    game.frozen = true;
    const scene = game.scene();
    const now = performance.now();
    for (let i = 0; i < foundCount; i++) {
      const diff = scene.differences[i];
      game.found.add(diff.id);
      game.foundOrder.push({ id: diff.id, at: now - 5000 }); // long past, so no pop animation
      game.streak = i + 1;
      game.score += 100 + 10 * (i + 1);
      game.totalFound++;
    }
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    game.timeLeft = 105; // a fixed, readable clock for the screenshot
    if (params.get('hint') === '1') {
      const next = scene.differences[foundCount];
      if (next) game.hintPulse = { diff: next, until: Infinity };
    }
    return;
  }
  if (shot === 'end') {
    game.startGame(0);
    game.frozen = true;
    game.score = 2140;
    game.elapsed = 272;
    game.totalFound = TOTAL_DIFFERENCES;
    game.totalWrong = 2;
    game.bestStreak = 7;
    game.sceneResults = SCENES.map((scene, i) => ({
      name: scene.name,
      found: scene.differences.length,
      total: scene.differences.length,
      wrong: i === 1 ? 2 : 0,
      timeBonus: [64, 48, 52][i],
    }));
    game.screen = 'win';
  }
}

/** Debug hook for play-testing: never used by the game itself. */
export function exposeDebugHook(game) {
  window.__game = {
    game,
    state() {
      return {
        screen: game.screen,
        scene: game.sceneIndex,
        sceneName: game.scene().name,
        found: [...game.found],
        remaining: game.remaining(),
        score: game.score,
        streak: game.streak,
        hintsLeft: game.hintsLeft,
        timeLeft: Math.round(game.timeLeft),
        totalFound: game.totalFound,
        totalWrong: game.totalWrong,
      };
    },
    /** Canvas coordinates of every difference, on both panels. */
    diffScreenPositions() {
      return game.scene().differences.map((diff) => ({
        id: diff.id,
        label: diff.label,
        found: game.found.has(diff.id),
        leftX: PANELS.left.x + diff.x,
        leftY: PANELS.left.y + diff.y,
        rightX: PANELS.right.x + diff.x,
        rightY: PANELS.right.y + diff.y,
        r: diff.r,
      }));
    },
  };
}
