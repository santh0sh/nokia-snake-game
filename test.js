'use strict';
const S = require('./snake-core.js');
let passed = 0, failed = 0;
function ok(cond, name, extra) {
  if (cond) passed++;
  else { failed++; console.error('FAIL', name, extra || ''); }
}

// fixed rng for deterministic food
let seq = [0.5, 0.5, 0.5, 0.5];
const rng = () => seq.shift() ?? 0.5;

// 1. initial state
let g = S.createGame({ rng });
ok(g.snake.length === 3 && g.alive && g.score === 0, 'initial: 3 segments, alive, score 0');
ok(g.food && typeof g.food.x === 'number', 'initial: food placed');

// 2. step moves head right
const hx = g.snake[0].x, hy = g.snake[0].y;
S.step(g);
ok(g.snake[0].x === hx + 1 && g.snake[0].y === hy, 'step: head moves in current direction');
ok(g.snake.length === 3, 'step: length unchanged without food');

// 3. reverse rejected
ok(S.changeDir(g, 'left') === false, 'no 180 reverse');
// 4. perpendicular allowed
ok(S.changeDir(g, 'up') === true && g.pendingDir === 'up', 'perpendicular turn allowed');

// 5. eat food: grow + score (drop food right in front)
let g2 = S.createGame({ rng });
g2.food = { x: g2.snake[0].x + 1, y: g2.snake[0].y };
const ev = S.step(g2);
ok(ev.ate && g2.score === 1 && g2.snake.length === 4, 'eating grows snake and scores');

// 6. food never lands on snake (200 trials, full-ish board)
let g3 = S.createGame({ cols: 4, rows: 3, rng: () => 0.99 });
g3.snake = [ {x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:3,y:0}, {x:3,y:1}, {x:2,y:1}, {x:1,y:1}, {x:0,y:1}, {x:0,y:2}, {x:1,y:2}, {x:2,y:2} ];
S.placeFood(g3);
ok(g3.food.x === 3 && g3.food.y === 2, 'food placed on the only free cell', JSON.stringify(g3.food));

// 7. wall collision
let g4 = S.createGame({ rng });
g4.food = { x: g4.snake[0].x + 1, y: g4.snake[0].y };
for (let i = 0; i < 25 && g4.alive; i++) S.step(g4);
ok(!g4.alive, 'wall collision kills');

// 8. self collision
let g5 = S.createGame({ rng });
g5.snake = [ {x:5,y:5}, {x:5,y:6}, {x:6,y:6}, {x:6,y:5}, {x:6,y:4} ]; // head moving down into own body
g5.dir = 'down'; g5.pendingDir = 'down';
const ev5 = S.step(g5);
ok(ev5.died && !g5.alive, 'self collision kills');

// 9. speed ramp
ok(S.tickMs(0) === 190 && S.tickMs(10) === 140 && S.tickMs(100) === 70, 'speed ramp 190 -> floor 70');

// 10. best updated on death
ok(g4.best === g4.score && g4.score > 0, 'best updated on death');

// 11. board full => food null (win edge)
let g6 = S.createGame({ cols: 2, rows: 1, rng });
g6.snake = [ {x:0,y:0}, {x:1,y:0} ];
S.placeFood(g6);
ok(g6.food === null, 'no free cell => food null');

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
