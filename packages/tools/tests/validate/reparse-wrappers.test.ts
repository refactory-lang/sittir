import { describe, expect, it } from 'vitest';
import { allGrammars } from '@sittir/codegen/grammars';
import { loadNodeModel, loadReparseHosts, wrapForReparse } from '../../src/validate/common.ts';
import { wrapRendered } from '../../src/validate/read-render-parse.ts';

describe('the root identity reparse wrapper', () => {
	for (const grammar of allGrammars()) {
		it(`${grammar}: reparses its model root kind as written`, async () => {
			const { root } = await loadNodeModel(grammar);
			await loadReparseHosts(grammar);
			expect(root).toBeDefined();
			expect(wrapForReparse('x y', root!, grammar, new Map(), { root })).toEqual({ text: 'x y', offset: 0 });
		});
	}

	it('gives a non-root kind no wrapper when its grammar declares none', async () => {
		await loadReparseHosts('scm');
		expect(wrapForReparse('(x)', 'named_node', 'scm', new Map(), { root: 'program' })).toBeNull();
	});
});

describe('wrapping a rendered split kind', () => {
	const placements = new Map([['split_kind', { kind: '_expression', display: '_expression', prefix: '(', suffix: ')' }]]);
	const ctx = { grammar: 'rust', kindToSupertypes: new Map(), adoptedVariantKinds: new Set<string>(), root: undefined, placements };

	it('places a kind with no host of its own inside its placement owner, at the offset after the prefix', async () => {
		await loadReparseHosts('rust');
		expect(wrapRendered('x', 'split_kind', 'split_kind', ctx)).toEqual({ text: 'fn _f() { let _ = (x); }', offset: 19 });
	});

	it('gives a kind with neither a host nor a placement no wrapper', async () => {
		await loadReparseHosts('rust');
		expect(wrapRendered('x', 'unplaced_kind', 'unplaced_kind', ctx)).toBeNull();
	});
});
