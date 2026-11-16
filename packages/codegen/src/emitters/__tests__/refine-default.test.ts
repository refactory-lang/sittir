import { describe, expect, it } from 'vitest';
import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL, REPEAT } from '../../types/rule-types.ts'; // @rule-type-consts
import type { RawGrammar, RefineForm } from '../../compiler/types.ts';
import { assemblePredicted, linkPredicted, rawIdTablesOf, withFixtureLexicalRanks } from '../../__tests__/helpers/linked.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { stampIrSurface } from '../../compiler/model/ir-surface.ts';
import { emitTypes } from '../types.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';

function bracesRaw(forms: RefineForm[], defaultName?: string): RawGrammar {
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
		refineForms: new Map([['braces', forms]]),
		...(defaultName === undefined ? {} : { refineDefaults: new Map([['braces', defaultName]]) })
	};
}

function emit(raw: RawGrammar) {
	const { nodeMap, generatedIdTables } = assemblePredicted(raw, withFixtureLexicalRanks(rawIdTablesOf(raw)));
	stampIrSurface(nodeMap, generatedIdTables);
	return {
		typesSrc: emitTypes({ grammar: 'synth', nodeMap, generatedIdTables }),
		factoriesSrc: emitFactories({ grammar: 'synth', nodeMap, generatedIdTables }),
		fromSrc: emitFrom({ grammar: 'synth', nodeMap, generatedIdTables })
	};
}

const FORMS: RefineForm[] = [
	{ name: 'curly', selections: { 'opening:': '{', 'closing:': '}' } },
	{ name: 'flow', selections: { 'opening:': '{|', 'closing:': '|}' } }
];

describe('refine() declares a default form', () => {
	it('refuses a default that names no form', () => {
		const diagnostics = new DiagnosticSink();
		linkPredicted(bracesRaw(FORMS, 'square'), { diagnostics });
		expect(diagnostics.all().filter((d) => d.code === 'refine-config-invalid').map((d) => d.message)).toEqual([
			"refine(braces): default 'square' names no form (forms: 'curly', 'flow')"
		]);
	});

	it('types the namespace config as the full config with the pinned fields omittable together, and names the default', () => {
		const { typesSrc } = emit(bracesRaw(FORMS, 'curly'));
		expect(typesSrc).toMatch(/Default form: 'curly' \(declared\)/);
		expect(typesSrc).toMatch(/export type Config = \(OmitEach<[^;]*"opening" \| "closing"> & \{ readonly opening\?: never; readonly closing\?: never \}\) \| [^;]*;/);
	});

	it('builds the default when the pinned fields are omitted, uses them when given, and refuses part of them', () => {
		const { factoriesSrc } = emit(bracesRaw(FORMS, 'curly'));
		expect(factoriesSrc).toMatch(/_pinned\.opening === undefined \? TSKindId\.Lbrace as const/);
		expect(factoriesSrc).toMatch(/refine\(braces\): give 'opening' and 'closing', or neither/);
	});
});

describe('a declared default reaches every emitted surface', () => {
	it('types the loose config with the pinned fields omittable together and builds the default only when none is given', () => {
		const { typesSrc, fromSrc } = emit(bracesRaw(FORMS, 'curly'));
		expect(typesSrc).toMatch(/export type LooseConfig = \(OmitEach<[^;]*"opening" \| "closing"> & \{ readonly opening\?: never; readonly closing\?: never \}\) \| [^;]*;/);
		expect(fromSrc).toMatch(/const _config = \{[\s\S]*?\};\s+return input\.opening === undefined && input\.closing === undefined\s+\? F\.buildBraces\(_config[^)]*\)\s+: F\.buildBraces\(\{ \.\.\._config, opening: [^}]*closing: [^}]*\}/);
	});
});

describe('without a declared default', () => {
	it('types the namespace config as the full config and says it has no default form', () => {
		const { typesSrc, factoriesSrc } = emit(bracesRaw(FORMS));
		expect(typesSrc).toMatch(/No default form: every form field is required\./);
		expect(typesSrc).not.toMatch(/\(first-declared\)/);
		expect(typesSrc).not.toMatch(/export type Config = Curly\.Config;/);
		expect(factoriesSrc).not.toMatch(/give 'opening'/);
	});
});

describe('a declared default that pins nothing', () => {
	it('is refused as refine-config-invalid, naming the kind and the form', () => {
		const forms: RefineForm[] = [
			{ name: 'free', selections: {} },
			{ name: 'flow', selections: { 'opening:': '{|', 'closing:': '|}' } }
		];
		expect(() => emit(bracesRaw(forms, 'free'))).toThrow("refine(braces): default 'free' pins no field");
	});
});
