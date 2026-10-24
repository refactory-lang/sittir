import { PATTERN } from '../../types/rule-types.ts'; // @rule-type-consts
import { ERROR_KIND_NAME } from '@sittir/common/error-kind';
import { stampIrSurface } from '../model/ir-surface.ts';
import { ERROR_KIND_ROW } from '../../dsl/symbol-table.ts';
import { describe, expect, it } from 'vitest';

import { structuralBuilder } from '../../dsl/builders.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { linkPredicted } from '../../__tests__/helpers/linked.ts';
import { normalizeGrammar } from '../normalize.ts';
import { emitTypesModules } from '../../emitters/types.ts';
import type { RawGrammar } from '../types.ts';
import type { GeneratedIdTables } from '../../dsl/symbol-table.ts';

function makeMinimalFixture(): {
	raw: RawGrammar;
	generatedIdTables: GeneratedIdTables;
} {
	const { rules, ruleCatalog } = buildRuleCatalog({
		call_expression: structuralBuilder.field('function', { type: 'SYMBOL', name: 'identifier' }),
		identifier: { type: PATTERN, value: '[a-z_]\\w*' }
	});

	return {
		raw: {
			name: 'synth',
			fileTypes: [],
			rules,
			ruleCatalog,
			evaluateSynthesized: new Set<string>(),
			extras: [],
			externals: [],
			supertypes: [],
			factoryInline: [],
			inline: [],
			conflicts: [],
			precedences: [],
			word: null,
			references: []
		},
		generatedIdTables: { fieldIds: new Map(), folds: new Map(),
			kindIds: {
				[ERROR_KIND_NAME]: ERROR_KIND_ROW,
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
		const linked = linkPredicted(raw);
		const normalized = normalizeGrammar(linked);
		const nodeMap = assemble(AssembleCtx.from(normalized));
		stampIrSurface(nodeMap, generatedIdTables);
		const { types: contents, kinds } = emitTypesModules({
			grammar: 'synth',
			nodeMap,
			generatedIdTables
		});

		expect(kinds).toContain('export enum TSKindId {');
		expect(contents).not.toContain('export enum TSKindId {');
		expect(contents).toContain("import { TSKindId } from './kinds.js';");
		expect(contents).toContain("export { TSKindId } from './kinds.js';");
		expect(contents).toContain('$type: TSKindId.CallExpression;');
		expect(contents).toContain('export const KIND_NAMES: ReadonlyMap<number, string>');
		expect(contents).toContain('export function kindIdFromName(');
		// The CONCRETE interface uses numeric discriminant.
		expect(contents).toContain('export interface CallExpression {');
		// Node sub-interfaces (for Rust serde) intentionally retain string
		// $type — they are top-level exports inside the namespace, NOT inside
		// the concrete interface. Verify the concrete interface has numeric $type:
		expect(contents).toContain('  readonly $type: TSKindId.CallExpression;');
		// The top-level concrete interface block has 2-space-indented $type with
		// TSKindId — no string literal there. The Node namespace may still
		// emit a string $type but that is intentional and acceptable.
		expect(kinds).toContain('CallExpression = 17,');
		expect(kinds).toContain('Identifier = 3,');
	});
});
