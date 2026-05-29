import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { toolModules, registerTools } from '../../../src/commands/tool/index.ts';

const EXPECTED = [
	'bench', 'bench-codemod', 'check-baseline', 'check-jinja', 'check-perf',
	'classify', 'compare-overrides', 'diff-failures', 'dump-ast-mismatches',
	'exercise', 'field-provenance', 'grammar-diagnostics', 'inspect-refs',
	'inspect-type', 'list-kinds', 'phantom-kinds', 'probe-kind', 'probe-parity',
	'probe-stages', 'probe-validate', 'profile', 'profile-factory', 'walk'
];

describe('tool namespace', () => {
	it('registers exactly the 23 converted tools', () => {
		expect(toolModules.map((m) => m.name).sort()).toEqual([...EXPECTED].sort());
	});

	it('registerTools creates a `tool` group with every tool under it', () => {
		const program = new Command();
		registerTools(program);
		const tool = program.commands.find((c) => c.name() === 'tool');
		expect(tool).toBeDefined();
		expect(tool!.commands.map((c) => c.name()).sort()).toEqual([...EXPECTED].sort());
	});
});
