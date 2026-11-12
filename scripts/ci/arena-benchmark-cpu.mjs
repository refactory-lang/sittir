import { execFileSync } from 'node:child_process';
import os from 'node:os';

export function lscpuFacts(text) {
	const lines = text.split('\n');
	const field = (label) =>
		lines
			.find((line) => line.startsWith(label))
			?.split(':')[1]
			?.replace(/\s*\(.*\)\s*$/, '')
			.trim() || undefined;
	return {
		model: field('Model name'),
		caches: { l1d: field('L1d cache'), l1i: field('L1i cache'), l2: field('L2 cache'), l3: field('L3 cache') }
	};
}

export function cpu() {
	const facts = process.platform === 'linux' ? lscpuFacts(execFileSync('lscpu', [], { encoding: 'utf8' })) : undefined;
	return { model: facts?.model ?? os.cpus()[0]?.model, caches: facts?.caches };
}

export const cpuModel = () => cpu().model;
