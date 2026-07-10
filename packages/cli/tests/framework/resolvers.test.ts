import { describe, it, expect } from 'vitest';
import { resolveGrammars, resolveBackends, defaultTemplatesPath } from '../../src/framework/resolvers.ts';

describe('resolvers', () => {
	it('resolveGrammars drops unknown names and defaults to all', () => {
		expect(resolveGrammars(['rust', 'bogus'])).toEqual(['rust']);
		expect(resolveGrammars([])).toEqual(['rust', 'typescript', 'python']);
	});
	it('resolveBackends returns native only', () => {
		expect(resolveBackends('native')).toEqual(['native']);
	});
	it('defaultTemplatesPath returns a per-grammar path', () => {
		expect(defaultTemplatesPath('rust')).toMatch(/rust/);
	});
});
