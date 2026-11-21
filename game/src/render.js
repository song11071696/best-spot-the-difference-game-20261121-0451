// render.js — draws every screen on the canvas: menu, play, win.
// Panels are pre-rendered once per scene into offscreen canvases (see art.js);
// markers, HUD, hints and buttons are drawn fresh every frame.

import { SCENES, SCENE_W, SCENE_H } from './scenes.js';
import { PANELS, VIEW_W, VIEW_H } from './game.js';
import { drawScene } from './art.js';

const GOLD = '#f7b731';
const INK = '#f4ead8';
const GREEN = '#37d67a';
const RED = '#ff5a4d';
const PANEL_BG = '#1d1830';

const panelCache = new Map();

/** The pre-rendered picture for one scene and side, cached for the session. */
export function getPanelCanvas(sceneId, side) {
  const key = `${sceneId}:${side}`;
  let canvas = panelCache.get(key);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = SCENE_W;
    canvas.height = SCENE_H;
    drawScene(canvas.getContext('2d'), sceneId, side);
    panelCache.set(key, canvas);
  }
  return canvas;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function withCommas(n) {
  return n.toLocaleString('en-US');
}

/** The clickable buttons/cards on the current screen, for input.js hit-testing. */
export function hitTargets(game) {
  if (game.screen === 'menu') {
    return SCENES.map((scene, i) => ({
      id: `scene-${i}`,
      x: 40 + i * 420,
      y: 280,
      w: 360,
      h: 380,
    }));
  }
  if (game.screen === 'play') {
    return [
      { id: 'hint', x: 636, y: 676, w: 138, h: 56 },
      { id: 'next', x: 790, y: 676, w: 150, h: 56 },
      { id: 'restart', x: 956, y: 676, w: 140, h: 56 },
      { id: 'sound', x: 1112, y: 676, w: 144, h: 56 },
    ];
  }
  // win screen
  return [
    { id: 'again', x: 400, y: 620, w: 200, h: 56 },
    { id: 'menu', x: 680, y: 620, w: 200, h: 56 },
  ];
}

function drawButton(ctx, target, label, opts = {}) {
  const { x, y, w, h } = target;
  const accent = opts.accent || false;
  ctx.fillStyle = accent ? GOLD : '#2e2650';
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = accent ? '#d99a12' : '#4a3f7d';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = accent ? '#241a00' : INK;
  ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
}

function drawFoundRing(ctx, px, py, diff, scale, now, foundAt) {
  const age = now - foundAt;
  const pop = age < 260 ? 1 + (1 - age / 260) * 0.45 : 1;
  const r = (diff.r + 8) * pop * scale;
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(px - r * 0.45, py);
  ctx.lineTo(px - r * 0.1, py + r * 0.35);
  ctx.lineTo(px + r * 0.5, py - r * 0.35);
  ctx.stroke();
}

function drawPanels(ctx, game, now) {
  const scene = game.scene();
  const shake = now < game.shakeUntil ? (Math.random() * 8 - 4) : 0;
  for (const [name, panel] of Object.entries(PANELS)) {
    ctx.drawImage(getPanelCanvas(scene.id, name), panel.x + shake, panel.y, panel.w, panel.h);
    ctx.strokeStyle = '#4a3f7d';
    ctx.lineWidth = 3;
    ctx.strokeRect(panel.x + shake, panel.y, panel.w, panel.h);
    // Panel tag
    ctx.fillStyle = 'rgba(20, 14, 40, 0.85)';
    rr(ctx, panel.x + 10 + shake, panel.y + 10, 74, 30, 8);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name === 'left' ? 'LEFT' : 'RIGHT', panel.x + 47 + shake, panel.y + 26);
  }
  // VS badge between the panels
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(640, 358, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241a00';
  ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VS', 640, 359);
  // Found markers on BOTH panels
  for (const entry of game.foundOrder) {
    const diff = scene.differences.find((d) => d.id === entry.id);
    if (!diff) continue;
    drawFoundRing(ctx, PANELS.left.x + diff.x + shake, PANELS.left.y + diff.y, diff, 1, now, entry.at);
    drawFoundRing(ctx, PANELS.right.x + diff.x + shake, PANELS.right.y + diff.y, diff, 1, now, entry.at);
  }
  // Hint pulse on BOTH panels
  if (game.hintPulse) {
    const diff = game.hintPulse.diff;
    const pulse = 10 + 6 * Math.sin(now / 160);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 7]);
    for (const panel of Object.values(PANELS)) {
      ctx.beginPath();
      ctx.arc(panel.x + diff.x + shake, panel.y + diff.y, diff.r + pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  // Wrong-click red X marks
  for (const mark of game.wrongMarks) {
    const alpha = Math.max(0, (mark.until - now) / 700);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = RED;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mark.x - 14, mark.y - 14);
    ctx.lineTo(mark.x + 14, mark.y + 14);
    ctx.moveTo(mark.x + 14, mark.y - 14);
    ctx.lineTo(mark.x - 14, mark.y + 14);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Keyboard crosshair
  if (game.crosshairUsed) {
    const { x, y } = game.crosshair;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 22, y);
    ctx.lineTo(x - 8, y);
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + 22, y);
    ctx.moveTo(x, y - 22);
    ctx.lineTo(x, y - 8);
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x, y + 22);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTopBar(ctx, game) {
  const scene = game.scene();
  ctx.fillStyle = INK;
  ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPOT THE DIFFERENCE', 24, 36);
  ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = scene.accent === '#e8452c' ? '#ff8a70' : scene.accent;
  ctx.fillText(scene.name, 640, 28);
  ctx.fillStyle = '#b9b0d8';
  ctx.font = '15px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`Scene ${game.sceneIndex + 1} of ${SCENES.length}`, 640, 54);
  // Stats on the right: time, score, streak
  const stats = [
    { label: 'TIME', value: formatTime(game.timeLeft), danger: game.timeLeft < 30 },
    { label: 'SCORE', value: withCommas(game.score), danger: false },
    { label: 'STREAK', value: `×${game.streak}`, danger: false },
  ];
  let sx = 880;
  for (const stat of stats) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#b9b0d8';
    ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(stat.label, sx, 22);
    ctx.fillStyle = stat.danger ? RED : INK;
    ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(stat.value, sx, 50);
    sx += stat.label === 'TIME' ? 110 : 130;
  }
}

function drawBottomBar(ctx, game, now) {
  const scene = game.scene();
  const left = game.remaining();
  // Big counter
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = left === 0 ? GREEN : GOLD;
  ctx.font = 'bold 46px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`${left} LEFT`, 24, 690);
  ctx.fillStyle = '#b9b0d8';
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`of ${scene.differences.length} differences in this scene`, 24, 730);
  // Found pips
  scene.differences.forEach((diff, i) => {
    const px = 330 + i * 34;
    const py = 700;
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    if (game.found.has(diff.id)) {
      ctx.fillStyle = GREEN;
      ctx.fill();
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px - 5, py);
      ctx.lineTo(px - 1, py + 4);
      ctx.lineTo(px + 6, py - 4);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#6a5f9e';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
  // Buttons
  const targets = hitTargets(game);
  drawButton(ctx, targets[0], `HINT (${game.hintsLeft})`, { accent: game.hintsLeft > 0 });
  drawButton(ctx, targets[1], game.sceneDone ? 'NEXT ▸' : 'NEXT', { accent: game.sceneDone });
  drawButton(ctx, targets[2], 'RESTART');
  drawButton(ctx, targets[3], game.muted ? 'SOUND OFF' : 'SOUND ON');
  // Toast pill
  if (game.toast) {
    const alpha = Math.min(1, (game.toast.until - now) / 400);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
    const w = ctx.measureText(game.toast.text).width + 44;
    ctx.fillStyle = 'rgba(20, 14, 40, 0.92)';
    rr(ctx, 640 - w / 2, 756, w, 34, 17);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText(game.toast.text, 640, 774);
    ctx.globalAlpha = 1;
  }
}

function drawSceneClearBanner(ctx, game) {
  ctx.fillStyle = 'rgba(20, 14, 40, 0.72)';
  ctx.fillRect(24, 300, 1232, 116);
  ctx.fillStyle = GREEN;
  ctx.font = 'bold 44px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SCENE CLEAR!', 640, 338);
  ctx.fillStyle = INK;
  ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
  const last = game.sceneResults[game.sceneResults.length - 1];
  ctx.fillText(
    last ? `Time bonus +${last.timeBonus}  •  Press N or click NEXT for the next scene`
      : 'Press N or click NEXT for the next scene',
    640, 384,
  );
}

function drawPlay(ctx, game, now) {
  drawTopBar(ctx, game);
  drawPanels(ctx, game, now);
  if (game.sceneDone) drawSceneClearBanner(ctx, game);
  drawBottomBar(ctx, game, now);
}

function drawMenu(ctx, game, now) {
  // Decorative stars
  for (let i = 0; i < 40; i++) {
    const x = (i * 317) % 1280;
    const y = (i * 173) % 800;
    ctx.fillStyle = `rgba(247, 183, 49, ${0.12 + (i % 3) * 0.08})`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 74px Georgia, serif';
  ctx.fillText('SPOT THE DIFFERENCE', 640, 118);
  ctx.fillStyle = INK;
  ctx.font = '22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Three hand-drawn scenes. Seven sneaky changes in each. Find them all.', 640, 176);
  ctx.fillStyle = '#b9b0d8';
  ctx.font = '17px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Click a difference on either picture — a green ring marks it on both sides.', 640, 210);
  // Scene cards
  SCENES.forEach((scene, i) => {
    const x = 40 + i * 420;
    const y = 280;
    ctx.fillStyle = '#241d3a';
    rr(ctx, x, y, 360, 380, 16);
    ctx.fill();
    ctx.strokeStyle = scene.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.drawImage(getPanelCanvas(scene.id, 'left'), x + 20, y + 20, 320, 288);
    ctx.strokeStyle = '#4a3f7d';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 20, y + 20, 320, 288);
    ctx.fillStyle = INK;
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText(scene.name, x + 180, y + 340);
    ctx.fillStyle = '#b9b0d8';
    ctx.font = '15px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`${scene.tagline} • 7 differences`, x + 180, y + 366);
  });
  void now;
  ctx.fillStyle = '#b9b0d8';
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Mouse: click to check a spot  •  Arrow keys move the crosshair, Enter checks it', 640, 706);
  ctx.fillText('H hint  •  N next scene  •  R restart  •  M mute  •  Wrong clicks cost 25 points', 640, 734);
}

function drawWin(ctx, game, now) {
  ctx.fillStyle = '#241d3a';
  rr(ctx, 290, 80, 700, 640, 20);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 56px Georgia, serif';
  ctx.fillText('CASE CLOSED!', 640, 150);
  ctx.fillStyle = INK;
  ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('You found every difference in all three scenes.', 640, 196);
  // Stars
  const stars = game.stars();
  for (let i = 0; i < 3; i++) {
    const sx = 640 + (i - 1) * 84;
    ctx.fillStyle = i < stars ? GOLD : '#4a3f7d';
    ctx.beginPath();
    for (let p = 0; p < 10; p++) {
      const a = (p / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = p % 2 === 0 ? 30 : 14;
      const px = sx + Math.cos(a) * rad;
      const py = 250 + Math.sin(a) * rad;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = INK;
  ctx.font = 'bold 34px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`TOTAL SCORE  ${withCommas(game.score)}`, 640, 318);
  ctx.fillStyle = '#b9b0d8';
  ctx.font = '19px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(
    `Time ${formatTime(game.elapsed)}  •  Best streak ×${game.bestStreak}  •  ${game.totalFound} found, ${game.totalWrong} misses`,
    640, 356,
  );
  // Per-scene rows
  game.sceneResults.forEach((row, i) => {
    const y = 408 + i * 44;
    ctx.fillStyle = '#2e2650';
    rr(ctx, 360, y - 18, 560, 36, 8);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.font = '18px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(row.name, 378, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = row.found === row.total ? GREEN : GOLD;
    ctx.fillText(
      `${row.found}/${row.total} found  •  time bonus +${row.timeBonus}`,
      902, y,
    );
  });
  ctx.textAlign = 'center';
  const targets = hitTargets(game);
  drawButton(ctx, targets[0], 'PLAY AGAIN', { accent: true });
  drawButton(ctx, targets[1], 'MENU');
  void now;
}

/** Draw the current screen. */
export function render(ctx, game, now) {
  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === 'menu') drawMenu(ctx, game, now);
  else if (game.screen === 'play') drawPlay(ctx, game, now);
  else drawWin(ctx, game, now);
}
