import { PATTERN } from '../compiler/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';

import { field, seq } from '../compiler/evaluate.ts';
import { buildRuleCatalog } from '../compiler/rule-catalog.ts';
import { assemble } from '../compiler/assemble.ts';
import { link } from '../compiler/link.ts';
import { normalizeGrammar } from '../compiler/normalize.ts';
import { emitTypes } from '../emitters/types.ts';
import type { RawGrammar } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';

function makeMinimalFixture(): {
	raw: RawGrammar;
	generatedIdTables: GeneratedIdTables;
} {
	const { rules, ruleCatalog } = buildRuleCatalog({
		call_expression: seq(field('function', { type: 'symbol', name: 'identifier' })),
		identifier: { type: PATTERN, value: '[a-z_]\\w*' }
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
				call_expression: {
					id: 17,
					parser: {
						cSymbol: 'sym_call_expression',
						parserName: 'call_expression',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				},
				identifier: {
					id: 3,
					parser: {
						cSymbol: 'sym_identifier',
						parserName: 'identifier',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				}
			},
			sourceArtifact: 'parser.wasm'
		}
	};
}

describe('KindId emission', () => {
	it('emits numeric runtime discriminants and lookup helpers', () => {
		const { raw, generatedIdTables } = makeMinimalFixture();
		const linked = link(raw);
		const optimized = normalizeGrammar(linked);
		const nodeMap = assemble(optimized);
		const contents = emitTypes({
			grammar: 'synth',
			nodeMap,
			generatedIdTables
		});

		expect(contents).toContain('export const enum TSKindId {');
		expect(contents).toContain('$type: TSKindId.CallExpression;');
		expect(contents).toContain('export const KIND_NAMES: ReadonlyMap<number, string>');
		expect(contents).toContain('export function kindIdFromName(');
		// The CONCRETE interface uses numeric discriminant.
		expect(contents).toContain('export interface CallExpression {');
		// Transport sub-interfaces (for Rust serde) intentionally retain string
		// $type — they are top-level exports inside the namespace, NOT inside
		// the concrete interface. Verify the concrete interface has numeric $type:
		expect(contents).toContain('  readonly $type: TSKindId.CallExpression;');
		// The top-level concrete interface block has 2-space-indented $type with
		// TSKindId — no string literal there. The Transport namespace may still
		// emit a string $type but that is intentional and acceptable.
		expect(contents).toContain('CallExpression = 17,');
		expect(contents).toContain('Identifier = 3,');
	});
});
