import { describe, expect, it } from 'vitest';
import { nodeFloorViolation } from '../tree-sitter-cli.ts';

describe('nodeFloorViolation', () => {
	it('reads its floor from the codegen package engines', () => {
		expect(nodeFloorViolation('v22.17.9')).toContain('>=22.18.0');
	});

	it.each(['v20.19.0', 'v22.17.1', 'v22.9.0'])('refuses %s below 22.18', (version) => {
		expect(nodeFloorViolation(version, '>=22.18.0')).toBe(
			`tree-sitter runs grammar.sittir.ts with the \`node\` on PATH, which is ${version}; stripping its TypeScript types needs node >=22.18.0`
		);
	});

	it.each(['v22.18.0', 'v22.18.1', 'v22.20.0', 'v23.0.0', 'v26.10.0'])('accepts %s', (version) => {
		expect(nodeFloorViolation(version, '>=22.18.0')).toBeUndefined();
	});
});
