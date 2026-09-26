import { describe, it, expect } from 'vitest';
import { resolveGrammars, resolveBackends } from '../../src/framework/resolvers.ts';
import { stableGrammars } from '@sittir/codegen/grammars';

describe('resolvers', () => {
	it('resolveGrammars drops unknown names and defaults to the stable grammars', () => {
		expect(resolveGrammars(['rust', 'bogus'])).toEqual(['rust']);
		expect(resolveGrammars([])).toEqual(stableGrammars());
	});
	it('resolveBackends returns native only', () => {
		expect(resolveBackends('native')).toEqual(['native']);
	});
});
