/* app.js - LCD renderer + controls, drives SnakeCore. */
(function () {
  'use strict';
  var lcd = document.getElementById('lcd');
  var ctx = lcd.getContext('2d');
  var W = lcd.width, H = lcd.height;               // 336 x 192
  var COLS = 21, ROWS = 12, CELL = 14, TOP = 24;   // 21*14=294 wide, centered; 12*14=168 + 24 top bar
  var OX = Math.floor((W - COLS * CELL) / 2);

  var C = { bg: '#9bbc0f', faint: '#8bac0f', mid: '#306230', dark: '#0f380f' };

  var best = 0;
  try { best = parseInt(localStorage.getItem('nokiaSnakeBest') || '0', 10) || 0; } catch (e) {}
  var game = SnakeCore.createGame({ cols: COLS, rows: ROWS, best: best });
  var mode = 'attract';          // attract | playing | over
  var timer = null, blink = 0;

  /* tiny beeper */
  var actx = null;
  function beep(freq, ms) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.06, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + ms / 1000);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + ms / 1000);
    } catch (e) {}
  }

  function px(x, y, color) {
    ctx.fillStyle = color || C.dark;
    ctx.fillRect(OX + x * CELL + 1, TOP + y * CELL + 1, CELL - 2, CELL - 2);
  }
  function text(str, x, y, size, color) {
    ctx.fillStyle = color || C.dark;
    ctx.font = (size || 8) + 'px "Press Start 2P", monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(str, x, y);
  }
  function pad3(n) { return ('00' + n).slice(-3); }

  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    // faint LCD grid
    ctx.fillStyle = C.faint;
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++)
      ctx.fillRect(OX + x * CELL + CELL / 2, TOP + y * CELL + CELL / 2, 1, 1);
    // top bar
    ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, 1);
    text('SCORE ' + pad3(game.score), 10, 8);
    text('BEST ' + pad3(game.best), W - 10 - ctx.measureText('BEST ' + pad3(game.best)).width, 8);
    ctx.fillStyle = C.mid; ctx.fillRect(0, TOP - 4, W, 2);

    if (mode !== 'attract') {
      // food (blinks)
      if (game.food && (mode !== 'playing' || Math.floor(blink / 6) % 2 === 0)) px(game.food.x, game.food.y, C.mid);
      // snake
      game.snake.forEach(function (s, i) { px(s.x, s.y, i === 0 ? C.dark : C.mid); });
    }

    if (mode === 'attract') {
      text('SNAKE', W / 2 - ctx.measureText('SNAKE').width / 2, 66, 18);
      text('PRESS START', W / 2 - ctx.measureText('PRESS START').width / 2, 112);
    } else if (mode === 'over') {
      ctx.fillStyle = C.bg; ctx.fillRect(OX, 66, COLS * CELL, 66);
      text('GAME OVER', W / 2 - ctx.measureText('GAME OVER').width / 2, 76, 12);
      text('SCORE ' + game.score, W / 2 - ctx.measureText('SCORE ' + game.score).width / 2, 100);
      text('HIT REPLAY', W / 2 - ctx.measureText('HIT REPLAY').width / 2, 116);
    }
  }

  function loop() {
    if (mode !== 'playing') return;
    var ev = SnakeCore.step(game);
    if (ev.ate) beep(880, 60);
    if (ev.died) {
      mode = 'over';
      beep(196, 250); setTimeout(function () { beep(147, 350); }, 160);
      try { localStorage.setItem('nokiaSnakeBest', String(game.best)); } catch (e) {}
      draw();
      return;
    }
    draw();
    timer = setTimeout(loop, SnakeCore.tickMs(game.score));
  }

  function start() {
    clearTimeout(timer);
    var keepBest = Math.max(game.best, game.score);
    game = SnakeCore.createGame({ cols: COLS, rows: ROWS, best: keepBest });
    mode = 'playing';
    beep(660, 70);
    draw();
    timer = setTimeout(loop, SnakeCore.tickMs(0));
  }
  function startOver() {
    clearTimeout(timer);
    game = SnakeCore.createGame({ cols: COLS, rows: ROWS, best: Math.max(game.best, game.score) });
    mode = 'attract';
    draw();
  }

  function dir(d) { if (mode === 'playing') SnakeCore.changeDir(game, d); }

  document.getElementById('btn-start').addEventListener('click', function () { if (mode !== 'playing') start(); });
  document.getElementById('btn-replay').addEventListener('click', start);
  document.getElementById('btn-over').addEventListener('click', startOver);

  document.querySelectorAll('.nav').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); dir(b.dataset.dir); });
  });

  var KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
               w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
               '2': 'up', '8': 'down', '4': 'left', '6': 'right' };
  document.addEventListener('keydown', function (e) {
    if (KEYS[e.key]) { e.preventDefault(); dir(KEYS[e.key]); }
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (mode !== 'playing') start(); }
  });

  // swipe
  var tsx = 0, tsy = 0;
  lcd.addEventListener('touchstart', function (e) { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; }, { passive: true });
  lcd.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tsx, dy = e.changedTouches[0].clientY - tsy;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    dir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }, { passive: true });

  // idle blink animation on attract/over screens
  setInterval(function () { blink++; if (mode !== 'playing') draw(); else { blink++; draw(); } }, 90);
  draw();
})();
