import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { linkPredicted } from '../../__tests__/helpers/linked.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';

// Same comparison as the design probe: ids and absorbedIds are ignored, keys are sorted.
const IGNORE = new Set(['id', 'absorbedIds']);
const plain = (value: unknown): unknown => {
	if (value instanceof Map) return plain(Object.fromEntries(value));
	if (value instanceof Set) return plain([...value]);
	if (Array.isArray(value)) return value.map(plain);
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(value).sort()) if (!IGNORE.has(key)) out[key] = plain((value as Record<string, unknown>)[key]);
		return out;
	}
	return value;
};

const TAIL = ", a: () => 'a', b: () => 'b'";
const kRule = (body: string) => `source: ($) => repeat($.k), k: ($) => seq('k', ${body})${TAIL}`;

const run = async (body: string) => {
	const raw = await evaluateTempGrammar({ extras: '', rules: kRule(body) }, '');
	const normalized = normalizeGrammar(linkPredicted(raw));
	const map = assemble(AssembleCtx.from(normalized));
	const node = map.nodes.get('k') as unknown as { variantChildKinds?: unknown } | undefined;
	return {
		rawKeys: Object.keys(raw.rules),
		normKeys: Object.keys(normalized.rules),
		nodeKeys: [...map.nodes.keys()],
		variantChildKinds: plain(node?.variantChildKinds),
		render: plain(normalized.normalizedRules.k),
		simplified: plain(normalized.rules.k),
		model: plain(map.nodes.get('k'))
	};
};

// The body and the reference compare equal at render, simplified and model.
const expectSame = async (reference: string, body: string) => {
	const ref = await run(reference);
	const got = await run(body);
	expect(got.render).toEqual(ref.render);
	expect(got.simplified).toEqual(ref.simplified);
	expect(got.model).toEqual(ref.model);
};

describe('blank() in a choice folds into the optional (item 7)', () => {
	const OPT = 'optional(choice($.a, $.b))';
	it.each([
		['choice($.a, $.b, blank())', OPT],
		['choice($.a, blank(), $.b)', OPT],
		['choice(blank(), $.a, $.b)', OPT],
		['choice($.a, blank(), $.b, blank())', OPT],
		['repeat(choice($.a, $.b, blank()))', 'repeat(optional(choice($.a, $.b)))'],
		["field('v', choice($.a, $.b, blank()))", "field('v', optional(choice($.a, $.b)))"],
		["choice('x', blank())", "optional('x')"],
		['choice(blank(), blank())', 'blank()'],
		['choice(eof(), eof())', 'blank()'],
		['seq($.a, blank())', 'seq($.a)']
	])('%s equals %s at render, simplified and model', async (body, reference) => {
		await expectSame(reference, body);
	}, 60_000);
});

describe('eof() in a choice (item 8)', () => {
	it('field(v, choice($.a, eof())) equals field(v, optional($.a))', async () => {
		await expectSame("field('v', optional($.a))", "field('v', choice($.a, eof()))");
	}, 60_000);

	it('unfielded choice($.a, eof()) makes the slot optional and mints nothing beyond optional($.a)', async () => {
		const withEof = await run('choice($.a, eof())');
		const reference = await run('optional($.a)');
		expect(withEof.simplified).toMatchObject({ type: 'SYMBOL', name: 'a', multiplicity: 'optional' });
		expect(withEof.rawKeys).toEqual(reference.rawKeys);
		expect(withEof.normKeys).toEqual(reference.normKeys);
		expect(withEof.nodeKeys).toEqual(reference.nodeKeys);
		expect((withEof.variantChildKinds as { kind: string }[]).map((entry) => entry.kind)).toEqual(['a']);
	}, 60_000);
});
