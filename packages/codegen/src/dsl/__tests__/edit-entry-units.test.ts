import { describe, expect, it } from 'vitest';
import { beforeAll, afterAll } from 'vitest';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import { transform as transformRule } from '../transform/transform.ts';
import { ApplyPathSkip } from '../transform/transform-path.ts';
import { getCurrentWireContext, withWireContext, wire, wireRecordBindingEffect, WIRE_ENTRY_ROLES, type WireContext } from '../wire/wire.ts';

const count = (value: unknown, needle: string): number => JSON.stringify(value).split(needle).length - 1;
const layer = () => ({ name: 'top', depth: 1, diagnostics: [], narrows: [], leads: [], renames: [] });
const WORD = "word: () => /[a-z]+/";
const PAIR = `pair: ($) => seq($.fn, ',', $.fn), fn: ($) => seq('f', $.word), ${WORD}`;
const HIDDEN = `pair: ($) => seq($._h, ',', $._h), _h: ($) => seq('h', $.fn), fn: ($) => seq('f', $.word), ${WORD}`;

describe('the same checks hold for wireImpl and automaticVariants (item 2a, 2b)', () => {
	const wiredContext = (): WireContext => (wire({ name: 't', rules: {}, edits: {} } as never, {} as never) as unknown as { __wireContext__: WireContext }).__wireContext__;
	const contexts: [string, () => WireContext][] = [
		['withWireContext', () => withWireContext(null, () => getCurrentWireContext()!).ctx],
		['wireImpl', wiredContext]
	];
	it.each(contexts)('%s: every own key is a key of WIRE_ENTRY_ROLES, and undone keys hold a collection', (_name, build) => {
		const ctx = build();
		for (const key of Object.keys(ctx)) expect(WIRE_ENTRY_ROLES).toHaveProperty(key);
		for (const [key, role] of Object.entries(WIRE_ENTRY_ROLES)) {
			if (role !== 'undone') continue;
			const value = (ctx as unknown as Record<string, unknown>)[key];
			expect(value instanceof Map || value instanceof Set || Array.isArray(value)).toBe(true);
		}
	});
	it.each(contexts)('%s: automaticVariants own keys are keys of WIRE_ENTRY_ROLES.automaticVariants', (_name, build) => {
		const { automaticVariants } = build();
		for (const key of Object.keys(automaticVariants)) expect(WIRE_ENTRY_ROLES.automaticVariants).toHaveProperty(key);
	});
});

describe('a split display is refused, and the sited copy shows one display (item 3, 4)', () => {
	it('Q2a: a second display on the same copy is edit-site-conflict naming both displays, and both references keep fn', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: PAIR }, '', {
			bindings: "edits: { pair: [{ '(fn)/0': ($, m) => m }, { '0/(fn as g)/0': ($, m) => m }] }"
		});
		expect(raw.layerDiagnostics).toEqual([
			expect.objectContaining({ code: 'edit-site-conflict', details: expect.objectContaining({ kind: 'pair', path: '0/(fn as g)/0', copy: '_fn_pair', displays: ['g', 'fn'] }) })
		]);
		expect(count(raw.rules.pair, '"value":"fn"')).toBe(2);
	}, 60_000);

	it('Q2a clean: one display across the entry shows at both references', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: PAIR }, '', {
			bindings: "edits: { pair: [{ '(fn)/0': ($, m) => m }, { '(fn as g)/0': ($, m) => m }] }"
		});
		expect(raw.layerDiagnostics ?? []).toEqual([]);
		expect(count(raw.rules.pair, '"value":"g"')).toBe(2);
	}, 60_000);
});

describe('an entry edits each copy once (items 5, 6, 7)', () => {
	it('Q3 fan-out: a patch on a repeated copy adds one exclamation mark', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: PAIR }, '', {
			bindings: "edits: { pair: { '(fn)/1': ($, m) => seq(m, '!') } }"
		});
		expect(count(raw.rules._fn_pair, '"value":"!"')).toBe(1);
	}, 60_000);

	it('Q3 through a hidden rule: one exclamation mark in _fn_pair', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: HIDDEN }, '', {
			bindings: "edits: { pair: { '(fn)/1': ($, m) => seq(m, '!') } }"
		});
		expect(count(raw.rules._fn_pair, '"value":"!"')).toBe(1);
	}, 60_000);

	it('Q3 through a hidden rule: both references to _h show the copy of the hidden rule', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: HIDDEN }, '', {
			bindings: "edits: { pair: { '(fn)': ($) => 'x' } }"
		});
		const members = (raw.rules.pair as { members: { type: string; name?: string }[] }).members;
		expect(members[0]).toMatchObject({ type: 'SYMBOL', name: '_h_pair' });
		expect(members[2]).toMatchObject({ type: 'SYMBOL', name: '_h_pair' });
	}, 60_000);

	it('(a)/(b) pin: the missed set records one edit-site-missing, the next set still applies', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: "owner: ($) => seq($.a, ';'), a: ($) => seq('x', $.word), " + WORD }, '', {
			bindings: "edits: { owner: [{ '(a)/(b)': ($, m) => m }, { '(a)/0': ($) => 'y' }] }"
		});
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-site-missing', details: expect.objectContaining({ path: '(a)/(b)' }) })]);
		expect(raw.rules._a_owner).toMatchObject({ type: 'SEQ', members: [{ type: 'STRING', value: 'y' }, expect.objectContaining({ type: 'FIELD' })] });
	}, 60_000);
});

describe('a refused entry undoes every effect it made (items 8, 9)', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('a missed path undoes the binding effect it recorded and leaves the copies unchanged', () => {
		const { ctx } = withWireContext(null, (context) => {
			Object.assign(context, { layer: layer(), currentDollar: {} });
			const before = context.bindingEffects.length;
			transformRule({ type: 'SEQ', members: [{ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'c' }] } as never, {
				'(a)': (_$: unknown, _m: unknown) => {
					wireRecordBindingEffect({ kind: 'alias', from: 'a', to: 'b' } as never);
					throw new ApplyPathSkip('miss');
				}
			} as never);
			expect(context.bindingEffects.length).toBe(before);
		});
		expect((ctx.layer as unknown as { diagnostics: unknown[] }).diagnostics).toHaveLength(1);
	});

	it('a wildcard fan-out keeps only the effect of the member that applied', () => {
		const { ctx } = withWireContext(null, (context) => {
			Object.assign(context, { layer: layer(), currentDollar: {} });
			transformRule({ type: 'SEQ', members: [{ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'c' }] } as never, {
				'_': (_$: unknown, m: { name?: string }) => {
					wireRecordBindingEffect({ kind: 'alias', from: m.name, to: 'z' } as never);
					if (m.name === 'a') throw new ApplyPathSkip('miss');
					return m;
				}
			} as never);
		});
		expect(ctx.bindingEffects).toEqual([expect.objectContaining({ from: 'c' })]);
		expect((ctx.layer as unknown as { diagnostics: unknown[] }).diagnostics).toEqual([]);
	});
});
