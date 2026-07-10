import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { withGrammar, withRecursive, withOutput } from '../../src/framework/options.ts';

function optsFor(build: (c: Command) => Command, argv: string[]): Record<string, unknown> {
	let captured: Record<string, unknown> = {};
	const cmd = build(new Command('t')).action((o) => {
		captured = o;
	});
	cmd.parse(argv, { from: 'user' });
	return captured;
}

describe('option mixins', () => {
	it('withRecursive is a boolean flag defaulting false', () => {
		expect(optsFor(withRecursive, []).recursive).toBe(false);
		expect(optsFor(withRecursive, ['--recursive']).recursive).toBe(true);
	});
	it('withGrammar accepts -g shorthand', () => {
		expect(optsFor(withGrammar, ['-g', 'rust']).grammar).toBe('rust');
	});
	it('withOutput accepts -o shorthand', () => {
		expect(optsFor(withOutput, ['-o', 'out/']).output).toBe('out/');
	});
});
