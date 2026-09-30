import { describe, expect, it } from 'vitest';
import { allGrammars } from '@sittir/codegen/grammars';
import { loadNodeModel, wrapForReparse } from '../../src/validate/common.ts';

describe('the root identity reparse wrapper', () => {
	for (const grammar of allGrammars()) {
		it(`${grammar}: reparses its model root kind as written`, async () => {
			const { root } = await loadNodeModel(grammar);
			expect(root).toBeDefined();
			expect(wrapForReparse('x y', root!, grammar, new Map(), { root })).toEqual({ text: 'x y', offset: 0 });
		});
	}

	it('gives a non-root kind no wrapper when its grammar declares none', () => {
		expect(wrapForReparse('(x)', 'named_node', 'scm', new Map(), { root: 'program' })).toBeNull();
	});
});
