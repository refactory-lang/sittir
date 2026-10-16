import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LayerRecords } from '../layer-record.ts';
import { preference } from '../primitives/preference.ts';
import { appendProvenance, displayFamiliesOf, effectsForOwners, provenanceOf, rewriteInherited, type CopyOrigin, type Effect, type LeadMatch, type Provenance } from '../verbs/effects.ts';
import { LABELS_KEY } from '../wire/options-block.ts';

interface FixtureCopy {
	readonly copy: string;
	readonly source: string;
	readonly part: string;
	readonly context: string;
	readonly display?: string;
	readonly admitted?: string;
}

interface LayerFixture {
	readonly effects: readonly Effect[];
	readonly lead: { readonly list: string; readonly item: string; readonly field: string; readonly admits: readonly LeadMatch[] } | null;
	readonly copies: readonly FixtureCopy[];
	readonly rules: Readonly<Record<string, unknown>>;
	readonly provenance: unknown;
	readonly inherited: LayerRecords & { readonly options: Readonly<Record<string, unknown>> };
	readonly rewrittenOptions: Readonly<Record<string, unknown>>;
}

const layerFixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures/bindings-layer-effects.json'), 'utf8')) as Readonly<Record<string, LayerFixture>>;

const layerEffects = (fixture: LayerFixture): Effect[] => {
	const origin: CopyOrigin | undefined = fixture.lead === null ? undefined : { kind: 'lead', ...fixture.lead };
	return [
		...fixture.effects,
		...fixture.copies.map((copy): Effect => ({
			kind: 'copy',
			copy: copy.copy,
			source: copy.source,
			part: copy.part,
			context: copy.context,
			display: copy.display,
			admitted: copy.admitted,
			origin: origin!
		}))
	];
};

const before = preference('space');
const after = preference('newline');
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const sym = (name: string) => ({ type: 'SYMBOL' as const, name });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });

const copyEffect = (copy: string, source: string, origin: CopyOrigin): Effect => ({
	kind: 'copy',
	copy,
	source,
	part: '.',
	context: 'owner',
	display: undefined,
	admitted: undefined,
	origin
});

describe('rewriteInherited', () => {
	it('rewrites a field segment under the effect owner only, in its options and its label addresses', () => {
		const records = {
			options: {
				o: { 'item:/separator/","/after': after },
				p: { 'item:/after': after },
				[LABELS_KEY]: { 'o/item:/before': 'o/before', 'p/item:/before': 'p/before' }
			}
		};
		const rewritten = rewriteInherited(records, { effects: [{ kind: 'segment', owner: 'o', from: 'item:', to: 'element:' }], rules: {} });
		expect(rewritten.options).toEqual({
			o: { 'element:/separator/","/after': after },
			p: { 'item:/after': after },
			[LABELS_KEY]: { 'o/element:/before': 'o/before', 'p/item:/before': 'p/before' }
		});
		expect(records.options.o).toEqual({ 'item:/separator/","/after': after });
	});

	it("renames an alias's (from) segments, and its slot segments that name no field", () => {
		const records = { options: { o: { '(a)/after': after, 'a:/before': before }, a: { before } } };
		const effects: Effect[] = [{ kind: 'alias', from: 'a', to: 'b' }];
		expect(rewriteInherited(records, { effects, rules: { o: seq(sym('a')) } }).options).toEqual({
			o: { '(b)/after': after, 'b:/before': before },
			a: { before }
		});
		expect(rewriteInherited(records, { effects, rules: { o: seq(field('a', sym('a'))) } }).options).toEqual({
			o: { '(b)/after': after, 'a:/before': before },
			a: { before }
		});
	});

	it.each<CopyOrigin>([
		{ kind: 'path', owner: 'owner', path: 'body:/(body)' },
		{ kind: 'copy', owner: 'owner' }
	])('gives a copy made by a $kind its source options and labels, and keeps what the copy states itself', (origin) => {
		const records = {
			options: {
				body: { before, 'items:/end': after },
				context_body: { before: after },
				[LABELS_KEY]: { 'body/"{"/after': 'body/before' }
			}
		};
		expect(rewriteInherited(records, { effects: [copyEffect('context_body', 'body', origin)], rules: {} }).options).toEqual({
			body: { before, 'items:/end': after },
			context_body: { before: after, 'items:/end': after },
			[LABELS_KEY]: { 'body/"{"/after': 'body/before', 'context_body/"{"/after': 'body/before' }
		});
	});

	it.each<CopyOrigin>([
		{ kind: 'narrow', owner: 'owner', path: 'body:' },
		{ kind: 'lead', list: 'body', item: 'item', field: 'receiver', admits: [] }
	])('gives a copy made by a $kind nothing', (origin) => {
		const records = { options: { body: { before } } };
		expect(rewriteInherited(records, { effects: [copyEffect('_body_receiver', 'body', origin)], rules: {} }).options).toEqual({ body: { before } });
	});

	it('rewrites the segments before a copy inherits its source options', () => {
		const records = { options: { body: { 'item:/after': after } } };
		const effects: Effect[] = [
			{ kind: 'segment', owner: 'body', from: 'item:', to: 'element:' },
			copyEffect('context_body', 'body', { kind: 'copy', owner: 'owner' })
		];
		expect(rewriteInherited(records, { effects, rules: {} }).options).toEqual({
			body: { 'element:/after': after },
			context_body: { 'element:/after': after }
		});
	});

	it('renames a kind in option heads, (kind) segments, label heads, reparse hosts and keyed records', () => {
		const records = {
			options: { a: { '(a)/after': after }, o: { 'a:/before': before }, [LABELS_KEY]: { 'a/x:': 'a/before' } },
			renderAs: { a: sym('a') },
			reparseHosts: { hosts: { a: 'a $' }, priority: ['a', 'o'] },
			undeclaredRules: ['a', 'o']
		};
		const rewritten = rewriteInherited(records, { effects: [{ kind: 'rename', from: 'a', to: 'b' }], rules: {} });
		expect(rewritten).toEqual({
			options: { b: { '(b)/after': after }, o: { 'b:/before': before }, [LABELS_KEY]: { 'b/x:': 'a/before' } },
			renderAs: { b: sym('b') },
			reparseHosts: { hosts: { b: 'a $' }, priority: ['b', 'o'] },
			undeclaredRules: ['b', 'o']
		});
	});

	it.each<[string, LayerRecords, LayerRecords]>([
		['the keys of rule causes', { ruleCauses: { a: { kind: 'vocabulary' } } }, { ruleCauses: { b: { kind: 'vocabulary' } } }],
		['the keys of test-failure expectations, not their reasons', { expectTestFailures: { a: 'a' } }, { expectTestFailures: { b: 'a' } }],
		[
			'the keys of refine forms, not the forms',
			{ refineForms: new Map([['a', [{ name: 'a', selections: { 0: 'a' } }]]]) },
			{ refineForms: new Map([['b', [{ name: 'a', selections: { 0: 'a' } }]]]) }
		],
		[
			'the keys of external roles',
			{ externalRoles: new Map([['a', { role: 'indent' as const }]]) },
			{ externalRoles: new Map([['b', { role: 'indent' as const }]]) }
		],
		[
			'the kinds a diagnostic expectation lists, not its code',
			{ expectDiagnostics: { 'unclassifiable-shape': ['a', 'c'] } },
			{ expectDiagnostics: { 'unclassifiable-shape': ['b', 'c'] } }
		],
		[
			"each patch site's owner kind, not its path or name",
			{ patchSites: [{ ownerKind: 'a', path: 'a:', form: 'field', name: 'a' }] },
			{ patchSites: [{ ownerKind: 'b', path: 'a:', form: 'field', name: 'a' }] }
		],
		["each whitespace collision's name", { whitespaceCollisions: [{ name: 'a', site: 'upstream' }] }, { whitespaceCollisions: [{ name: 'b', site: 'upstream' }] }],
		['the groups whose body pattern matched nothing', { bodyPatternZeroMatches: ['a', 'c'] }, { bodyPatternZeroMatches: ['b', 'c'] }]
	])('renames %s under a kind rename', (_record, records, expected) => {
		expect(rewriteInherited(records, { effects: [{ kind: 'rename', from: 'a', to: 'b' }], rules: {} })).toEqual(expected);
	});

	it.each(Object.keys(layerFixtures))("rewrites %s's inherited records as its bindings layer does, key order included", (grammar) => {
		const fixture = layerFixtures[grammar]!;
		const expected = { ...fixture.inherited, options: { ...fixture.inherited.options, ...fixture.rewrittenOptions } };
		const rewritten = rewriteInherited(fixture.inherited, { effects: layerEffects(fixture), rules: fixture.rules });
		expect(JSON.stringify(rewritten)).toBe(JSON.stringify(expected));
	});

	it('returns records untouched when the layer records no effect', () => {
		const records = { options: { o: { 'item:/after': after } } };
		expect(rewriteInherited(records, { effects: [], rules: {} })).toEqual(records);
	});
});

describe('effectsForOwners', () => {
	it("gives a hidden rule's field effect to every rule that reaches it, in rule order, after the aliases", () => {
		const grammar = {
			rules: { a: seq(sym('_h')), _h: field('f', sym('x')), b: seq(sym('_h'), field('g', sym('x'))), c: sym('x'), x: sym('y') },
			supertypes: []
		};
		const effects: Effect[] = [
			{ kind: 'segment', owner: 'b', from: 'g:', to: 'h:' },
			{ kind: 'alias', from: 'p', to: 'q' },
			{ kind: 'segment', owner: '_h', from: 'f:', to: 'e:' }
		];
		expect(effectsForOwners(grammar, effects)).toEqual([
			{ kind: 'alias', from: 'p', to: 'q' },
			{ kind: 'segment', owner: 'a', from: 'f:', to: 'e:' },
			{ kind: 'segment', owner: '_h', from: 'f:', to: 'e:' },
			{ kind: 'segment', owner: 'b', from: 'g:', to: 'h:' },
			{ kind: 'segment', owner: 'b', from: 'f:', to: 'e:' }
		]);
	});

	it('stops at a supertype', () => {
		const grammar = { rules: { a: sym('_s'), _s: field('f', sym('x')), x: sym('y') }, supertypes: ['_s'] };
		expect(effectsForOwners(grammar, [{ kind: 'segment', owner: '_s', from: 'f:', to: 'e:' }])).toEqual([
			{ kind: 'segment', owner: '_s', from: 'f:', to: 'e:' }
		]);
	});

	it('keeps both renames of a segment one owner holds twice, and refuses only a record that reads that segment', () => {
		const grammar = { rules: { range: seq(field('e', sym('x')), sym('x'), field('e', sym('x'))), x: sym('y') }, supertypes: [] };
		const effects: Effect[] = [
			{ kind: 'segment', owner: 'range', from: 'e:', to: 'start:' },
			{ kind: 'segment', owner: 'range', from: 'e:', to: 'end:' }
		];
		expect(effectsForOwners(grammar, effects)).toEqual(effects);
		const tight = preference('tight');
		expect(rewriteInherited({ options: { range: { 'x:/before': tight } } }, { effects, rules: grammar.rules })).toEqual({ options: { range: { 'x:/before': tight } } });
		expect(() => rewriteInherited({ options: { range: { 'e:/before': tight } } }, { effects, rules: grammar.rules })).toThrow(/'range\/e:' has conflicting field renames: start:, end:/);
	});
});

describe('appendProvenance', () => {
	const inherited: Provenance = { splitFrom: { a: 'b' }, bindingEffects: [{ kind: 'alias', from: 'p', to: 'q' }] };

	it("appends a layer's projections to the ones it inherits", () => {
		const own: Provenance = { splitFrom: { c: 'd' }, leadFrom: { e: 'f' }, bindingEffects: [{ kind: 'segment', owner: 'o', from: 'x:', to: 'y:' }] };
		expect(appendProvenance(inherited, own)).toEqual({ splitFrom: { a: 'b', c: 'd' }, leadFrom: { e: 'f' }, bindingEffects: [...inherited.bindingEffects, ...own.bindingEffects] });
		expect(appendProvenance(undefined, own)).toBe(own);
	});

	it('leaves leadFrom and renamedFrom out while neither side has an entry', () => {
		expect(Object.keys(appendProvenance(inherited, { splitFrom: {}, bindingEffects: [] }))).toEqual(['splitFrom', 'bindingEffects']);
	});
});

describe('displayFamiliesOf', () => {
	it('names each display two or more alias effects give, with the members they alias', () => {
		const effects: Effect[] = [
			{ kind: 'alias', from: 'lambda', to: 'lambda_expression' },
			{ kind: 'alias', from: 'inner_lambda', to: 'lambda_expression' },
			{ kind: 'alias', from: 'lambda', to: 'lambda_expression' },
			{ kind: 'alias', from: 'x', to: 'y' },
			{ kind: 'alias', from: 'x', to: 'y' },
			{ kind: 'rename', from: 'a', to: 'y' }
		];
		expect(displayFamiliesOf(effects)).toEqual(new Map([['lambda_expression', new Set(['lambda', 'inner_lambda'])]]));
	});
});

describe('provenanceOf', () => {
	it.each(Object.keys(layerFixtures))("reproduces %s's provenance, key order included, from its recorded effects", (grammar) => {
		const fixture = layerFixtures[grammar]!;
		expect(JSON.stringify(provenanceOf(layerEffects(fixture), fixture.rules))).toBe(JSON.stringify(fixture.provenance));
	});

	it('maps the copies a path or copy() made into splitFrom, and each rename target to its source', () => {
		const effects: Effect[] = [
			copyEffect('_body_owner', '_body', { kind: 'path', owner: 'owner', path: 'body:/(_body)' }),
			copyEffect('_item_owner', '_item', { kind: 'narrow', owner: 'owner', path: 'item:' }),
			{ kind: 'rename', from: 'old', to: 'new' }
		];
		expect(provenanceOf(effects, {})).toEqual({
			splitFrom: { _body_owner: '_body' },
			renamedFrom: { new: 'old' },
			bindingEffects: []
		});
	});
});
