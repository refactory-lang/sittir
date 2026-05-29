import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { validateModules } from '../../src/commands/validate/index.ts';

describe('validate namespace', () => {
	it('exposes counts, probe-factory, history, trace-rt', () => {
		const names = validateModules.map((m) => m.name).sort();
		expect(names).toEqual(['counts', 'history', 'probe-factory', 'trace-rt']);
	});
	it('each module registers exactly one command', () => {
		for (const mod of validateModules) {
			const program = new Command();
			mod.register(program);
			expect(program.commands.map((c) => c.name())).toEqual([mod.name]);
		}
	});
	it('counts command exposes --backend with native default', () => {
		const program = new Command();
		validateModules.find((m) => m.name === 'counts')!.register(program);
		const counts = program.commands.find((c) => c.name() === 'counts')!;
		const opt = counts.options.find((o) => o.long === '--backend');
		expect(opt?.defaultValue).toBe('native');
	});
});
