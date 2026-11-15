import { describe, expect, it } from 'vitest';
import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar, RefineForm } from '../../compiler/types.ts';
import { linkPredicted } from '../../__tests__/helpers/linked.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import { stampIrSurface } from '../../compiler/model/ir-surface.ts';
import { emitTypes } from '../types.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';

function chainRaw(forms: RefineForm[], armRule: Rule<'evaluate'> = { type: STRING, value: '?.' }): RawGrammar {
	return {
		name: 'synth',
		fileTypes: [],
		rules: {
			chain: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'operator', content: { type: CHOICE, members: [{ type: STRING, value: '.' }, { type: SYMBOL, name: 'optional_chain' }] } },
					{ type: FIELD, name: 'property', content: { type: SYMBOL, name: 'name' } }
				]
			},
			optional_chain: armRule,
			name: { type: PATTERN, value: '[a-z]+' }
		},
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: [],
		refineForms: new Map([['chain', forms]])
	};
}

function emit(raw: RawGrammar) {
	const normalized = normalizeGrammar(linkPredicted(raw));
	const nodeMap = assemble(AssembleCtx.from(normalized));
	stampIrSurface(nodeMap, normalized.generatedIdTables);
	return {
		typesSrc: emitTypes({ grammar: 'synth', nodeMap, generatedIdTables: normalized.generatedIdTables }),
		factoriesSrc: emitFactories({ grammar: 'synth', nodeMap, generatedIdTables: normalized.generatedIdTables })
	};
}

const DOT_OPTIONAL: RefineForm[] = [
	{ name: 'dot', selections: { 'operator:': '.' } },
	{ name: 'optional', selections: { 'operator:': '?.' } }
];

describe('a refine() form selects a fixed-text node arm', () => {
	it('accepts the arm by its text', () => {
		const diagnostics = new DiagnosticSink();
		linkPredicted(chainRaw(DOT_OPTIONAL), { diagnostics });
		expect(diagnostics.all().filter((d) => d.code === 'refine-config-invalid').map((d) => d.message)).toEqual([]);
	});

	it('pins the arm kind in the form builder and drops the field from its config', () => {
		const { factoriesSrc, typesSrc } = emit(chainRaw(DOT_OPTIONAL));
		expect(factoriesSrc).toMatch(/buildChainOptional[\s\S]*_operator = TSKindId\.OptionalChain as const;/);
		expect(factoriesSrc).toMatch(/buildChainDot[\s\S]*_operator = TSKindId\.Dot as const;/);
		expect(typesSrc).toMatch(/Optional \{\s+export type Config = Omit<ConfigFor<TSKindId\.Chain>, "operator">/);
	});

	it('pins the same arm when it is selected by index', () => {
		const { factoriesSrc } = emit(chainRaw([{ name: 'optional', selections: { 'operator:': 1 } }]));
		expect(factoriesSrc).toMatch(/buildChainOptional[\s\S]*_operator = TSKindId\.OptionalChain as const;/);
	});

	it('refuses an index that selects a node arm with no fixed text, naming the arm', () => {
		const structured: Rule<'evaluate'> = { type: PATTERN, value: '[?]+' };
		expect(() => emit(chainRaw([{ name: 'optional', selections: { 'operator:': 1 } }], structured))).toThrow(/optional_chain/);
	});
});
