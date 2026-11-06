import assert from 'node:assert/strict';
import test from 'node:test';
import { idlePercent } from './arena-benchmark-idle.mjs';

test('idle sampling averages cumulative CPU time across cores', () => {
	const before = [
		{ times: { user: 20, nice: 0, sys: 10, idle: 70, irq: 0 } },
		{ times: { user: 20, nice: 0, sys: 10, idle: 70, irq: 0 } }
	];
	const after = [
		{ times: { user: 40, nice: 0, sys: 15, idle: 145, irq: 0 } },
		{ times: { user: 20, nice: 0, sys: 10, idle: 170, irq: 0 } }
	];
	assert.equal(idlePercent(before, after), 87);
	assert.throws(() => idlePercent(before, before), /CPU time/);
	assert.throws(() => idlePercent(after, before), /CPU time/);
	assert.throws(() => idlePercent(before, after.slice(1)), /CPU count/);
});
