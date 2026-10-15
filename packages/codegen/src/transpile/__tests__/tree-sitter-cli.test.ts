import { describe, expect, it } from 'vitest';
import { UNBOUND_ENV } from '../../dsl/sittir-grammar.ts';
import { nodeFloorViolation, treeSitterCliEnv } from '../tree-sitter-cli.ts';

describe('treeSitterCliEnv', () => {
	it('drops the unbound toggle an evaluation left in the parent environment', () => {
		const env = treeSitterCliEnv({}, { PATH: '/bin', [UNBOUND_ENV]: '1' });
		expect(env).toEqual({ PATH: '/bin' });
	});

	it('passes the unbound toggle a caller asks for', () => {
		expect(treeSitterCliEnv({ [UNBOUND_ENV]: '1' }, { PATH: '/bin' })).toEqual({ PATH: '/bin', [UNBOUND_ENV]: '1' });
	});
});

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
