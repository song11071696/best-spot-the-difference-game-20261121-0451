// game.js — the state machine: screens, scoring, timer, hints, streaks.
// Pure logic; rendering lives in render.js, input in input.js.

import { SCENES, SCENE_W, SCENE_H, TOTAL_DIFFERENCES } from './scenes.js';
import { SoundBank } from './audio.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;
/** Where the two picture panels sit on the 1280x800 canvas (scene space is 600x540). */
export const PANELS = {
  left: { x: 24, y: 88, w: SCENE_W, h: SCENE_H },
  right: { x: 656, y: 88, w: SCENE_W, h: SCENE_H },
};
export const SCENE_TIME = 120; // seconds on the clock for each scene
export const HINTS_PER_SCENE = 3;

export class Game {
  constructor() {
    this.sounds = new SoundBank();
    this.screen = 'menu'; // 'menu' | 'play' | 'win'
    this.sceneIndex = 0;
    this.found = new Set(); // difference ids found in the current scene
    this.foundOrder = []; // ids in the order they were found (for animations)
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.hintsLeft = HINTS_PER_SCENE;
    this.timeLeft = SCENE_TIME;
    this.totalFound = 0;
    this.totalWrong = 0;
    this.elapsed = 0; // seconds played across all scenes
    this.sceneResults = []; // {name, found, total, wrong, timeBonus}
    this.sceneWrong = 0;
    this.hintPulse = null; // {diff, until} — a hint ring pulsing on one unfound difference
    this.wrongMarks = []; // {x, y, panel, until} — red X marks fading out
    this.shakeUntil = 0;
    this.toast = null; // {text, until}
    this.crosshair = { x: 324, y: 358 }; // canvas coords (starts mid left panel)
    this.crosshairUsed = false;
    this.sceneDone = false;
    this.frozen = false; // screenshot mode: the clock never runs down
    this.muted = false;
    this.sceneStart = 0;
  }

  scene() {
    return SCENES[this.sceneIndex];
  }

  remaining() {
    return this.scene().differences.length - this.found.size;
  }

  /** Start a fresh run from the menu. */
  startGame(sceneIndex = 0) {
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.totalFound = 0;
    this.totalWrong = 0;
    this.elapsed = 0;
    this.sceneResults = [];
    this.startScene(sceneIndex);
  }

  startScene(index) {
    this.sceneIndex = index;
    this.found = new Set();
    this.foundOrder = [];
    this.hintsLeft = HINTS_PER_SCENE;
    this.timeLeft = SCENE_TIME;
    this.sceneWrong = 0;
    this.sceneDone = false;
    this.hintPulse = null;
    this.wrongMarks = [];
    this.screen = 'play';
    this.sceneStart = performance.now();
  }

  /** Check a point in scene coordinates on one panel. Returns 'found' | 'already' | 'miss'. */
  checkPoint(sx, sy) {
    if (this.screen !== 'play' || this.sceneDone) return 'ignored';
    for (const diff of this.scene().differences) {
      if (this.found.has(diff.id)) continue;
      const dx = sx - diff.x;
      const dy = sy - diff.y;
      if (dx * dx + dy * dy <= diff.r * diff.r) {
        this.found.add(diff.id);
        this.foundOrder.push({ id: diff.id, at: performance.now() });
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        const points = 100 + 10 * this.streak;
        this.score += points;
        this.totalFound++;
        this.sounds.found();
        this.showToast(`${diff.label}! +${points}`);
        if (this.remaining() === 0) this.completeScene();
        return 'found';
      }
    }
    // A miss: small penalty, streak resets, red X + shake.
    this.score = Math.max(0, this.score - 25);
    this.streak = 0;
    this.totalWrong++;
    this.sceneWrong++;
    this.shakeUntil = performance.now() + 300;
    this.sounds.wrong();
    this.showToast('Not a difference. -25');
    return 'miss';
  }

  /** Record a wrong click's screen position so render can draw the red X. */
  markWrong(canvasX, canvasY) {
    this.wrongMarks.push({ x: canvasX, y: canvasY, until: performance.now() + 700 });
  }

  completeScene() {
    this.sceneDone = true;
    const timeBonus = Math.round(this.timeLeft) * 2;
    this.score += timeBonus;
    this.sceneResults.push({
      name: this.scene().name,
      found: this.found.size,
      total: this.scene().differences.length,
      wrong: this.sceneWrong,
      timeBonus,
    });
    this.sounds.sceneClear();
    this.showToast(`Scene clear! Time bonus +${timeBonus}`);
  }

  /** Move on: next scene, or the win screen after the last one. */
  nextScene() {
    if (!this.sceneDone) {
      // Leaving early: bank the partial result.
      this.sceneResults.push({
        name: this.scene().name,
        found: this.found.size,
        total: this.scene().differences.length,
        wrong: this.sceneWrong,
        timeBonus: 0,
      });
    }
    if (this.sceneIndex + 1 < SCENES.length) {
      this.startScene(this.sceneIndex + 1);
    } else {
      this.finishGame();
    }
  }

  finishGame() {
    this.screen = 'win';
    this.sounds.win();
  }

  /** Stars: 3 for a near-perfect run, 2 for a good one, 1 otherwise. */
  stars() {
    if (this.totalWrong <= 2 && this.elapsed <= 480) return 3;
    if (this.totalWrong <= 8) return 2;
    return 1;
  }

  useHint() {
    if (this.screen !== 'play' || this.sceneDone) return false;
    if (this.hintsLeft <= 0) {
      this.showToast('No hints left in this scene');
      return false;
    }
    const unfound = this.scene().differences.filter((d) => !this.found.has(d.id));
    if (unfound.length === 0) return false;
    const pick = unfound[Math.floor(Math.random() * unfound.length)];
    this.hintsLeft--;
    this.hintPulse = { diff: pick, until: this.frozen ? Infinity : performance.now() + 2600 };
    this.sounds.hint();
    this.showToast('Hint: look where the ring pulses');
    return true;
  }

  showToast(text) {
    this.toast = { text, until: performance.now() + 1800 };
  }

  toggleMute() {
    this.muted = !this.muted;
    this.sounds.setMuted(this.muted);
    this.showToast(this.muted ? 'Sound off (M to turn on)' : 'Sound on');
  }

  toMenu() {
    this.screen = 'menu';
    this.hintPulse = null;
    this.wrongMarks = [];
  }

  /** Advance the clock and expire short-lived effects. dt is in milliseconds. */
  tick(dt, now) {
    if (this.screen === 'play' && !this.frozen && !this.sceneDone) {
      this.timeLeft -= dt / 1000;
      this.elapsed += dt / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.showToast("Time's up! Moving on…");
        this.nextScene();
        return;
      }
    }
    if (this.hintPulse && now > this.hintPulse.until) this.hintPulse = null;
    this.wrongMarks = this.wrongMarks.filter((m) => now < m.until);
    if (this.toast && now > this.toast.until) this.toast = null;
  }
}
