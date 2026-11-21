// art.js — every scene is drawn procedurally on a canvas. No images, no assets.
// Each draw function takes (ctx, side): 'left' draws the reference picture,
// 'right' draws the same picture with that scene's 7 differences applied.
// Scene space is 600 x 540 (see scenes.js).

// ------------------------------------------------------------ drawing helpers

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function fillCircle(ctx, x, y, r, color) {
  circle(ctx, x, y, r);
  ctx.fillStyle = color;
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/** A clock face with hands for a given time. */
function clockFace(ctx, cx, cy, r, hour, minute, rim, face) {
  fillCircle(ctx, cx, cy, r + 5, rim);
  fillCircle(ctx, cx, cy, r, face);
  ctx.fillStyle = '#222';
  ctx.font = `bold ${Math.round(r * 0.42)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('12', cx, cy - r * 0.62);
  ctx.fillText('3', cx + r * 0.66, cy);
  ctx.fillText('6', cx, cy + r * 0.62);
  ctx.fillText('9', cx - r * 0.66, cy);
  const minA = (minute / 60) * Math.PI * 2 - Math.PI / 2;
  const hrA = (((hour % 12) + minute / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  line(ctx, cx, cy, cx + Math.cos(hrA) * r * 0.5, cy + Math.sin(hrA) * r * 0.5, '#222', 4);
  line(ctx, cx, cy, cx + Math.cos(minA) * r * 0.8, cy + Math.sin(minA) * r * 0.8, '#222', 3);
  fillCircle(ctx, cx, cy, 3, '#222');
}

/** A gear: toothed wheel in one colour. */
function gear(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillRect(-4, -r - 6, 8, 10);
    ctx.restore();
  }
  fillCircle(ctx, cx, cy, r, color);
  fillCircle(ctx, cx, cy, r * 0.45, '#d9c9a8');
  fillCircle(ctx, cx, cy, r * 0.16, '#8a6d3b');
}

/** A five-point star. */
function star(ctx, cx, cy, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// ------------------------------------------------------------ scene 1: diner

const TRAIN_STARS = [
  [85, 85], [130, 70], [200, 90], [235, 120], [95, 150], [225, 165],
  [150, 200], [110, 215], [240, 210], [175, 235], [80, 190], [205, 130],
];

export function drawDiner(ctx, side) {
  const R = side === 'right';
  // Wall and trim
  ctx.fillStyle = '#f6e3c2';
  ctx.fillRect(0, 0, 600, 470);
  ctx.fillStyle = '#e8452c';
  ctx.fillRect(0, 0, 600, 26);
  ctx.fillStyle = '#f7b731';
  ctx.fillRect(0, 26, 600, 6);
  // Window with a view of the morning street
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(24, 44, 192, 192);
  ctx.fillStyle = '#aee3f5';
  ctx.fillRect(34, 54, 172, 172);
  ctx.fillStyle = '#8fd0e8';
  ctx.fillRect(34, 190, 172, 36); // street
  ctx.fillStyle = '#5b7a3a';
  ctx.fillRect(34, 150, 60, 76); // a tree
  ctx.fillStyle = '#c94f3d';
  ctx.fillRect(150, 176, 56, 50); // a house across the street
  if (!R) {
    // Difference: sun in the window
    fillCircle(ctx, 120, 140, 30, '#ffd93b');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      line(ctx, 120 + Math.cos(a) * 36, 140 + Math.sin(a) * 36,
        120 + Math.cos(a) * 46, 140 + Math.sin(a) * 46, '#ffd93b', 4);
    }
  } else {
    // A grey cloud instead, outlined so it reads against the sky
    ctx.fillStyle = '#eef2f5';
    ctx.strokeStyle = '#9fb2c0';
    ctx.lineWidth = 2;
    ellipse(ctx, 105, 145, 26, 16);
    ctx.fill();
    ctx.stroke();
    ellipse(ctx, 135, 138, 30, 18);
    ctx.fill();
    ctx.stroke();
    ellipse(ctx, 120, 152, 28, 14);
    ctx.fill();
    ctx.stroke();
  }
  line(ctx, 120, 54, 120, 226, '#7a4a21', 6);
  line(ctx, 34, 140, 206, 140, '#7a4a21', 6);
  // Wall clock — difference: the time changes
  if (!R) clockFace(ctx, 280, 95, 36, 3, 0, '#3a2c22', '#fffdf4');
  else clockFace(ctx, 280, 95, 36, 5, 30, '#3a2c22', '#fffdf4');
  // Menu board — difference: the burger line is gone on the right
  ctx.fillStyle = '#2b2b33';
  rr(ctx, 380, 45, 190, 130, 10);
  ctx.fill();
  ctx.fillStyle = '#f4ead8';
  ctx.font = 'bold 19px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PIE    $3.50', 396, 78);
  if (!R) ctx.fillText('BURGER $5.00', 396, 112);
  ctx.fillText('SHAKE  $2.50', 396, 146);
  ctx.fillStyle = '#f7b731';
  ctx.fillRect(396, 58, 158, 3);
  // Counter
  ctx.fillStyle = '#3f8f7a';
  ctx.fillRect(0, 330, 470, 22);
  ctx.fillStyle = '#cfe8dd';
  ctx.fillRect(0, 330, 470, 5);
  ctx.fillStyle = '#fbf3e0';
  ctx.fillRect(0, 352, 470, 118);
  ctx.fillStyle = '#e8452c';
  for (let x = 30; x < 470; x += 60) ctx.fillRect(x, 352, 14, 118);
  // Jukebox
  ctx.fillStyle = '#8e2f5c';
  ctx.beginPath();
  ctx.moveTo(480, 470);
  ctx.lineTo(480, 290);
  ctx.arc(530, 290, 50, Math.PI, 0);
  ctx.lineTo(580, 470);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.moveTo(480, 470);
  ctx.lineTo(480, 290);
  ctx.arc(530, 290, 50, Math.PI, 0);
  ctx.lineTo(580, 470);
  ctx.closePath();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 4;
  ctx.stroke();
  // Difference: the jukebox light strip changes colour
  const bulb = R ? '#2ec4b6' : '#ff4d4d';
  for (let i = 0; i < 5; i++) {
    fillCircle(ctx, 530, 268 + i * 18, 7, bulb);
    fillCircle(ctx, 530, 268 + i * 18, 3, '#ffffff');
  }
  fillCircle(ctx, 505, 400, 26, '#1d1d26');
  fillCircle(ctx, 505, 400, 18, '#e8b4c8');
  fillCircle(ctx, 555, 400, 26, '#1d1d26');
  fillCircle(ctx, 555, 400, 18, '#e8b4c8');
  ctx.fillStyle = '#f4ead8';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('JUKEBOX', 530, 452);
  // Pie case on the counter — difference: cherry becomes blueberry
  ctx.fillStyle = 'rgba(200, 230, 255, 0.35)';
  ctx.beginPath();
  ctx.moveTo(120, 352);
  ctx.arc(190, 352, 70, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#9db8c9';
  ctx.lineWidth = 3;
  ctx.stroke();
  ellipse(ctx, 190, 346, 46, 8, '#d9c9a8');
  ctx.fillStyle = '#d9c9a8';
  ctx.fill();
  ellipse(ctx, 190, 340, 40, 12, R ? '#5b4a8a' : '#c0392b');
  ctx.fillStyle = R ? '#5b4a8a' : '#c0392b';
  ctx.fill();
  ellipse(ctx, 190, 336, 40, 10, R ? '#7a63b0' : '#e05a4d');
  ctx.fillStyle = R ? '#7a63b0' : '#e05a4d';
  ctx.fill();
  ctx.fillStyle = '#3a2c22';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(R ? 'BLUEBERRY' : 'CHERRY', 190, 372);
  // Difference: the ketchup bottle vanishes
  if (!R) {
    ctx.fillStyle = '#c0392b';
    rr(ctx, 318, 306, 24, 46, 8);
    ctx.fill();
    ctx.fillStyle = '#fbf3e0';
    ctx.fillRect(318, 322, 24, 14);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(324, 296, 12, 12);
    ctx.fillStyle = '#fbf3e0';
    ctx.fillRect(324, 292, 12, 6);
  }
  // Coffee pot, same in both pictures
  ctx.fillStyle = '#3a2c22';
  ctx.beginPath();
  ctx.moveTo(424, 352);
  ctx.lineTo(430, 308);
  ctx.lineTo(452, 308);
  ctx.lineTo(458, 352);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1d1d26';
  ctx.fillRect(428, 300, 28, 10);
  ctx.strokeStyle = '#3a2c22';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(460, 330, 12, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // Checkered floor
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 15; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#fbf3e0' : '#d84a35';
      ctx.fillRect(x * 40, 470 + y * 35, 40, 35);
    }
  }
  // Stools — difference: the middle stool disappears
  const stoolXs = R ? [140, 460] : [140, 300, 460];
  for (const sx of stoolXs) {
    ctx.fillStyle = '#8f9aa8';
    ctx.fillRect(sx - 4, 408, 8, 88);
    ellipse(ctx, sx, 500, 30, 8, '#6e7a88');
    ctx.fillStyle = '#6e7a88';
    ctx.fill();
    ctx.fillStyle = '#e8452c';
    ellipse(ctx, sx, 400, 36, 11);
    ctx.fill();
    ctx.fillStyle = '#f7b731';
    ellipse(ctx, sx, 396, 36, 9);
    ctx.fill();
  }
}

// ------------------------------------------------------------ scene 2: train

export function drawTrain(ctx, side) {
  const R = side === 'right';
  // Wood-panelled walls
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(0, 0, 600, 480);
  ctx.fillStyle = '#5a3d26';
  for (let x = 0; x < 600; x += 75) ctx.fillRect(x, 0, 4, 480);
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(0, 300, 600, 10);
  ctx.fillStyle = '#3d2817';
  ctx.fillRect(0, 480, 600, 60);
  // Window with the night sky
  ctx.fillStyle = '#2a1c10';
  ctx.fillRect(54, 54, 212, 212);
  ctx.fillStyle = '#0d1b3a';
  ctx.fillRect(64, 64, 192, 192);
  for (const [sx, sy] of TRAIN_STARS) star(ctx, sx, sy, 3, '#fff7c0');
  if (!R) {
    // Difference: full moon
    fillCircle(ctx, 160, 130, 28, '#f5f0d0');
    fillCircle(ctx, 150, 122, 6, '#d9d2a8');
    fillCircle(ctx, 170, 140, 8, '#d9d2a8');
    fillCircle(ctx, 162, 118, 4, '#d9d2a8');
  } else {
    // Difference: crescent moon (a thick crescent, clearly a moon still)
    fillCircle(ctx, 160, 130, 28, '#f5f0d0');
    fillCircle(ctx, 170, 124, 24, '#0d1b3a');
  }
  // Hills under the moon
  ctx.fillStyle = '#12264d';
  ctx.beginPath();
  ctx.moveTo(64, 256);
  ctx.quadraticCurveTo(140, 200, 200, 240);
  ctx.quadraticCurveTo(230, 256, 256, 256);
  ctx.closePath();
  ctx.fill();
  line(ctx, 160, 64, 160, 256, '#2a1c10', 5);
  line(ctx, 64, 160, 256, 160, '#2a1c10', 5);
  // Difference: the curtain slides further across
  ctx.fillStyle = '#8e2f3c';
  const curtainW = R ? 150 : 62;
  ctx.beginPath();
  ctx.moveTo(40, 50);
  ctx.lineTo(40 + curtainW, 50);
  ctx.lineTo(40 + curtainW - 14, 280);
  ctx.lineTo(40, 280);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a83a48';
  for (let i = 0; i < 4; i++) {
    const fx = 48 + i * (curtainW / 4);
    ctx.fillRect(fx, 56, 5, 218);
  }
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(40, 50, curtainW, 8);
  // Framed picture on the wall
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(282, 76, 56, 66);
  ctx.fillStyle = '#aee3f5';
  ctx.fillRect(288, 82, 44, 54);
  ctx.fillStyle = '#5b7a3a';
  ctx.beginPath();
  ctx.moveTo(288, 136);
  ctx.lineTo(310, 100);
  ctx.lineTo(332, 136);
  ctx.closePath();
  ctx.fill();
  // Luggage rack and suitcase — difference: sticker colour
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(330, 238, 250, 12);
  ctx.fillStyle = '#7a5230';
  rr(ctx, 395, 182, 110, 56, 8);
  ctx.fill();
  ctx.fillStyle = '#5a3d26';
  ctx.fillRect(395, 182, 110, 10);
  line(ctx, 420, 182, 420, 238, '#3d2817', 5);
  line(ctx, 480, 182, 480, 238, '#3d2817', 5);
  fillCircle(ctx, 455, 210, 11, R ? '#2e8b57' : '#c0392b');
  ctx.fillStyle = '#fbf3e0';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PARIS', 455, 214);
  // Hat hook — difference: the hat is gone
  ctx.fillStyle = '#c9a227';
  fillCircle(ctx, 520, 62, 6, '#c9a227');
  if (!R) {
    ctx.fillStyle = '#3a2c22';
    ellipse(ctx, 520, 96, 42, 9);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(520, 96, 22, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(498, 88, 44, 6);
  }
  // Bunk bed
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(330, 280, 12, 200);
  ctx.fillRect(568, 280, 12, 200);
  ctx.fillStyle = '#f4ead8';
  rr(ctx, 342, 372, 226, 44, 8);
  ctx.fill();
  ctx.fillStyle = '#2e6f8e';
  rr(ctx, 342, 392, 226, 78, 8);
  ctx.fill();
  ctx.fillStyle = '#f4ead8';
  rr(ctx, 356, 348, 84, 40, 10);
  ctx.fill();
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(356, 348, 84, 6);
  // Difference: the bedtime book vanishes
  if (!R) {
    ctx.save();
    ctx.translate(470, 390);
    ctx.rotate(-0.25);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-24, -14, 48, 28);
    ctx.fillStyle = '#fbf3e0';
    ctx.fillRect(-20, -10, 40, 20);
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRAINS', 0, 4);
    ctx.restore();
  }
  // Bedside table and lamp — difference: the glow changes colour
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(296, 428, 84, 10);
  ctx.fillRect(332, 438, 8, 42);
  const glow = ctx.createRadialGradient(340, 345, 8, 340, 345, 90);
  glow.addColorStop(0, R ? 'rgba(159, 212, 255, 0.55)' : 'rgba(255, 210, 122, 0.55)');
  glow.addColorStop(1, 'rgba(255, 210, 122, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(250, 255, 180, 180);
  ctx.fillStyle = '#3a2c22';
  ctx.fillRect(336, 372, 8, 56);
  ctx.fillStyle = R ? '#9fd4ff' : '#ffd27a';
  ctx.beginPath();
  ctx.moveTo(312, 372);
  ctx.lineTo(368, 372);
  ctx.lineTo(356, 330);
  ctx.lineTo(324, 330);
  ctx.closePath();
  ctx.fill();
  // Side table with a teacup — difference: the steam is gone
  ctx.fillStyle = '#4a3220';
  ellipse(ctx, 420, 436, 34, 9);
  ctx.fill();
  ctx.fillRect(416, 436, 8, 44);
  ctx.fillStyle = '#f4ead8';
  ellipse(ctx, 420, 428, 16, 5);
  ctx.fill();
  ctx.fillRect(404, 412, 32, 16);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(404, 412, 32, 4);
  if (!R) {
    ctx.strokeStyle = 'rgba(244, 234, 216, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(414, 404);
    ctx.quadraticCurveTo(408, 392, 414, 382);
    ctx.moveTo(426, 404);
    ctx.quadraticCurveTo(432, 392, 426, 382);
    ctx.stroke();
  }
  // Rug
  ctx.fillStyle = '#8e2f3c';
  rr(ctx, 80, 496, 440, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(100, 506, 400, 4);
  ctx.fillRect(100, 520, 400, 4);
  ctx.fillStyle = '#f4ead8';
  for (let x = 120; x < 500; x += 40) {
    ctx.beginPath();
    ctx.arc(x, 513, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ------------------------------------------------------------ scene 3: clockmaker

export function drawClockmaker(ctx, side) {
  const R = side === 'right';
  // Plaster wall and wooden floor
  ctx.fillStyle = '#e8d5b0';
  ctx.fillRect(0, 0, 600, 380);
  ctx.fillStyle = '#d9c9a8';
  ctx.fillRect(0, 372, 600, 8);
  ctx.fillStyle = '#8a6d3b';
  ctx.fillRect(0, 470, 600, 70);
  ctx.fillStyle = '#7a5f33';
  for (let x = 0; x < 600; x += 90) ctx.fillRect(x, 470, 3, 70);
  ctx.fillStyle = '#6e562e';
  ctx.fillRect(0, 500, 600, 3);
  // Window — difference: the bird flies away
  ctx.fillStyle = '#7a5f33';
  ctx.fillRect(34, 54, 152, 172);
  ctx.fillStyle = '#bcd9e8';
  ctx.fillRect(44, 64, 132, 152);
  ctx.fillStyle = '#8fb8c9';
  ctx.fillRect(44, 180, 132, 36);
  line(ctx, 110, 64, 110, 216, '#7a5f33', 5);
  line(ctx, 44, 140, 176, 140, '#7a5f33', 5);
  if (!R) {
    ctx.fillStyle = '#3f6fb5';
    ellipse(ctx, 110, 196, 14, 10);
    ctx.fill();
    fillCircle(ctx, 122, 188, 7, '#3f6fb5');
    ctx.fillStyle = '#f7b731';
    ctx.beginPath();
    ctx.moveTo(129, 188);
    ctx.lineTo(137, 190);
    ctx.lineTo(129, 192);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3f6fb5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(98, 192);
    ctx.lineTo(88, 186);
    ctx.moveTo(98, 194);
    ctx.lineTo(90, 196);
    ctx.stroke();
    ctx.fillStyle = '#2c4f80';
    ctx.fillRect(102, 204, 16, 3);
  }
  // Big wall clock — difference: the time changes
  if (!R) clockFace(ctx, 300, 110, 42, 10, 10, '#b8862f', '#fffdf4');
  else clockFace(ctx, 300, 110, 42, 4, 40, '#b8862f', '#fffdf4');
  // Two small clocks, identical in both pictures
  clockFace(ctx, 452, 92, 24, 7, 25, '#8a6d3b', '#fffdf4');
  clockFace(ctx, 542, 92, 24, 11, 55, '#8a6d3b', '#fffdf4');
  // Blueprint — difference: flat sheet becomes a rolled tube
  if (!R) {
    ctx.fillStyle = '#f4f8ff';
    ctx.fillRect(440, 160, 84, 82);
    ctx.strokeStyle = '#3f6fb5';
    ctx.lineWidth = 2;
    ctx.strokeRect(446, 166, 72, 70);
    circle(ctx, 482, 200, 18);
    ctx.stroke();
    circle(ctx, 482, 200, 6);
    ctx.stroke();
    line(ctx, 452, 224, 512, 224, '#3f6fb5', 2);
    line(ctx, 452, 178, 472, 178, '#3f6fb5', 2);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(440, 160, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(524, 160, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#e8eef7';
    rr(ctx, 446, 188, 76, 26, 13);
    ctx.fill();
    ctx.fillStyle = '#c9d4dc';
    ellipse(ctx, 446, 201, 6, 13);
    ctx.fill();
    ellipse(ctx, 522, 201, 6, 13);
    ctx.fill();
    ctx.strokeStyle = '#8a97a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(446, 188);
    ctx.lineTo(446, 214);
    ctx.moveTo(522, 188);
    ctx.lineTo(522, 214);
    ctx.stroke();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(478, 196, 12, 12);
  }
  // Shelf with jars
  ctx.fillStyle = '#7a5f33';
  ctx.fillRect(40, 262, 220, 10);
  for (let i = 0; i < 3; i++) {
    const jx = 66 + i * 66;
    ctx.fillStyle = 'rgba(200, 220, 235, 0.7)';
    rr(ctx, jx, 224, 34, 38, 6);
    ctx.fill();
    ctx.fillStyle = '#8a6d3b';
    ctx.fillRect(jx, 218, 34, 8);
    gear(ctx, jx + 17, 244, 10, '#b8862f');
  }
  // Pegboard with tools
  ctx.fillStyle = '#c9a86a';
  ctx.fillRect(40, 300, 140, 78);
  ctx.fillStyle = '#8a6d3b';
  for (let y = 312; y < 372; y += 14) {
    for (let x = 52; x < 172; x += 14) fillCircle(ctx, x, y, 2, '#8a6d3b');
  }
  ctx.strokeStyle = '#5a4a2f';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(70, 316);
  ctx.lineTo(70, 356);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 316);
  ctx.lineTo(140, 356);
  ctx.moveTo(140, 316);
  ctx.lineTo(120, 356);
  ctx.stroke();
  // Workbench, running the full width of the scene
  ctx.fillStyle = '#7a5f33';
  ctx.fillRect(0, 380, 600, 20);
  ctx.fillStyle = '#5a4226';
  ctx.fillRect(210, 400, 14, 70);
  ctx.fillRect(576, 400, 14, 70);
  ctx.fillStyle = '#8a6d3b';
  ctx.fillRect(0, 400, 600, 70);
  ctx.strokeStyle = '#5a4226';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 414, 70, 44);
  ctx.strokeRect(110, 414, 70, 44);
  ctx.strokeRect(240, 414, 90, 44);
  ctx.strokeRect(360, 414, 90, 44);
  fillCircle(ctx, 285, 436, 3, '#5a4226');
  fillCircle(ctx, 405, 436, 3, '#5a4226');
  // Scattered small gears on the bench
  gear(ctx, 240, 392, 9, '#b8862f');
  gear(ctx, 350, 394, 8, '#8a6d3b');
  // Difference: a gear vanishes from the bench
  if (!R) gear(ctx, 200, 412, 15, '#b8862f');
  // Difference: the screwdriver handle changes colour
  ctx.save();
  ctx.translate(300, 420);
  ctx.rotate(0.5);
  ctx.fillStyle = R ? '#3f6fb5' : '#c0392b';
  rr(ctx, -26, -7, 26, 14, 6);
  ctx.fill();
  ctx.fillStyle = '#c9c9c9';
  ctx.fillRect(0, -3, 34, 6);
  ctx.fillStyle = '#8a8a8a';
  ctx.beginPath();
  ctx.moveTo(34, -3);
  ctx.lineTo(42, 0);
  ctx.lineTo(34, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Pocket watch — difference: its chain vanishes
  fillCircle(ctx, 420, 404, 20, '#b8862f');
  fillCircle(ctx, 420, 404, 16, '#fffdf4');
  line(ctx, 420, 404, 420, 392, '#222', 2);
  line(ctx, 420, 404, 429, 408, '#222', 2);
  fillCircle(ctx, 420, 404, 2, '#222');
  if (!R) {
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(420, 384);
    ctx.quadraticCurveTo(440, 372, 458, 380);
    ctx.quadraticCurveTo(466, 386, 462, 394);
    ctx.stroke();
    fillCircle(ctx, 458, 380, 3, '#c9a227');
    fillCircle(ctx, 462, 394, 3, '#c9a227');
  }
  // Oil lamp — difference: the flame changes colour
  ctx.fillStyle = '#3a2c22';
  ctx.fillRect(488, 352, 24, 28);
  ctx.fillStyle = 'rgba(200, 220, 235, 0.6)';
  ctx.beginPath();
  ctx.moveTo(490, 352);
  ctx.lineTo(494, 318);
  ctx.lineTo(506, 318);
  ctx.lineTo(510, 352);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = R ? '#5aa8ff' : '#ff8c2e';
  ctx.beginPath();
  ctx.moveTo(500, 268);
  ctx.quadraticCurveTo(512, 286, 500, 300);
  ctx.quadraticCurveTo(488, 286, 500, 268);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = R ? '#bcd9ff' : '#ffd27a';
  ctx.beginPath();
  ctx.moveTo(500, 280);
  ctx.quadraticCurveTo(507, 291, 500, 298);
  ctx.quadraticCurveTo(493, 291, 500, 280);
  ctx.closePath();
  ctx.fill();
}

/** Draw one scene's panel. sceneId is one of the ids in scenes.js. */
export function drawScene(ctx, sceneId, side) {
  if (sceneId === 'diner') drawDiner(ctx, side);
  else if (sceneId === 'train') drawTrain(ctx, side);
  else drawClockmaker(ctx, side);
}
