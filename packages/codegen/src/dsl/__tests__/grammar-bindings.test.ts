import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSittirGrammar, writeSittirGrammarPackage } from '../../__tests__/helpers/sittir-grammar.ts';
import { evaluateForDerivation } from '../../transpile/evaluate-for-derivation.ts';
import { baseNamesOf, boundNameOf, lead } from '../bind.ts';
import { match } from '../primitives/narrow.ts';
import { preference } from '../primitives/preference.ts';
import { boundFieldNameOf, effectsForOwners, rewriteInherited, type SegmentEffect } from '../verbs/effects.ts';

function grammarPackageWith(bindings?: string): { dir: string } {
	const pkg = mkdtempSync(join(dir, 'pkg-'));
	writeSittirGrammarPackage(pkg, baseModule, 'bindtest', '', undefined, bindings === undefined ? {} : { bindings });
	return { dir: pkg };
}

let dir: string;
let baseModule: string;

beforeAll(() => {
	dir = mkdtempSync(join(tmpdir(), 'grammar-bindings-'));
	baseModule = join(dir, 'base.mjs');
	writeFileSync(
		baseModule,
		`export default grammar({
	name: 'bindtest',
	rules: {
		source_file: $ => repeat($._item),
		_item: $ => choice($.let_item, $.call),
		let_item: $ => seq('let', field('left', $.identifier), optional(seq(':', $.type)), ';'),
		call: $ => seq($.identifier, '(', ')', ';'),
		identifier: _ => /[a-z]+/,
		type: _ => /[A-Z][a-z]*/
	}
});
`
	);
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const BINDINGS = `edits: {
	let_item: { 1: field('name'), '2/0/1': field('annotation') },
	call: { '0/0': alias('callee') }
}`;
const BOUND = { bindings: BINDINGS, renames: { let_item: 'binding' } };

describe('lead and match', () => {
	it('build a lead entry: the list, its item field, the lead field and what the lead admits', () => {
		expect(lead('formal_parameters_elements', 'item', 'receiver', match('required_parameter', { pattern: [match('this')] }, 'this_parameter'))).toEqual({
			list: 'formal_parameters_elements',
			item: 'item',
			field: 'receiver',
			admits: [{ kind: 'required_parameter', within: { field: 'pattern', admits: [{ kind: 'this' }] }, as: 'this_parameter' }]
		});
	});

	it('read an array as an unfielded restriction, and a bare kind as no restriction', () => {
		expect(match('self_parameter')).toEqual({ kind: 'self_parameter' });
		expect(match('attributed_parameter', [match('self_parameter')])).toEqual({ kind: 'attributed_parameter', within: { field: null, admits: [{ kind: 'self_parameter' }] } });
	});

	it('refuse a restriction of two fields', () => {
		expect(() => match('required_parameter', { pattern: [match('this')], type: [match('type_annotation')] })).toThrow(
			/restricts one field, not 2/
		);
	});
});

describe('boundFieldNameOf', () => {
	it('maps a field renamed in a hidden rule through the visible owner that holds it', () => {
		const grammar = {
			rules: {
				parameter: { type: 'SYMBOL', name: '_parameter_name' },
				_parameter_name: { type: 'FIELD', name: 'name', content: { type: 'SYMBOL', name: 'identifier' } },
				other: { type: 'SYMBOL', name: 'identifier' }
			}
		};
		const nameOf = boundFieldNameOf([{ owner: '_parameter_name', from: 'pattern:', to: 'name:' }], grammar);
		expect(nameOf('parameter', 'pattern')).toBe('name');
		expect(nameOf('other', 'pattern')).toBe('pattern');
	});

	const fieldPatternGrammar = (namedField: string) => ({
		supertypes: ['field_pattern'],
		rules: {
			field_pattern: {
				type: 'CHOICE',
				members: [
					{ type: 'SYMBOL', name: 'field_pattern_shorthand' },
					{ type: 'SYMBOL', name: 'field_pattern_named' },
					{ type: 'SYMBOL', name: 'field_pattern_bare' }
				]
			},
			field_pattern_shorthand: { type: 'FIELD', name: 'by_reference', content: { type: 'STRING', value: 'ref' } },
			field_pattern_named: { type: 'FIELD', name: namedField, content: { type: 'STRING', value: 'ref' } },
			field_pattern_bare: { type: 'FIELD', name: 'name', content: { type: 'STRING', value: 'x' } },
			other: { type: 'SYMBOL', name: 'field_pattern' }
		}
	});

	it('maps a field renamed at the forms of a supertype through the supertype, when every form holding it agrees', () => {
		const nameOf = boundFieldNameOf(
			[
				{ owner: 'field_pattern_shorthand', from: 'ref:', to: 'by_reference:' },
				{ owner: 'field_pattern_named', from: 'ref:', to: 'by_reference:' }
			],
			fieldPatternGrammar('by_reference')
		);
		expect(nameOf('field_pattern', 'ref')).toBe('by_reference');
		expect(nameOf('field_pattern_named', 'ref')).toBe('by_reference');
		expect(nameOf('other', 'ref')).toBe('ref');
	});

	it('refuses a supertype selector whose forms disagree on the field, and keeps each form its own name', () => {
		const nameOf = boundFieldNameOf([{ owner: 'field_pattern_shorthand', from: 'ref:', to: 'by_reference:' }], fieldPatternGrammar('ref'));
		expect(nameOf('field_pattern_shorthand', 'ref')).toBe('by_reference');
		expect(nameOf('field_pattern_named', 'ref')).toBe('ref');
		expect(() => nameOf('field_pattern', 'ref')).toThrow(/'field_pattern\/ref:' has conflicting field renames/);
	});

	it('projects a form rename onto its supertype for inherited options when every form holding the field agrees, and refuses a supertype option over forms that disagree', () => {
		const supertypeSegments = (namedField: string, effects: readonly SegmentEffect[]) =>
			effectsForOwners(fieldPatternGrammar(namedField), effects).filter((effect) => effect.kind === 'segment' && effect.owner === 'field_pattern');
		const shorthand: SegmentEffect = { kind: 'segment', owner: 'field_pattern_shorthand', from: 'ref:', to: 'by_reference:' };
		const named: SegmentEffect = { kind: 'segment', owner: 'field_pattern_named', from: 'ref:', to: 'by_reference:' };
		expect(supertypeSegments('by_reference', [shorthand, named])).toEqual([{ kind: 'segment', owner: 'field_pattern', from: 'ref:', to: 'by_reference:' }]);
		const disagreeing = supertypeSegments('ref', [shorthand]);
		expect(disagreeing).toEqual([
			{ kind: 'segment', owner: 'field_pattern', from: 'ref:', to: 'by_reference:' },
			{ kind: 'segment', owner: 'field_pattern', from: 'ref:', to: 'ref:' }
		]);
		const tight = preference('tight');
		const rules = fieldPatternGrammar('ref').rules;
		expect(rewriteInherited({ options: { field_pattern: { 'name:/before': tight } } }, { effects: disagreeing, rules })).toEqual({ options: { field_pattern: { 'name:/before': tight } } });
		expect(() => rewriteInherited({ options: { field_pattern: { 'ref:/before': tight } } }, { effects: disagreeing, rules })).toThrow(/'field_pattern\/ref:' has conflicting field renames: by_reference:, ref:/);
	});

	it('counts a nested supertype whose forms all keep the field as keeping it', () => {
		const grammar = {
			supertypes: ['outer', 'nested'],
			rules: {
				outer: { type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'changed' }, { type: 'SYMBOL', name: 'nested' }] },
				nested: { type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'same_a' }, { type: 'SYMBOL', name: 'same_b' }] },
				changed: { type: 'FIELD', name: 'by_reference', content: { type: 'STRING', value: 'ref' } },
				same_a: { type: 'FIELD', name: 'ref', content: { type: 'STRING', value: 'ref' } },
				same_b: { type: 'FIELD', name: 'ref', content: { type: 'STRING', value: 'ref' } }
			}
		};
		const changed: SegmentEffect = { kind: 'segment', owner: 'changed', from: 'ref:', to: 'by_reference:' };
		const nameOf = boundFieldNameOf([changed], grammar);
		expect(nameOf('nested', 'ref')).toBe('ref');
		expect(() => nameOf('outer', 'ref')).toThrow(/'outer\/ref:' has conflicting field renames/);
		const effects = effectsForOwners(grammar, [changed]).filter((effect) => effect.kind === 'segment' && effect.owner !== 'changed');
		expect(effects).toEqual([
			{ kind: 'segment', owner: 'outer', from: 'ref:', to: 'by_reference:' },
			{ kind: 'segment', owner: 'outer', from: 'ref:', to: 'ref:' }
		]);
		expect(() => rewriteInherited({ options: { outer: { 'ref:/before': preference('tight') } } }, { effects, rules: grammar.rules })).toThrow(/'outer\/ref:' has conflicting field renames: by_reference:, ref:/);
	});


	it('reads canonical field segments and scopes the rename to its owner', () => {
		const nameOf = boundFieldNameOf([{ owner: 'binding', from: 'left:', to: 'name:' }]);
		expect(nameOf('binding', 'left')).toBe('name');
		expect(nameOf('call', 'left')).toBe('left');
	});
});

describe('baseNamesOf', () => {
	it('maps an explicitly recorded binding alias without renaming unrelated source kinds', () => {
		const nameOf = boundNameOf({}, [{ kind: 'alias', from: 'line_comment_regular', to: 'text_comment' }]);
		expect(nameOf('line_comment_regular')).toBe('text_comment');
		expect(nameOf('identifier')).toBe('identifier');
	});
	it('maps a renamed rule and a clone of it to the base name', () => {
		expect(baseNamesOf({ binding: 'let_item' }, { binding_x: 'binding' })).toEqual({ binding: 'let_item', binding_x: 'let_item' });
	});

	it("maps a clone that reuses a renamed rule's base name to that name, and leaves it out", () => {
		expect(baseNamesOf({ value_parameter: 'parameter' }, { parameter: 'value_parameter' })).toEqual({
			value_parameter: 'parameter'
		});
	});
});

describe('grammar bindings as the layer above grammar.sittir.ts', () => {
	it('applies its edits and keeps the upstream kind names, its renames being data', async () => {
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', '', undefined, BOUND);
		expect(Object.keys(raw.rules)).toContain('let_item');
		expect(Object.keys(raw.rules)).not.toContain('binding');
		const text = JSON.stringify(raw.rules.let_item);
		expect(text).toContain('"name":"name"');
		expect(text).not.toContain('"name":"left"');
		expect(JSON.stringify(raw.rules)).toContain('"name":"annotation"');
		expect(JSON.stringify(raw.rules.call)).toMatch(
			/"type":"FIELD","name":"identifier","content":\{"type":"ALIAS".*"named":true,"value":"callee"/
		);
		expect(raw.renamedFrom).toBeUndefined();
	}, 120_000);

	it('preserves parser names in each reparse host, priority entry and gated host', async () => {
		const hosts = `reparseHosts: { hosts: { let_item: '$r', call: '$r' }, priority: ['_item', 'let_item'], gated: ['let_item'] }`;
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', hosts, undefined, BOUND);
		expect(raw.reparseHosts).toEqual({
			hosts: { let_item: '$r', call: '$r' },
			priority: ['_item', 'let_item'],
			gated: ['let_item']
		});
	}, 120_000);

	it('leaves layer 1, evaluated alone, without the edits of the layer above it', async () => {
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', '', undefined, { ...BOUND, layer: 'sittir' });
		expect(Object.keys(raw.rules)).toContain('let_item');
		expect(Object.keys(raw.rules)).not.toContain('binding');
		expect(JSON.stringify(raw.rules.let_item)).toContain('"name":"left"');
		expect(JSON.stringify(raw.rules.call)).not.toContain('callee');
	}, 120_000);

	it('keeps the other holders of a shared group lift on a copy of it when an edit changes the lift', async () => {
		const shared = join(dir, 'shared-lift.mjs');
		writeFileSync(
			shared,
			`export default grammar({ name: 'bindtest', rules: { source_file: $ => repeat(choice($.call, $.array)), call: $ => seq($.identifier, '(', optional(seq($._arg, repeat(seq(',', $._arg)))), ')'), array: $ => seq('[', optional(seq($._arg, repeat(seq(',', $._arg)))), ']'), _arg: $ => choice($.identifier, $.number), number: _ => /[0-9]+/, identifier: _ => /[a-z]+/ } });`
		);
		const unbound = await evaluateSittirGrammar(shared, 'bindtest');
		const bound = await evaluateSittirGrammar(shared, 'bindtest', '', undefined, { bindings: "edits: { call: { '2/0/0': field('first') } }" });
		expect(JSON.stringify(unbound.rules.array)).toContain('"name":"_call_optional1"');
		expect(JSON.stringify(bound.rules.call)).toContain('"name":"_call_optional1"');
		expect(JSON.stringify(bound.rules._call_optional1)).toContain('"name":"first"');
		expect(JSON.stringify(bound.rules.array)).toContain('"name":"array_group1"');
		expect(JSON.stringify(bound.rules.array_group1)).not.toContain('"name":"first"');
		expect(JSON.stringify(bound.rules.array_group1).replaceAll(/"id":"[^"]*"/g, '')).toBe(JSON.stringify(unbound.rules._call_optional1).replaceAll(/"id":"[^"]*"/g, ''));
	}, 120_000);

	it('refuses an alias whose target its base already names, as a blocking diagnostic of the layer', async () => {
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', '', undefined, { bindings: "edits: { call: { '0/0': alias('type') } }" });
		expect(raw.layerDiagnostics).toContainEqual(
			expect.objectContaining({ code: 'alias-target-invalid', canProceed: false, ownerKind: 'call', message: expect.stringMatching(/alias 'identifier' → 'type'.*already names/) })
		);
	}, 120_000);

	it('refuses an alias that flips hiddenness in a layer above the first, and allows both in layer 1', async () => {
		const flip = "edits: { call: { '0/0': alias('_callee') } }";
		const above = await evaluateSittirGrammar(baseModule, 'bindtest', '', undefined, { bindings: flip });
		expect(above.layerDiagnostics).toContainEqual(expect.objectContaining({ code: 'alias-target-invalid', message: expect.stringMatching(/flips hiddenness/) }));
		const first = await evaluateSittirGrammar(baseModule, 'bindtest', flip);
		expect(first.layerDiagnostics ?? []).not.toContainEqual(expect.objectContaining({ code: 'alias-target-invalid' }));
		expect(JSON.stringify(first.rules.call)).toContain('"value":"_callee"');
	}, 120_000);

	it('lets an alias above the first layer change the display of a member a lower layer already shows, and refuses one that shows a member that sat bare', async () => {
		const shown = "edits: { source_file: { '0/0': alias('item') } }";
		const display = { bindings: "edits: { source_file: { '0/0': ($) => alias(copy('_item'), $.entry) } }" };
		const redisplayed = await evaluateSittirGrammar(baseModule, 'bindtest', shown, undefined, display);
		expect(redisplayed.layerDiagnostics ?? []).not.toContainEqual(expect.objectContaining({ code: 'alias-target-invalid' }));
		expect(JSON.stringify(redisplayed.rules.source_file)).toContain('"value":"entry"');
		const elided = await evaluateSittirGrammar(baseModule, 'bindtest', '', undefined, display);
		expect(elided.layerDiagnostics).toContainEqual(
			expect.objectContaining({ code: 'alias-target-invalid', ownerKind: 'source_file', message: expect.stringMatching(/alias '_item' → 'entry': flips hiddenness/) })
		);
	}, 120_000);

	it('reads a literal shown under an alias in place of a member as a replacement, not an alias edit of the member', async () => {
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', '', undefined, { bindings: "edits: { source_file: { '0/0': ($) => alias('main', $.identifier) } }" });
		expect(raw.layerDiagnostics ?? []).not.toContainEqual(expect.objectContaining({ code: 'alias-target-invalid' }));
		expect(JSON.stringify(raw.rules.source_file)).toContain('"value":"identifier"');
	}, 120_000);

	it('refuses a hidden rule shown under two displays, and passes a site that shows a copy of it instead', async () => {
		const twoSites = join(dir, 'two-sites.mjs');
		writeFileSync(
			twoSites,
			`export default grammar({ name: 'bindtest', rules: { source_file: $ => seq(repeat($._item), $.block), block: $ => seq('{', $._item, '}'), _item: $ => choice($.call, $.identifier), call: $ => seq($.identifier, '(', ')'), identifier: _ => /[a-z]+/ } });`
		);
		const shown = "edits: { source_file: { '0/0/0': alias('item') }, block: { 1: alias('item') } }";
		const folded = await evaluateSittirGrammar(twoSites, 'bindtest', shown, undefined, { bindings: "edits: { block: { 1: alias('entry') } }" });
		expect(folded.layerDiagnostics).toContainEqual(
			expect.objectContaining({ code: 'hidden-display-fold', canProceed: false, ownerKind: '_item', details: { kind: '_item', displays: ['entry', 'item'] } })
		);
		const copied = await evaluateSittirGrammar(twoSites, 'bindtest', shown, undefined, { bindings: "edits: { block: { 1: ($) => alias(copy('_item'), $.entry) } }" });
		expect(copied.layerDiagnostics ?? []).not.toContainEqual(expect.objectContaining({ code: 'hidden-display-fold' }));
	}, 120_000);

	it('derives the base conflicts from the grammar without its grammar bindings', () => {
		const bound = evaluateForDerivation(grammarPackageWith(BINDINGS));
		const unbound = evaluateForDerivation(grammarPackageWith());
		expect(bound.base.grammarHash).toBe(unbound.base.grammarHash);
	}, 120_000);

	it('derives the bound conflicts from the bound grammar, keyed by its own hash and chained to its unbound names', () => {
		const bound = evaluateForDerivation(grammarPackageWith(BINDINGS));
		const unbound = evaluateForDerivation(grammarPackageWith());
		expect(unbound.bound.grammarHash).toBe(unbound.base.grammarHash);
		expect(bound.bound.grammarHash).not.toBe(unbound.bound.grammarHash);
		expect(bound.bound.baseNames).toEqual({});
		expect(bound.bound.sourceEdges).toEqual(bound.base.sourceEdges);
		expect(bound.base.baseNames).toEqual({});
	}, 120_000);

	it('applies the bound conflicts after the layer-1 conflicts, keeping the upstream names', async () => {
		const set = (symbols: string[]) => ({
			resolution: { kind: 'AddConflict' as const, symbols },
			step: 'default' as const,
			sourceChains: symbols.map((name) => [name]),
			conflict: { symbolSequence: [], lookahead: '', interpretations: symbols }
		});
		const resolutions = {
			grammarHash: '',
			resolutions: [set(['let_item', 'call'])],
			bound: { grammarHash: '', resolutions: [set(['let_item', 'identifier'])] }
		};
		const bound = await evaluateSittirGrammar(baseModule, 'bindtest', '', resolutions, BOUND);
		expect(bound.conflicts).toEqual([
			['let_item', 'call'],
			['let_item', 'identifier']
		]);
		expect(bound.derivationRecords?.boundResolutions.map((entry) => entry.resolution.symbols)).toEqual([
			['let_item', 'identifier']
		]);
		const unbound = await evaluateSittirGrammar(baseModule, 'bindtest', '', resolutions, { ...BOUND, layer: 'sittir' });
		expect(unbound.conflicts).toEqual([['let_item', 'call']]);
		expect(unbound.derivationRecords?.boundResolutions).toEqual([]);
	}, 120_000);

	it('rewrites the authored options through what each binding patch did', async () => {
		const options = `options: {
		let_item: { 'left:/before': preference('tight'), '";"/before': preference('tight') },
		_labels: { 'identifier/x:/separator': 'gap/separator' }
	}`;
		const bindings = `edits: { let_item: { 1: field('name'), 3: field('terminator') }, call: { '0/0': alias('callee') } }`;
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', options, undefined, { bindings, renames: { let_item: 'binding' } });
		const block = raw.options as Record<string, Record<string, unknown>>;
		expect(Object.keys(block.let_item ?? {}).sort()).toEqual(['name:/before', 'terminator:/before']);
		expect(Object.keys(block._labels ?? {})).toEqual(['identifier/x:/separator']);
	}, 120_000);
});
