// EPA! RK Hunt — um jogo estilo Duck Hunt em Canvas puro.
(() => {
  'use strict';

  const W = 256;
  const H = 240;
  const GRASS_Y = 176;
  const DIRT_Y = 204;

  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // ---------- Escala da tela (inteira, para manter os pixels nítidos) ----------
  function fit() {
    const s = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
    cv.style.width = W * s + 'px';
    cv.style.height = H * s + 'px';
  }
  addEventListener('resize', fit);
  fit();

  // ---------- Fonte bitmap 3x5 ----------
  const FONT = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
    E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
    I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
    Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111',
    0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
    4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
    8: '111101111101111', 9: '111101111001110',
    '!': '010010010000010', '.': '000000000000010', ':': '000010000010000', '-': '000000111000000',
    '/': '001001010100100', '?': '110001010000010', '=': '000111000111000', '+': '000010111010000',
    ' ': '000000000000000',
  };

  function textWidth(str, s) {
    return str.length * 4 * s - s;
  }

  function drawText(str, x, y, s = 1, color = '#fff', align = 'left', shadow = null) {
    str = String(str).toUpperCase();
    if (align === 'center') x -= Math.floor(textWidth(str, s) / 2);
    else if (align === 'right') x -= textWidth(str, s);
    if (shadow) {
      const o = Math.max(1, Math.floor(s / 3));
      drawText(str, x + o, y + o, s, shadow);
    }
    ctx.fillStyle = color;
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]] || FONT[' '];
      for (let p = 0; p < 15; p++) {
        if (g[p] === '1') ctx.fillRect(x + i * 4 * s + (p % 3) * s, y + Math.floor(p / 3) * s, s, s);
      }
    }
  }

  // ---------- Sprites ----------
  function makeSprite(rows, pal) {
    const w = Math.max(...rows.map(r => r.length));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = rows.length;
    const g = c.getContext('2d');
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) {
        const col = pal[r[x]];
        if (col) {
          g.fillStyle = col;
          g.fillRect(x, y, 1, 1);
        }
      }
    });
    return c;
  }

  const HEAD = [
    '.................',
    '.................',
    '...........kkk...',
    '..........kgggk..',
    '..........kgwgk..',
    '..........kgggkyy',
    'kk.......kwwwkyy.',
  ];
  const FRAME_UP = [
    '...kk............',
    '...ktk...........',
    '....ktk....kkk...',
    '....kttk..kgggk..',
    '.....kttk.kgwgk..',
    '.....kttk.kgggkyy',
    'kk....kttkkwwwkyy',
    'kbkkkkkttkbbbbk..',
    '.kbbbbbbbbbbbbk..',
    '.kbbbbbbbbbbbk...',
    '..kbbbbbbbbbk....',
    '...kkkkkkkkk.....',
  ];
  const FRAME_MID = HEAD.concat([
    'kbkkkkkkkbbbbk...',
    '.kkttttttkbbbk...',
    '.kbkkkkkkbbbbk...',
    '..kbbbbbbbbbk....',
    '...kkkkkkkkk.....',
  ]);
  const FRAME_DOWN = HEAD.concat([
    'kbkkkkkkkbbbbk...',
    '.kbbbbbbbbbbbk...',
    '.kbbkttttkbbbk...',
    '..kbkttttkbbk....',
    '...kkttttkkk.....',
    '.....kttk........',
    '......kk.........',
  ]);
  const FRAME_HIT = HEAD.slice(0, 4).concat([
    '..........kkgkk..',
    '..........kgggkyy',
    'kk.......kwwwkyy.',
  ]).concat(FRAME_MID.slice(7));

  const DUCK_TYPES = [
    { name: 'preto', points: 500, speed: 1.0, pal: { k: '#000', b: '#3a3a3a', t: '#c88c4c', g: '#0f8a3a', w: '#fff', y: '#f8b800' } },
    { name: 'azul', points: 1000, speed: 1.25, pal: { k: '#000', b: '#2850c8', t: '#8cd0ff', g: '#0f8a3a', w: '#fff', y: '#f8b800' } },
    { name: 'vermelho', points: 1500, speed: 1.5, pal: { k: '#000', b: '#c03828', t: '#ffa070', g: '#6a2a9a', w: '#fff', y: '#f8b800' } },
  ];
  DUCK_TYPES.forEach(t => {
    const fl = [FRAME_UP, FRAME_MID, FRAME_DOWN, FRAME_MID].map(f => makeSprite(f, t.pal));
    t.frames = fl;
    t.hit = makeSprite(FRAME_HIT, t.pal);
  });
  const DUCK_SCALE = 2;
  const DUCK_W = 17 * DUCK_SCALE;
  const DUCK_H = 13 * DUCK_SCALE;

  const MINI_DUCK = ['....ww.', '....wwy', 'wwwwww.', '.wwww..'];
  const miniWhite = makeSprite(MINI_DUCK, { w: '#fff', y: '#fff' });
  const miniRed = makeSprite(MINI_DUCK, { w: '#ff3030', y: '#ff3030' });
  const miniGray = makeSprite(MINI_DUCK, { w: '#555', y: '#555' });
  const bullet = makeSprite(['.y.', 'yyy', 'yyy', 'ooo', 'ooo', 'ooo'], { y: '#f8d878', o: '#d86020' });

  const logo = new Image();
  logo.src = 'assets/logo-rk.png';

  // ---------- Desenho de cenário ----------
  function disc(g, cx, cy, r, color) {
    g.fillStyle = color;
    for (let y = -r; y <= r; y++) {
      const hw = Math.floor(Math.sqrt(r * r - y * y));
      g.fillRect(cx - hw, cy + y, hw * 2 + 1, 1);
    }
  }

  // Camada de trás (árvore e arbusto) e camada da frente (grama e terra), renderizadas uma vez.
  const back = document.createElement('canvas');
  back.width = W;
  back.height = H;
  (() => {
    const g = back.getContext('2d');
    // Arbusto
    disc(g, 170, 176, 14, '#1f6e1f');
    disc(g, 188, 172, 16, '#1f6e1f');
    disc(g, 172, 174, 11, '#33a033');
    disc(g, 189, 169, 13, '#33a033');
    // Tronco
    g.fillStyle = '#5a3412';
    g.fillRect(22, 70, 14, 110);
    g.fillStyle = '#7a4a1e';
    g.fillRect(24, 70, 8, 110);
    g.fillStyle = '#5a3412';
    g.fillRect(14, 104, 10, 4);
    g.fillRect(36, 92, 12, 4);
    // Copa
    const blobs = [[29, 52, 24], [10, 74, 15], [50, 72, 18], [30, 78, 16], [52, 48, 12]];
    blobs.forEach(([x, y, r]) => disc(g, x, y, r + 2, '#13561a'));
    blobs.forEach(([x, y, r]) => disc(g, x, y, r, '#2e8b2e'));
    [[22, 44, 6], [40, 62, 5], [12, 70, 4], [52, 44, 4], [32, 78, 4]].forEach(([x, y, r]) => disc(g, x, y, r, '#4cb84c'));
  })();

  const front = document.createElement('canvas');
  front.width = W;
  front.height = H;
  (() => {
    const g = front.getContext('2d');
    g.fillStyle = '#3fa82a';
    g.fillRect(0, GRASS_Y, W, DIRT_Y - GRASS_Y);
    for (let x = 0; x < W; x += 2) {
      const h = 5 + ((x * 37) % 9);
      g.fillStyle = x % 6 === 0 ? '#2a7a1c' : '#5ccd33';
      g.fillRect(x, GRASS_Y - h, 2, h);
      g.fillStyle = '#2a7a1c';
      g.fillRect(x, GRASS_Y - h, 1, 2);
    }
    for (let i = 0; i < 120; i++) {
      const x = (i * 53) % W;
      const y = GRASS_Y + ((i * 29) % (DIRT_Y - GRASS_Y - 2));
      g.fillStyle = i % 2 ? '#2a7a1c' : '#5ccd33';
      g.fillRect(x, y, 1, 3);
    }
    g.fillStyle = '#9b5b2b';
    g.fillRect(0, DIRT_Y, W, H - DIRT_Y);
    g.fillStyle = '#7a4520';
    for (let i = 0; i < 160; i++) g.fillRect((i * 71) % W, DIRT_Y + 2 + ((i * 13) % (H - DIRT_Y - 2)), 2, 1);
    g.fillStyle = '#2a7a1c';
    g.fillRect(0, DIRT_Y, W, 2);
  })();

  function drawBillboard() {
    ctx.fillStyle = '#4a2a0e';
    ctx.fillRect(217, 118, 8, 62);
    ctx.fillStyle = '#6a3e16';
    ctx.fillRect(218, 118, 4, 62);
    ctx.fillStyle = '#000';
    ctx.fillRect(196, 72, 50, 50);
    ctx.fillStyle = '#f8d000';
    ctx.fillRect(198, 74, 46, 46);
    if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, 200, 76, 42, 42);
  }

  function drawClouds() {
    const clouds = [[40, 30, 0.6], [140, 18, 1], [210, 46, 0.8]];
    clouds.forEach(([bx, y, sp], i) => {
      const x = ((bx + time * 4 * sp) % (W + 60)) - 30;
      disc(ctx, x, y, 7, '#fff');
      disc(ctx, x + 10, y - 3, 9, '#fff');
      disc(ctx, x + 21, y, 7, '#fff');
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 6, y, 34, 7);
      ctx.fillStyle = '#d8e8ff';
      ctx.fillRect(x - 6, y + 6, 34, 2);
    });
  }

  function drawCrosshair(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    const ring = [[-2, -6], [-1, -6], [0, -6], [1, -6], [2, -6], [-4, -5], [-3, -5], [3, -5], [4, -5],
      [-5, -4], [5, -4], [-5, -3], [5, -3], [-6, -2], [6, -2], [-6, -1], [6, -1], [-6, 0], [6, 0],
      [-6, 1], [6, 1], [-6, 2], [6, 2], [-5, 3], [5, 3], [-5, 4], [5, 4], [-4, 5], [-3, 5], [3, 5], [4, 5],
      [-2, 6], [-1, 6], [0, 6], [1, 6], [2, 6]];
    const cross = [[0, -9], [0, -8], [0, -3], [0, -2], [0, 2], [0, 3], [0, 8], [0, 9],
      [-9, 0], [-8, 0], [-3, 0], [-2, 0], [2, 0], [3, 0], [8, 0], [9, 0], [0, 0]];
    const pts = ring.concat(cross);
    ctx.fillStyle = '#000';
    pts.forEach(([dx, dy]) => ctx.fillRect(x + dx - 1, y + dy - 1, 3, 3));
    ctx.fillStyle = '#fff';
    pts.forEach(([dx, dy]) => ctx.fillRect(x + dx, y + dy, 1, 1));
    ctx.fillStyle = '#ff3030';
    ctx.fillRect(x, y, 1, 1);
  }

  function box(x, y, w, h, border = '#5ccd33') {
    ctx.fillStyle = border;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  }

  function messageBox(lines, y = 70) {
    const s = 2;
    const w = Math.max(...lines.map(l => textWidth(l, s))) + 20;
    const h = lines.length * 14 + 12;
    const x = Math.floor((W - w) / 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, w, h);
    lines.forEach((l, i) => drawText(l, W / 2, y + 8 + i * 14, s, '#fff', 'center'));
  }

  // ---------- Áudio (WebAudio, sem arquivos) ----------
  let ac = null;
  let muted = false;
  function audio() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ac = new AC();
    }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }

  function tone(freq, dur, type = 'square', vol = 0.08, endFreq = null, delay = 0) {
    const a = audio();
    if (!a || muted) return;
    const t0 = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function shotSfx() {
    const a = audio();
    if (!a || muted) return;
    const len = Math.floor(a.sampleRate * 0.25);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = a.createBufferSource();
    src.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3000, a.currentTime);
    f.frequency.exponentialRampToValueAtTime(300, a.currentTime + 0.25);
    const g = a.createGain();
    g.gain.value = 0.5;
    src.connect(f).connect(g).connect(a.destination);
    src.start();
  }

  const sfx = {
    quack() {
      tone(700, 0.08, 'square', 0.05, 450);
      tone(700, 0.08, 'square', 0.05, 450, 0.12);
    },
    hit() { tone(900, 0.1, 'square', 0.06, 1200); },
    fall() { tone(1400, 0.8, 'triangle', 0.08, 180); },
    thud() { tone(120, 0.15, 'square', 0.1, 60); },
    away() { tone(400, 0.12, 'square', 0.05, 300); tone(300, 0.2, 'square', 0.05, 200, 0.14); },
    jingle() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.05, null, i * 0.13)); },
    sad() { [392, 370, 349, 294].forEach((f, i) => tone(f, 0.25, 'square', 0.05, null, i * 0.25)); },
  };

  // ---------- Fases ----------
  const LEVELS = [
    { name: 'FACIL', speed: 1.35, flyTime: 4.2, goal: 4, color: '#5ccd33' },
    { name: 'NORMAL', speed: 1.8, flyTime: 3.5, goal: 4, color: '#8cd0ff' },
    { name: 'MEDIO', speed: 2.3, flyTime: 3.2, goal: 4, color: '#f8d000' },
    { name: 'DIFICIL', speed: 2.9, flyTime: 2.8, goal: 4, color: '#ff8c30' },
    { name: 'IMPOSSIVEL', speed: 3.9, flyTime: 2.3, goal: 3, color: '#ff3030' },
  ];
  const DUCKS_PER_PHASE = 5;

  // ---------- Classificação (salva no navegador) ----------
  const RANK_KEY = 'epa-ranking';
  let ranking = [];
  try { ranking = JSON.parse(localStorage.getItem(RANK_KEY)) || []; } catch (e) { ranking = []; }
  function saveRanking() {
    try { localStorage.setItem(RANK_KEY, JSON.stringify(ranking)); } catch (e) { /* sem armazenamento */ }
  }
  function addToRanking(entry) {
    ranking.push(entry);
    ranking.sort((a, b) => b.score - a.score || a.at - b.at);
    const pos = ranking.indexOf(entry) + 1;
    ranking = ranking.slice(0, 10);
    saveRanking();
    return pos;
  }

  // ---------- Estado do jogo ----------
  const S = { TITLE: 0, NAME: 1, INTRO: 2, PLAY: 3, HIT: 4, FALL: 5, AWAY: 6, NEXT: 7, CLEAR: 8, OVER: 9, WIN: 10 };
  const IN_GAME = [S.INTRO, S.PLAY, S.HIT, S.FALL, S.AWAY, S.NEXT, S.CLEAR];
  let state = S.TITLE;
  let st = 0; // tempo no estado atual
  let time = 0;
  let phase = 0;
  let duckIdx = 0;
  let results = []; // 0 = pendente, 1 = acertou, 2 = fugiu
  let shots = 3;
  let score = 0;
  let duck = null;
  let flash = 0;
  let popups = [];
  let mouse = { x: W / 2, y: H / 2 };
  let lastResult = 0;
  let playerName = '';
  let finalPos = 0;
  let lastEntry = null;
  let overlay = null; // null | 'pause' | 'rank'
  let rankBack = null;
  let clearConfirm = 0;
  let buttons = [];

  const level = () => LEVELS[phase];

  function setState(s) {
    state = s;
    st = 0;
  }

  function startGame() {
    phase = 0;
    score = 0;
    popups = [];
    startPhase();
  }

  function startPhase() {
    results = new Array(DUCKS_PER_PHASE).fill(0);
    duckIdx = 0;
    duck = null;
    setState(S.INTRO);
    sfx.jingle();
  }

  function pickType() {
    const r = Math.random();
    const red = 0.08 + phase * 0.07;
    const blue = 0.25 + phase * 0.03;
    if (r < red) return DUCK_TYPES[2];
    if (r < red + blue) return DUCK_TYPES[1];
    return DUCK_TYPES[0];
  }

  function newDirection(d, forceUp = false) {
    const ang = (20 + Math.random() * 50) * Math.PI / 180;
    const sx = Math.random() < 0.5 ? -1 : 1;
    const sy = forceUp || Math.random() < 0.55 ? -1 : 1;
    d.vx = Math.cos(ang) * d.speed * sx;
    d.vy = Math.sin(ang) * d.speed * sy;
    d.turn = (0.6 + Math.random() * 1.0) / Math.sqrt(level().speed);
  }

  function spawnDuck() {
    const type = pickType();
    duck = {
      type,
      x: 50 + Math.random() * (W - 100 - DUCK_W),
      y: GRASS_Y - 4,
      speed: 60 * level().speed * (1 + (type.speed - 1) * 0.6),
      anim: 0,
      spin: 0,
    };
    newDirection(duck, true);
    shots = 3;
    setState(S.PLAY);
    sfx.quack();
  }

  function flyAway() {
    duck.vx = 0;
    duck.vy = -Math.max(150, duck.speed * 1.5);
    results[duckIdx] = 2;
    lastResult = 2;
    setState(S.AWAY);
    sfx.away();
  }

  function shoot(x, y) {
    if (state !== S.PLAY || shots <= 0) return;
    shots--;
    flash = 0.06;
    shotSfx();
    const pad = 2;
    if (x >= duck.x - pad && x <= duck.x + DUCK_W + pad && y >= duck.y - pad && y <= duck.y + DUCK_H + pad) {
      const pts = duck.type.points * (phase + 1);
      score += pts;
      results[duckIdx] = 1;
      lastResult = 1;
      popups.push({ x: duck.x + DUCK_W / 2, y: duck.y, text: String(pts), t: 0 });
      setState(S.HIT);
      sfx.hit();
    } else if (shots === 0) {
      flyAway();
    }
  }

  function finish(won) {
    lastEntry = { name: playerName, score, phase: phase + 1, level: level().name, won, at: Date.now() };
    finalPos = addToRanking(lastEntry);
    setState(won ? S.WIN : S.OVER);
    if (won) sfx.jingle(); else sfx.sad();
  }

  function nextDuck() {
    duckIdx++;
    if (duckIdx < DUCKS_PER_PHASE) {
      spawnDuck();
      return;
    }
    const hits = results.filter(r => r === 1).length;
    if (hits === DUCKS_PER_PHASE) {
      const bonus = 2000 * (phase + 1);
      score += bonus;
      popups.push({ x: W / 2, y: 130, text: 'PERFEITO! +' + bonus, t: 0 });
    }
    if (hits < level().goal) {
      finish(false);
    } else if (phase === LEVELS.length - 1) {
      score += 10000;
      finish(true);
    } else {
      setState(S.CLEAR);
      sfx.jingle();
    }
  }

  // ---------- Atualização ----------
  function update(dt) {
    time += dt;
    clearConfirm = Math.max(0, clearConfirm - dt);
    if (overlay) return;
    st += dt;
    flash = Math.max(0, flash - dt);
    popups.forEach(p => { p.t += dt; p.y -= 12 * dt; });
    popups = popups.filter(p => p.t < 1.2);

    if (duck) duck.anim += dt;

    switch (state) {
      case S.INTRO:
        if (st > 1.3) spawnDuck();
        break;

      case S.PLAY: {
        const d = duck;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.turn -= dt;
        if (d.x < 0) { d.x = 0; d.vx = Math.abs(d.vx); }
        if (d.x > W - DUCK_W) { d.x = W - DUCK_W; d.vx = -Math.abs(d.vx); }
        if (d.y < 4) { d.y = 4; d.vy = Math.abs(d.vy); }
        const floor = GRASS_Y - DUCK_H - 14;
        if (d.y > floor && st > 0.6) { d.y = floor; d.vy = -Math.abs(d.vy); }
        if (d.turn <= 0) newDirection(d);
        if (Math.random() < dt * 0.4) sfx.quack();
        if (st > level().flyTime) flyAway();
        break;
      }

      case S.HIT:
        if (st > 0.3) {
          setState(S.FALL);
          duck.vy = 60;
          sfx.fall();
        }
        break;

      case S.FALL:
        duck.vy += 320 * dt;
        duck.y += duck.vy * dt;
        duck.spin += dt;
        if (duck.y > GRASS_Y + 4) {
          sfx.thud();
          setState(S.NEXT);
        }
        break;

      case S.AWAY:
        duck.y += duck.vy * dt;
        if (duck.y < -DUCK_H - 10) setState(S.NEXT);
        break;

      case S.NEXT:
        if (st > 0.6) nextDuck();
        break;

      case S.CLEAR:
        if (st > 1.8) {
          phase++;
          startPhase();
        }
        break;
    }
  }

  // ---------- Botões ----------
  function button(label, cx, y, action, opts = {}) {
    const s = opts.scale || 2;
    const w = opts.w || textWidth(label, s) + 16;
    const h = 7 + 5 * s;
    const x = Math.round(cx - w / 2);
    const hover = !opts.disabled && mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
    ctx.fillStyle = opts.disabled ? '#666' : hover ? '#f8d000' : '#fff';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = hover ? '#a03000' : '#000';
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    drawText(label, cx, y + Math.floor((h - 5 * s) / 2), s, opts.disabled ? '#888' : hover ? '#fff' : opts.color || '#fff', 'center');
    if (!opts.disabled) buttons.push({ x, y, w, h, action });
  }

  function openRank() {
    rankBack = overlay;
    overlay = 'rank';
    clearConfirm = 0;
  }

  function goTitle() {
    overlay = null;
    duck = null;
    setState(S.TITLE);
  }

  function goName() {
    overlay = null;
    playerName = '';
    setState(S.NAME);
  }

  function beginWithName() {
    if (!playerName.trim()) return;
    playerName = playerName.trim();
    startGame();
  }

  // ---------- Renderização ----------
  function drawDuck() {
    if (!duck || !IN_GAME.includes(state) || state === S.INTRO || state === S.CLEAR) return;
    if (state === S.NEXT && lastResult === 2) return;
    const d = duck;
    let img;
    let flipX = d.vx < 0;
    let flipY = false;
    if (state === S.HIT) {
      img = d.type.hit;
    } else if (state === S.FALL || (state === S.NEXT && lastResult === 1)) {
      img = d.type.frames[1];
      flipY = true;
      flipX = Math.floor(d.spin * 10) % 2 === 0;
    } else {
      img = d.type.frames[Math.floor(d.anim * 10) % 4];
    }
    ctx.save();
    ctx.translate(Math.round(d.x + DUCK_W / 2), Math.round(d.y + DUCK_H / 2));
    ctx.scale((flipX ? -1 : 1) * DUCK_SCALE, (flipY ? -1 : 1) * DUCK_SCALE);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }

  function drawHud() {
    // Fase e nível
    const label = 'FASE ' + (phase + 1) + ' ' + level().name;
    box(8, 190, textWidth(label, 1) + 8, 11);
    drawText(label, 12, 193, 1, level().color);

    // Jogador
    box(W - 8 - textWidth(playerName, 1) - 8, 190, textWidth(playerName, 1) + 8, 11);
    drawText(playerName, W - 12, 193, 1, '#fff', 'right');

    // Tiros
    box(8, 210, 34, 24);
    for (let i = 0; i < 3; i++) {
      if (i < shots) ctx.drawImage(bullet, 14 + i * 9, 214, 3 * 2, 6 * 2);
    }
    drawText('TIROS', 25, 228, 1, '#5ccd33', 'center');

    // Acertos
    box(46, 210, 128, 24);
    drawText('ACERTO', 50, 214, 1, '#5ccd33');
    for (let i = 0; i < DUCKS_PER_PHASE; i++) {
      const r = results[i] || 0;
      const img = r === 1 ? miniRed : r === 2 ? miniGray : miniWhite;
      const blink = (state === S.PLAY || state === S.HIT) && i === duckIdx && Math.floor(time * 4) % 2;
      if (blink) continue;
      ctx.drawImage(img, 82 + i * 16, 213, 14, 8);
    }
    ctx.fillStyle = '#3c78ff';
    for (let i = 0; i < level().goal; i++) ctx.fillRect(82 + i * 16, 223, 14, 2);
    drawText('META ' + level().goal + '/' + DUCKS_PER_PHASE, 110, 227, 1, '#8cb4ff', 'center');

    // Pontos
    box(178, 210, 70, 24);
    drawText(String(score).padStart(6, '0'), 242, 214, 1, '#fff', 'right');
    drawText('PONTOS', 242, 226, 1, '#5ccd33', 'right');

    // Botão de pausa
    if (!overlay) {
      const x = W - 22;
      const y = 4;
      const hover = mouse.x >= x && mouse.x <= x + 18 && mouse.y >= y && mouse.y <= y + 14;
      box(x, y, 18, 14, hover ? '#f8d000' : '#fff');
      ctx.fillStyle = hover ? '#f8d000' : '#fff';
      ctx.fillRect(x + 6, y + 4, 2, 6);
      ctx.fillRect(x + 10, y + 4, 2, 6);
      buttons.push({ x, y, w: 18, h: 14, action: () => { overlay = 'pause'; } });
    }
  }

  function dim(a = 0.6) {
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTitle() {
    dim(0.55);
    if (logo.complete && logo.naturalWidth) {
      ctx.fillStyle = '#000';
      ctx.fillRect(W / 2 - 26, 6, 52, 52);
      ctx.drawImage(logo, W / 2 - 24, 8, 48, 48);
    }
    drawText('EPA!', W / 2, 64, 5, '#f8d000', 'center', '#a03000');
    drawText('RK HUNT', W / 2, 92, 2, '#fff', 'center', '#000');
    drawText('RK INFORMATICA E GAMES', W / 2, 106, 1, '#f8d000', 'center');
    button('JOGAR', W / 2, 118, goName, { w: 120 });
    button('CLASSIFICACAO', W / 2, 140, openRank, { w: 120 });

    // Tabela de pontos
    drawText('PONTOS POR PASSARO', W / 2, 166, 1, '#8cf', 'center');
    DUCK_TYPES.forEach((t, i) => {
      const x = 40 + i * 64;
      ctx.drawImage(t.frames[Math.floor(time * 8 + i) % 4], x, 176);
      drawText(String(t.points), x + 20, 181, 1, '#fff');
    });
    drawText('X NUMERO DA FASE', W / 2, 196, 1, '#ccc', 'center');

    if (ranking.length) {
      const r = ranking[0];
      drawText('RECORDE: ' + r.name + ' ' + r.score, W / 2, 210, 1, '#f8d000', 'center');
    }
    drawText('M: SOM ' + (muted ? 'OFF' : 'ON') + '   ESC: PAUSA', W / 2, 228, 1, '#ccc', 'center');
  }

  function drawName() {
    dim(0.7);
    drawText('DIGITE SEU NOME', W / 2, 40, 2, '#f8d000', 'center', '#000');
    const fieldW = textWidth('WWWWWWWWWW', 2) + 16;
    const x = Math.round(W / 2 - fieldW / 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 2, 66, fieldW + 4, 24);
    ctx.fillStyle = '#000';
    ctx.fillRect(x, 68, fieldW, 20);
    drawText(playerName, x + 8, 73, 2, '#fff');
    if (Math.floor(time * 2) % 2 === 0 && playerName.length < 10) {
      ctx.fillStyle = '#f8d000';
      ctx.fillRect(x + 8 + playerName.length * 8, 83, 6, 2);
    }
    drawText('ATE 10 LETRAS. ENTER PARA COMECAR', W / 2, 98, 1, '#ccc', 'center');

    drawText('5 FASES', W / 2, 116, 1, '#8cf', 'center');
    LEVELS.forEach((l, i) => drawText((i + 1) + ' ' + l.name, W / 2 - 40, 126 + i * 9, 1, l.color));
    LEVELS.forEach((l, i) => drawText('META ' + l.goal + '/' + DUCKS_PER_PHASE, W / 2 + 60, 126 + i * 9, 1, '#ccc', 'right'));

    button('COMECAR', W / 2 + 46, 178, beginWithName, { w: 80, disabled: !playerName.trim() });
    button('VOLTAR', W / 2 - 46, 178, goTitle, { w: 80 });
  }

  function drawRank() {
    dim(0.85);
    drawText('CLASSIFICACAO', W / 2, 10, 2, '#f8d000', 'center', '#a03000');
    drawText('POS', 18, 32, 1, '#8cf');
    drawText('NOME', 40, 32, 1, '#8cf');
    drawText('FASE', 140, 32, 1, '#8cf');
    drawText('PONTOS', 238, 32, 1, '#8cf', 'right');
    ctx.fillStyle = '#8cf';
    ctx.fillRect(16, 40, 224, 1);
    if (!ranking.length) drawText('NINGUEM JOGOU AINDA', W / 2, 90, 1, '#ccc', 'center');
    ranking.forEach((r, i) => {
      const y = 46 + i * 13;
      const me = r === lastEntry;
      if (me) {
        ctx.fillStyle = '#a03000';
        ctx.fillRect(14, y - 3, 228, 11);
      }
      const color = i === 0 ? '#f8d000' : i === 1 ? '#e0e0e0' : i === 2 ? '#ff9c50' : '#fff';
      drawText((i + 1) + '.', 18, y, 1, color);
      drawText(r.name, 40, y, 1, color);
      const lv = LEVELS[r.phase - 1];
      drawText(r.won ? 'VENCEU' : r.phase + ' ' + r.level, 140, y, 1, r.won ? '#f8d000' : lv ? lv.color : '#fff');
      drawText(String(r.score), 238, y, 1, color, 'right');
    });
    button('VOLTAR', 80, 186, () => { overlay = rankBack; }, { w: 90 });
    button(clearConfirm > 0 ? 'CONFIRMA?' : 'LIMPAR', 176, 186, () => {
      if (clearConfirm > 0) {
        ranking = [];
        lastEntry = null;
        saveRanking();
        clearConfirm = 0;
      } else {
        clearConfirm = 3;
      }
    }, { w: 90, color: '#ff8080' });
  }

  function drawPause() {
    dim(0.65);
    drawText('PAUSADO', W / 2, 50, 3, '#f8d000', 'center', '#a03000');
    button('CONTINUAR', W / 2, 86, () => { overlay = null; }, { w: 130 });
    button('CLASSIFICACAO', W / 2, 110, openRank, { w: 130 });
    button('SAIR', W / 2, 134, goTitle, { w: 130 });
  }

  function drawEnd(won) {
    dim(0.6);
    if (won) drawText('VOCE VENCEU!', W / 2, 30, 3, '#f8d000', 'center', '#a03000');
    else drawText('FIM DE JOGO', W / 2, 30, 3, '#fff', 'center', '#a03000');
    drawText(playerName, W / 2, 58, 2, '#8cf', 'center');
    drawText(score + ' PONTOS', W / 2, 74, 2, '#fff', 'center');
    drawText(won ? 'PASSOU DAS 5 FASES!' : 'PAROU NA FASE ' + (phase + 1) + ' ' + level().name, W / 2, 92, 1, won ? '#f8d000' : level().color, 'center');
    if (finalPos > 0 && finalPos <= 10) {
      drawText(finalPos === 1 ? 'NOVO RECORDE!' : finalPos + ' LUGAR NA CLASSIFICACAO', W / 2, 104, 1, '#f8d000', 'center');
    }
    if (st > 0.8) {
      button('NOVO JOGADOR', W / 2, 120, goName, { w: 130 });
      button('CLASSIFICACAO', W / 2, 142, openRank, { w: 130 });
      button('MENU', W / 2, 164, goTitle, { w: 130 });
    }
  }

  function render() {
    buttons = [];
    // Céu
    ctx.fillStyle = state === S.AWAY || (state === S.NEXT && lastResult === 2) ? '#ffb4a8' : '#5c94fc';
    ctx.fillRect(0, 0, W, H);
    drawClouds();
    ctx.drawImage(back, 0, 0);
    drawBillboard();
    drawDuck();
    ctx.drawImage(front, 0, 0);

    if (IN_GAME.includes(state)) drawHud();

    popups.forEach(p => drawText(p.text, Math.round(p.x), Math.round(p.y), 1, '#fff', 'center', '#000'));

    if (overlay === 'rank') {
      buttons = [];
      drawRank();
    } else if (overlay === 'pause') {
      buttons = [];
      drawPause();
    } else {
      switch (state) {
        case S.TITLE: drawTitle(); break;
        case S.NAME: drawName(); break;
        case S.INTRO: messageBox(['FASE ' + (phase + 1), level().name]); break;
        case S.AWAY: if (st < 1.5) messageBox(['FUGIU!']); break;
        case S.NEXT: messageBox([lastResult === 2 ? 'FUGIU!' : 'PEGOU!']); break;
        case S.CLEAR: messageBox(['MUITO BEM!', 'PROXIMA FASE']); break;
        case S.OVER: drawEnd(false); break;
        case S.WIN: drawEnd(true); break;
      }
    }

    if (flash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.fillRect(0, 0, W, H);
    }

    drawCrosshair(mouse.x, mouse.y);
  }

  // ---------- Entrada ----------
  function toGame(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }

  addEventListener('pointermove', e => { mouse = toGame(e); });
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    audio();
    mouse = toGame(e);
    const b = buttons.find(b => mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h);
    if (b) {
      sfx.hit();
      b.action();
      return;
    }
    if (!overlay) shoot(mouse.x, mouse.y);
  });
  cv.addEventListener('contextmenu', e => e.preventDefault());

  addEventListener('keydown', e => {
    if (state === S.NAME && !overlay) {
      if (e.key === 'Enter') beginWithName();
      else if (e.key === 'Backspace') playerName = playerName.slice(0, -1);
      else if (e.key === 'Escape') goTitle();
      else if (e.key.length === 1 && playerName.length < 10) {
        const ch = e.key.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
        if (/^[A-Z0-9 ]$/.test(ch) && !(ch === ' ' && !playerName)) playerName += ch;
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'm' || e.key === 'M') muted = !muted;
    if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && IN_GAME.includes(state)) {
      if (overlay === 'rank') overlay = rankBack;
      else overlay = overlay ? null : 'pause';
    } else if (e.key === 'Escape' && overlay === 'rank') {
      overlay = rankBack;
    }
  });

  // Pausa sozinho se a janela perder o foco no meio do jogo
  addEventListener('blur', () => {
    if (IN_GAME.includes(state) && !overlay) overlay = 'pause';
  });

  // ---------- Loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Exposto para testes no console
  window.__epa = {
    get state() { return state; }, get duck() { return duck; }, get score() { return score; },
    get phase() { return phase; }, get overlay() { return overlay; }, S,
  };
})();
