import { describe, expect, it } from 'vitest';
import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL, REPEAT } from '../../types/rule-types.ts'; // @rule-type-consts
import type { RawGrammar, RefineForm } from '../../compiler/types.ts';
import { linkPredicted } from '../../__tests__/helpers/linked.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import { stampIrSurface } from '../../compiler/model/ir-surface.ts';
import { emitTypes } from '../types.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';

function bracesRaw(forms: RefineForm[]): RawGrammar {
	return {
		name: 'synth',
		fileTypes: [],
		rules: {
			braces: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'opening', content: { type: CHOICE, members: [{ type: STRING, value: '{' }, { type: STRING, value: '{|' }] } },
					{ type: FIELD, name: 'members', content: { type: REPEAT, content: { type: SYMBOL, name: 'name' } } },
					{ type: FIELD, name: 'closing', content: { type: CHOICE, members: [{ type: STRING, value: '}' }, { type: STRING, value: '|}' }] } }
				]
			},
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
		refineForms: new Map([['braces', forms]])
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

const withDefault = (name: string | undefined): RefineForm[] => [
	{ name: 'curly', selections: { 'opening:': '{', 'closing:': '}' }, ...(name === undefined ? {} : { defaultName: name }) },
	{ name: 'flow', selections: { 'opening:': '{|', 'closing:': '|}' }, ...(name === undefined ? {} : { defaultName: name }) }
];

describe('refine() declares a default form', () => {
	it('refuses a default that names no form', () => {
		const diagnostics = new DiagnosticSink();
		linkPredicted(bracesRaw(withDefault('square')), { diagnostics });
		expect(diagnostics.all().filter((d) => d.code === 'refine-config-invalid').map((d) => d.message)).toEqual([
			"refine(braces): default 'square' names no form (forms: 'curly', 'flow')"
		]);
	});

	it('types the namespace config as the full config with the pinned fields omittable together, and names the default', () => {
		const { typesSrc } = emit(bracesRaw(withDefault('curly')));
		expect(typesSrc).toMatch(/Default form: 'curly' \(declared\)/);
		expect(typesSrc).toMatch(/export type Config = Omit<[^;]*"opening" \| "closing">[^;]*\|[^;]*;/);
	});

	it('builds the default when the pinned fields are omitted, uses them when given, and refuses part of them', () => {
		const { factoriesSrc } = emit(bracesRaw(withDefault('curly')));
		expect(factoriesSrc).toMatch(/_pinned\.opening === undefined \? TSKindId\.Lbrace as const/);
		expect(factoriesSrc).toMatch(/refine\(braces\): give 'opening' and 'closing', or neither/);
	});
});

describe('without a declared default', () => {
  it('keeps the first form as the namespace config', () => {
    const { typesSrc, factoriesSrc } = emit(bracesRaw(withDefault(undefined)));
    expect(typesSrc).toMatch(/Default form: 'curly' \(first-declared\)/);
    expect(factoriesSrc).not.toMatch(/give 'opening'/);
  });
});
