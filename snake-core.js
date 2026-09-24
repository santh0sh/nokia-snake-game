/* snake-core.js - headless Nokia snake engine. UMD: browser global SnakeCore or require() in node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SnakeCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DIRS = { up: {x:0,y:-1}, down: {x:0,y:1}, left: {x:-1,y:0}, right: {x:1,y:0} };

  function defaultRng() { return Math.random(); }

  function createGame(opts) {
    opts = opts || {};
    var cols = opts.cols || 21, rows = opts.rows || 12;
    var cy = Math.floor(rows / 2);
    var state = {
      cols: cols, rows: rows,
      snake: [ {x:4,y:cy}, {x:3,y:cy}, {x:2,y:cy} ],   // head first
      dir: 'right', pendingDir: 'right',
      food: null, score: 0, best: opts.best || 0,
      alive: true, started: false, justAte: false
    };
    state.rng = opts.rng || defaultRng;
    placeFood(state);
    return state;
  }

  function placeFood(state) {
    var free = [];
    for (var y = 0; y < state.rows; y++)
      for (var x = 0; x < state.cols; x++)
        if (!state.snake.some(function (s) { return s.x === x && s.y === y; }))
          free.push({x:x, y:y});
    state.food = free.length ? free[Math.floor(state.rng() * free.length)] : null;
  }

  function changeDir(state, dir) {
    if (!DIRS[dir]) return false;
    var cur = DIRS[state.dir], nxt = DIRS[dir];
    if (cur.x + nxt.x === 0 && cur.y + nxt.y === 0) return false; // no 180 turns
    state.pendingDir = dir;
    return true;
  }

  function step(state) {
    if (!state.alive) return { died: true, ate: false };
    state.started = true;
    state.dir = state.pendingDir;
    var d = DIRS[state.dir];
    var head = { x: state.snake[0].x + d.x, y: state.snake[0].y + d.y };
    state.justAte = false;

    var hitWall = head.x < 0 || head.x >= state.cols || head.y < 0 || head.y >= state.rows;
    var hitSelf = state.snake.some(function (s) { return s.x === head.x && s.y === head.y; });
    if (hitWall || hitSelf) {
      state.alive = false;
      if (state.score > state.best) state.best = state.score;
      return { died: true, ate: false };
    }

    state.snake.unshift(head);
    var ate = state.food && head.x === state.food.x && head.y === state.food.y;
    if (ate) {
      state.score += 1;
      state.justAte = true;
      placeFood(state);
    } else {
      state.snake.pop();
    }
    return { died: false, ate: !!ate };
  }

  /* Nokia ramp: starts lazy, tightens with every bite, floors at 70ms. */
  function tickMs(score) {
    return Math.max(70, 190 - 5 * (score || 0));
  }

  return { DIRS: DIRS, createGame: createGame, changeDir: changeDir, step: step, tickMs: tickMs, placeFood: placeFood };
}));
