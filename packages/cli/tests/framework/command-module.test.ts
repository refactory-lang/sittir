import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerNamespace, type CommandModule } from '../../src/framework/command-module.ts';

describe('registerNamespace', () => {
	it('creates a subcommand group and registers each module under it', () => {
		const a: CommandModule = { name: 'alpha', describe: 'Alpha cmd', register: (p) => { p.command('alpha').action(() => {}); } };
		const b: CommandModule = { name: 'beta', describe: 'Beta cmd', register: (p) => { p.command('beta').action(() => {}); } };
		const program = new Command();
		registerNamespace(program, 'demo', 'Demo namespace', [a, b]);
		const demo = program.commands.find((c) => c.name() === 'demo');
		expect(demo).toBeDefined();
		const names = demo!.commands.map((c) => c.name()).sort();
		expect(names).toEqual(['alpha', 'beta']);
	});
});
