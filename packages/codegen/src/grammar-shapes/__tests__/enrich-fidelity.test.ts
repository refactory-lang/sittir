/**
 * enrich-fidelity.test.ts — proves the type-level `EnrichRule<>` reproduces
 * the runtime `enrich()` STRUCTURE on discriminating rust rules.
 *
 * Two pins on one expectation:
 *   1. RUNTIME: `enrich()` on raw grammar.json produces the expected
 *      structural skeleton (so the expectation is the real enrich output).
 *   2. TYPE-LEVEL: `EnrichRule<RawShape[name]>` matches the same structure
 *      via `expectTypeOf`. Both pinned => EnrichRule verified against enrich.
 *
 * Discriminating coverage (the spike must exercise enrich's hard cases, not
 * identity-on-already-fielded rules):
 *   - await_expression : Shape 1 unique bare supertype `_expression` -> field('expression')
 *   - index_expression : Shape 1 DUPLICATE supertype -> expression1/expression2 (NAME degrades to string; STRUCTURE = 2 fields)
 *   - reference_type   : Shape 2 optional(non-`_` symbol) -> field inserted INSIDE the CHOICE (path gains a level)
 *   - for_expression   : Shape 3 optional(seq(symbol,anon)) -> field inside the inner seq
 *   - break_expression : Shape 2 of supertype `_expression` LEFT UNWRAPPED (the `_`-prefix gate)
 *   - closure_expression: optional('static'/'async'/'move') NOT wrapped (no `_marker` from enrich)
 */
import { describe, it, expect, expectTypeOf, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import { enrich } from '../../dsl/enrich.ts';
import { rustGrammarShape } from '../grammar-shape.rust.ts';
import type { EnrichRule } from '../enrich-type.ts';
import type { GrammarRule } from '../grammar-json.ts';
import { installFakeDsl, restoreFakeDsl } from '../../dsl/__tests__/_test-helpers.ts';

// enrich's builders call the runtime-injected DSL constructors
// (globalThis.field/symbol/alias). This test feeds enrich the raw
// tree-sitter grammar.json, which is UPPERCASE, and asserts UPPERCASE output —
// so inject UPPERCASE constructors (the lowercase `installFakeDsl` defaults
// would make enrich emit lowercase and mismatch the uppercase input). Must run
// before the module-level `runEnrich` below.
installFakeDsl({
	field: (name: string, content: unknown) => ({ type: 'FIELD', name, content }),
	symbol: (name: string) => ({ type: 'SYMBOL', name }),
	alias: (rule: unknown, value: unknown) =>
		typeof value === 'string'
			? { type: 'ALIAS', content: rule, named: false, value }
			: { type: 'ALIAS', content: rule, named: true, value: (value as { name: string }).name }
});
afterAll(() => restoreFakeDsl());

const require = createRequire(import.meta.url);
const gj = require('../../../../rust/node_modules/tree-sitter-rust/src/grammar.json') as {
	rules: Record<string, unknown>;
	supertypes?: unknown[];
};

// Run real enrich once on the same raw grammar we type off. `enrich` is
// referenced via an untyped indirection so the test's type-check does not
// pull in enrich's GrammarResult/NodeMap signature (which carries
// pre-existing repo-wide errors from the in-flight GrammarSchema refactor).
const runEnrich = enrich as unknown as (g: unknown) => { rules: Record<string, unknown> };
const enriched = runEnrich({ rules: { ...gj.rules }, supertypes: gj.supertypes }).rules;

/** Structural skeleton: type + name (symbol/field), nesting; drop attrs. */
function skel(n: unknown): unknown {
	if (n == null || typeof n !== 'object') return n;
	const node = n as Record<string, unknown>;
	const t = node.type as string;
	const b: Record<string, unknown> = { t };
	if (t === 'SYMBOL') b.name = node.name;
	else if (t === 'FIELD') {
		b.name = node.name;
		b.c = skel(node.content);
	} else if (t === 'STRING') b.v = node.value;
	else if (Array.isArray(node.members)) b.m = (node.members as unknown[]).map(skel);
	else if ('content' in node) b.c = skel(node.content);
	return b;
}

type Rules = (typeof rustGrammarShape)['rules'];

describe('EnrichRule<> structural fidelity vs runtime enrich()', () => {
	it('await_expression: Shape 1 unique supertype -> field(expression)', () => {
		expect(skel(enriched.await_expression)).toEqual({
			t: 'PREC',
			c: {
				t: 'SEQ',
				m: [
					{ t: 'FIELD', name: 'expression', c: { t: 'SYMBOL', name: '_expression' } },
					{ t: 'STRING', v: '.' },
					{ t: 'STRING', v: 'await' }
				]
			}
		});
		// Type-level: PREC peeled, member 0 becomes FIELD('expression').
		type E = EnrichRule<Rules['await_expression']>;
		type M0 = (E & { content: { members: readonly GrammarRule[] } })['content']['members'][0];
		expectTypeOf<M0['type']>().toEqualTypeOf<'FIELD'>();
		expectTypeOf<(M0 & { name: string })['name']>().toEqualTypeOf<'expression'>();
	});

	it('index_expression: duplicate supertype -> 2 FIELDs; NAME degrades to string', () => {
		expect(skel(enriched.index_expression)).toEqual({
			t: 'PREC',
			c: {
				t: 'SEQ',
				m: [
					{ t: 'FIELD', name: 'expression1', c: { t: 'SYMBOL', name: '_expression' } },
					{ t: 'STRING', v: '[' },
					{ t: 'FIELD', name: 'expression2', c: { t: 'SYMBOL', name: '_expression' } },
					{ t: 'STRING', v: ']' }
				]
			}
		});
		// Type-level: STRUCTURE = FIELD at positions 0 and 2 (paths stay
		// correct); NAME degrades to `string` (we don't model numbering).
		type E = EnrichRule<Rules['index_expression']>;
		type M = (E & { content: { members: readonly GrammarRule[] } })['content']['members'];
		expectTypeOf<M[0]['type']>().toEqualTypeOf<'FIELD'>();
		expectTypeOf<M[2]['type']>().toEqualTypeOf<'FIELD'>();
		// NAME degrades to `string` (not a literal). Asserted via stable
		// `extends`/never checks rather than `toEqualTypeOf<string>`: the
		// latter is whole-program-sensitive under vue-tsc, the former is
		// engine-stable (verified against a plain-.ts never-assert).
		type Name0 = (M[0] & { name: unknown })['name'];
		// not never (the non-wrap/degrade bug would make it never):
		expectTypeOf<[Name0] extends [never] ? true : false>().toEqualTypeOf<false>();
		// assignable to string:
		expectTypeOf<Name0 extends string ? true : false>().toEqualTypeOf<true>();
		// genuinely degraded (NOT the literal 'expression1') — `string` does
		// not extend a literal, so this distinguishes degrade from a wrong
		// concrete name:
		expectTypeOf<Name0 extends 'expression1' ? true : false>().toEqualTypeOf<false>();
	});

	it('reference_type: Shape 2 optional(non-_ symbol) -> FIELD inserted INSIDE the CHOICE', () => {
		expect(skel(enriched.reference_type)).toEqual({
			t: 'SEQ',
			m: [
				{ t: 'STRING', v: '&' },
				{ t: 'CHOICE', m: [{ t: 'FIELD', name: 'lifetime', c: { t: 'SYMBOL', name: 'lifetime' } }, { t: 'BLANK' }] },
				{
					t: 'CHOICE',
					m: [{ t: 'FIELD', name: 'mutable_specifier', c: { t: 'SYMBOL', name: 'mutable_specifier' } }, { t: 'BLANK' }]
				},
				{ t: 'FIELD', name: 'type', c: { t: 'SYMBOL', name: '_type' } }
			]
		});
		// Type-level: member 1 stays a CHOICE, but its non-BLANK inner
		// becomes a FIELD — the path '1/0' now reaches the FIELD, not the
		// bare symbol (path GAINED a level).
		type E = EnrichRule<Rules['reference_type']>;
		type M1 = (E & { members: readonly GrammarRule[] })['members'][1];
		expectTypeOf<M1['type']>().toEqualTypeOf<'CHOICE'>();
		type M1Inner0 = (M1 & { members: readonly GrammarRule[] })['members'][0];
		expectTypeOf<M1Inner0['type']>().toEqualTypeOf<'FIELD'>();
		expectTypeOf<(M1Inner0 & { name: string })['name']>().toEqualTypeOf<'lifetime'>();
	});

	it('for_expression: Shape 3 optional(seq(symbol,anon)) -> field inside HOISTED clause group', () => {
		const sk = skel(enriched.for_expression) as { m: unknown[] };
		// Runtime enrich now HOISTS the Shape-3 optional(seq(label, ':'))
		// into a synthesized hidden clause-group rule instead of wrapping the
		// field in place. The hoisted rules are deduped by structure across
		// owners — while/loop/for/block all share `_while_expression_optional1`
		// (first-seen owner names it). The FIELD insertion this test pins
		// still happens — inside the hoisted rule's body. wire() later drains
		// these `_<owner>_optionalN` names into grammar.inline (see the
		// enrich-clause-group drain in dsl/wire/wire.ts).
		expect(sk.m[0]).toEqual({
			t: 'CHOICE',
			m: [{ t: 'SYMBOL', name: '_while_expression_optional1' }, { t: 'BLANK' }]
		});
		// The field lives inside the hoisted clause-group body.
		expect(skel(enriched['_while_expression_optional1'])).toEqual({
			t: 'SEQ',
			m: [
				{ t: 'FIELD', name: 'label', c: { t: 'SYMBOL', name: 'label' } },
				{ t: 'STRING', v: ':' }
			]
		});
		// Type-level: EnrichRule<> keeps the PRE-HOIST in-place view (FIELD
		// inside the inner seq) — hoisting is a runtime-enrich structural
		// move; the type model's job is field-insertion sites for authoring
		// paths, which are equivalent modulo the hoist.
		type E = EnrichRule<Rules['for_expression']>;
		type M0 = (E & { members: readonly GrammarRule[] })['members'][0];
		type Inner = (M0 & { members: readonly GrammarRule[] })['members'][0]; // the SEQ
		type SeqM0 = (Inner & { members: readonly GrammarRule[] })['members'][0]; // FIELD(label)
		expectTypeOf<SeqM0['type']>().toEqualTypeOf<'FIELD'>();
		expectTypeOf<(SeqM0 & { name: string })['name']>().toEqualTypeOf<'label'>();
	});

	it('break_expression: Shape 2 of supertype _expression LEFT UNWRAPPED (_-gate)', () => {
		const sk = skel(enriched.break_expression) as { c: { m: unknown[] } };
		// member 1 (label) wraps; member 2 (optional _expression) stays raw SYMBOL.
		expect(sk.c.m[2]).toEqual({ t: 'CHOICE', m: [{ t: 'SYMBOL', name: '_expression' }, { t: 'BLANK' }] });
		type E = EnrichRule<Rules['break_expression']>;
		type Inner = (E & { content: { members: readonly GrammarRule[] } })['content']['members'];
		type M2 = Inner[2]; // CHOICE(_expression, BLANK)
		type M2Inner0 = (M2 & { members: readonly GrammarRule[] })['members'][0];
		// Stays a SYMBOL (NOT a FIELD) — the _-prefix Shape-2 gate.
		expectTypeOf<M2Inner0['type']>().toEqualTypeOf<'SYMBOL'>();
		// And the label position DID wrap.
		type M1 = Inner[1];
		type M1Inner0 = (M1 & { members: readonly GrammarRule[] })['members'][0];
		expectTypeOf<M1Inner0['type']>().toEqualTypeOf<'FIELD'>();
	});

	it('closure_expression: optional(keyword literal) NOT wrapped (no enrich _marker)', () => {
		const sk = skel(enriched.closure_expression) as { c: { m: unknown[] } };
		// members 0/1/2 are CHOICE(STRING 'static'|'async'|'move', BLANK) — unchanged.
		expect(sk.c.m[0]).toEqual({ t: 'CHOICE', m: [{ t: 'STRING', v: 'static' }, { t: 'BLANK' }] });
		type E = EnrichRule<Rules['closure_expression']>;
		type M0 = (E & { content: { members: readonly GrammarRule[] } })['content']['members'][0];
		type M0Inner0 = (M0 & { members: readonly GrammarRule[] })['members'][0];
		expectTypeOf<M0Inner0['type']>().toEqualTypeOf<'STRING'>();
	});

	it('whole-grammar structural parity: EnrichRule has the same FIELD insertion sites as enrich (runtime check)', () => {
		// This guards the type model indirectly: it asserts the runtime
		// invariant that the type model is built on — zero structural skips.
		const supers = new Set(
			(gj.supertypes ?? []).map((s) => (typeof s === 'string' ? s : (s as { name: string }).name))
		);
		const peelPrec = (r: any): any => {
			let c = r;
			while (c && (c.type === 'PREC' || c.type === 'PREC_LEFT' || c.type === 'PREC_RIGHT' || c.type === 'PREC_DYNAMIC'))
				c = c.content;
			return c;
		};
		const peelOpt = (m: any) => {
			if (m?.type === 'CHOICE' && m.members?.length === 2) {
				const b = m.members.findIndex((x: any) => x.type === 'BLANK');
				if (b !== -1) return { inner: m.members[1 - b], opt: true };
			}
			return { inner: m, opt: false };
		};
		const shapeSym = (m: any): { name: string } | null => {
			if (m?.type === 'SYMBOL') return { name: m.name };
			const { inner, opt } = peelOpt(m);
			if (!opt) return null;
			if (inner.type === 'SYMBOL') return inner.name.startsWith('_') ? null : { name: inner.name };
			if (inner.type === 'SEQ') {
				let sym: string | null = null;
				for (const s of inner.members) {
					if (s.type === 'SYMBOL') {
						if (sym) return null;
						sym = s.name;
					} else if (s.type !== 'STRING' && s.type !== 'PATTERN') return null;
				}
				return sym && !sym.startsWith('_') ? { name: sym } : null;
			}
			return null;
		};
		const isFieldAt = (em: any): boolean => {
			if (em?.type === 'FIELD') return true;
			const { inner } = peelOpt(em);
			// Hoisted clause group: enrich replaces a Shape-3 optional(seq)
			// site with a ref to a synthesized hidden `_<owner>_optionalN`
			// rule (deduped by structure across owners) and inserts the FIELD
			// inside that rule's body. Follow the ref — the field insertion
			// happened, just at the hoisted location.
			if (inner?.type === 'SYMBOL' && /^_.+_optional\d+$/.test(inner.name)) {
				const hoisted = enriched[inner.name] as any;
				return hoisted?.type === 'SEQ' && hoisted.members.some((x: any) => x.type === 'FIELD');
			}
			return inner?.type === 'FIELD' || (inner?.type === 'SEQ' && inner.members.some((x: any) => x.type === 'FIELD'));
		};
		const skips: string[] = [];
		for (const [name, r] of Object.entries(gj.rules)) {
			if (name.startsWith('_')) continue;
			const c = peelPrec(r);
			if (!c || c.type !== 'SEQ') continue;
			const em = peelPrec(enriched[name]);
			for (let i = 0; i < c.members.length; i++) {
				const sh = shapeSym(c.members[i]);
				if (!sh) continue;
				if (sh.name.startsWith('_') && !(c.members[i].type === 'SYMBOL' && supers.has(sh.name))) continue;
				if (!isFieldAt(em.members[i])) skips.push(`${name}/${i}:${sh.name}`);
			}
		}
		expect(skips).toEqual([]); // zero structural skips on rust
	});
});
