import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpus } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout } from 'node:timers/promises';

export function idlePercent(before, after) {
	assert.equal(before.length, after.length, 'CPU count changed');
	let idle = 0;
	let total = 0;
	for (let index = 0; index < before.length; index++)
		for (const field of Object.keys(before[index].times)) {
			const elapsed = after[index].times[field] - before[index].times[field];
			assert(Number.isFinite(elapsed) && elapsed >= 0, 'CPU time went backwards');
			total += elapsed;
			if (field === 'idle') idle += elapsed;
		}
	assert(total > 0, 'CPU time did not advance');
	return Math.floor((idle / total) * 100);
}

export async function waitForIdle(directory, minimum = 75) {
	assert(directory, 'measured directory required');
	assert(Number.isFinite(minimum) && minimum >= 0 && minimum <= 100, 'invalid idle threshold');
	const deadline = Date.now() + 115000;
	do {
		const before = cpus();
		await setTimeout(1000);
		const idle = idlePercent(before, cpus());
		let watchers = [];
		try {
			watchers = execFileSync('infigraph', ['ps'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
				.split('\n')
				.filter((line) => line.trim().split(/\s+/)[1] === 'live' && line.includes(directory));
		} catch (error) {
			if (error.code !== 'ENOENT') throw error;
		}
		if (idle >= minimum && !watchers.length) return `idle ${idle}%`;
		console.error(`waiting for idle: ${idle}% idle, ${watchers.length} matching watchers`);
		await setTimeout(5000);
	} while (Date.now() < deadline);
	throw new Error('idle gate timed out');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
	console.log(await waitForIdle(process.argv[2], Number(process.argv[3] ?? 75)));
