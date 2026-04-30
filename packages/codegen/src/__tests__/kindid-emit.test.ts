import { describe, expect, it } from 'vitest';

import { field, seq } from '../compiler/evaluate.ts';
import { buildRuleCatalog } from '../compiler/rule-catalog.ts';
import { assemble } from '../compiler/assemble.ts';
import { link } from '../compiler/link.ts';
import { optimize } from '../compiler/optimize.ts';
import { emitTypes } from '../emitters/types.ts';
import type { RawGrammar } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';

function makeMinimalFixture(): {
	raw: RawGrammar;
	generatedIdTables: GeneratedIdTables;
} {
	const { rules, ruleCatalog } = buildRuleCatalog({
		call_expression: seq(
			field('function', { type: 'symbol', name: 'identifier' })
		),
		identifier: { type: 'pattern', value: '[a-z_]\\w*' }
	});

	return {
		raw: {
			name: 'synth',
			rules,
			ruleCatalog,
			extras: [],
			externals: [],
			supertypes: [],
			inline: [],
			conflicts: [],
			word: null,
			references: []
		},
		generatedIdTables: {
			kindIds: {
				call_expression: { id: 17, cName: 'sym_call_expression' },
				identifier: { id: 3, cName: 'sym_identifier' }
			},
			sourceArtifact: 'parser.wasm'
		}
	};
}

describe('KindId emission', () => {
	it('emits numeric runtime discriminants and lookup helpers', () => {
		const { raw, generatedIdTables } = makeMinimalFixture();
		const linked = link(raw);
		const optimized = optimize(linked);
		const nodeMap = assemble(optimized);
		const contents = emitTypes({
			grammar: 'synth',
			nodeMap,
			generatedIdTables
		});

		expect(contents).toContain('export const enum TSKindId {');
		expect(contents).toContain('$type: TSKindId.CallExpression;');
		expect(contents).toContain('export function kindNameFromId(');
		expect(contents).toContain('export function kindIdFromName(');
		expect(contents).not.toContain("$type: 'call_expression'");
		expect(contents).toContain('CallExpression = 17,');
		expect(contents).toContain('Identifier = 3,');
	});
});
