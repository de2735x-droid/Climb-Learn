import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAABB,
  calculateJumpImpulse,
  calculateBouncyImpulse,
  calculateScore,
  calculateGrade,
  createPRNG,
  generateProceduralSpire,
  PHYSICS,
} from './rules';

test('checkAABB detects overlapping and non-overlapping bounding boxes', () => {
  const boxA = { x: 100, y: 100, w: 50, h: 50 };
  const boxB = { x: 120, y: 110, w: 50, h: 50 }; // overlapping
  const boxC = { x: 200, y: 200, w: 50, h: 50 }; // far away

  assert.equal(checkAABB(boxA, boxB), true);
  assert.equal(checkAABB(boxA, boxC), false);
});

test('calculateJumpImpulse scales velocity smoothly with charge and direction', () => {
  const zeroJump = calculateJumpImpulse(0, 1);
  assert.equal(zeroJump.vx, 0);
  assert.equal(zeroJump.vy, -8.0);

  const fullJumpRight = calculateJumpImpulse(1.0, 1);
  assert.ok(fullJumpRight.vx > 7.5);
  assert.ok(fullJumpRight.vy < -20.0);

  const fullJumpLeft = calculateJumpImpulse(1.0, -1);
  assert.ok(fullJumpLeft.vx < -7.5);
  assert.equal(fullJumpLeft.vy, fullJumpRight.vy);
});

test('calculateBouncyImpulse delivers sufficient upward launch without infinite velocity', () => {
  const bounceSlow = calculateBouncyImpulse(5);
  const bounceFast = calculateBouncyImpulse(18);

  assert.ok(bounceSlow <= -16.5);
  assert.ok(bounceFast >= -22.0); // clamped
});

test('calculateScore calculates altitude, gems, questions and rewards victory', () => {
  const scoreA = calculateScore({
    maxAltitude: 100,
    gemsCollected: 5,
    questionsCorrect: 3,
    falls: 1,
    timeSeconds: 60,
    victory: false,
  });

  // 100 * 10 = 1000
  // 5 * 150 = 750
  // 3 * 400 = 1200
  // falls: -75
  // Total = 2875
  assert.equal(scoreA, 2875);

  const scoreVictory = calculateScore({
    maxAltitude: 2000,
    gemsCollected: 10,
    questionsCorrect: 5,
    falls: 0,
    timeSeconds: 100,
    victory: true,
  });
  assert.ok(scoreVictory > 20000);
});

test('calculateGrade assigns correct grade tier', () => {
  assert.equal(calculateGrade(13000, true, 0.9), 'SSS');
  assert.equal(calculateGrade(10000, true, 0.8), 'SS');
  assert.equal(calculateGrade(7500, false, 0.8), 'S');
  assert.equal(calculateGrade(5000, false, 0.6), 'A');
  assert.equal(calculateGrade(3000, false, 0.5), 'B');
  assert.equal(calculateGrade(1000, false, 0.2), 'C');
});

test('PRNG generator is deterministic for identical seeds', () => {
  const rng1 = createPRNG(1337);
  const rng2 = createPRNG(1337);
  
  const seq1 = [rng1(), rng1(), rng1(), rng1()];
  const seq2 = [rng2(), rng2(), rng2(), rng2()];

  assert.deepEqual(seq1, seq2);
});

test('generateProceduralSpire produces reachable ascent platforms and summit', () => {
  const { platforms, collectibles } = generateProceduralSpire(777, 1500, 640);
  assert.ok(platforms.length > 5);
  assert.ok(collectibles.length > 0);

  // Check that every consecutive platform's vertical gap is strictly within maximum jump reach
  for (let i = 1; i < platforms.length; i++) {
    const prev = platforms[i - 1];
    const curr = platforms[i];
    const dy = Math.abs(curr.y - prev.y);
    assert.ok(dy <= PHYSICS.MAX_VERTICAL_REACH, `Platform ${curr.id} dy ${dy} exceeded max reach ${PHYSICS.MAX_VERTICAL_REACH}`);
  }
});
