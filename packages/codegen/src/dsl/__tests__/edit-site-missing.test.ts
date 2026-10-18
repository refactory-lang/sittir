import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';
import { transform as transformRule } from '../transform/transform.ts';
import { arm } from '../primitives/arm.ts';
import { withWireContext } from '../wire/wire.ts';

const BASE = "cls: ($) => seq('{', repeat($.meth), '}'), meth: ($) => seq(field('name', $.prop), '(', ')'), prop: () => /[a-z]+/, wrap: ($) => $.prop, wrap2: ($) => choice('a', 'b'), kw: ($) => choice('a', 'b')";

const run = (bindings: string) => evaluateTempGrammar({ extras: '', rules: BASE }, '', { bindings });

describe('a path that matches nothing is edit-site-missing, and the layer resolves', () => {
	it('Z2: an out-of-bounds index records one diagnostic, and the name: alias still applies', async () => {
		const raw = await run("edits: { meth: { 'name:': ($, m) => alias(m, $.nm), '9': ($, m) => m } }");
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-site-missing', details: expect.objectContaining({ path: '9' }), message: expect.stringMatching(/out of bounds/) })]);
		expect(JSON.stringify(raw.rules.meth)).toContain('"value":"nm"');
	}, 60_000);

	it('Z3: a missed default entry in a variant set is skipped without a throw, and the sited variant still applies', async () => {
		const raw = await run("edits: { kw: { '0': variant('first'), '9/0': variant('v', { default: true }) } }");
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-site-missing', details: expect.objectContaining({ path: '9/0' }), message: expect.stringMatching(/out of bounds/) })]);
		expect(raw.rules).toHaveProperty('kw_first');
	}, 60_000);

	it('Z5: a missed path under a matched one rolls back the copy, so the name alias still applies to _meth_cls', async () => {
		const raw = await run("edits: { cls: { '(meth)/9': ($, m) => m, '(meth)/name:': ($, m) => alias(m, $.nm) } }");
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-site-missing', details: expect.objectContaining({ path: '(meth)/9' }) })]);
		expect(JSON.stringify(raw.rules._meth_cls)).toContain('"value":"nm"');
	}, 60_000);

	it('Z6a: a flat key past the end of a SEQ records one out-of-bounds diagnostic in a layer', async () => {
		const raw = await run("edits: { meth: { 5: ($, m) => m } }");
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-site-missing', details: expect.objectContaining({ path: '5' }), message: expect.stringMatching(/out of bounds/) })]);
	}, 60_000);

	it('Z6b: a flat key that matches no choice arm records one diagnostic in a layer', async () => {
		const raw = await run("edits: { wrap2: { 1: ($, m) => m } }");
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-site-missing', details: expect.objectContaining({ path: '1' }), message: expect.stringMatching(/matched no choice arm/) })]);
	}, 60_000);

	it('Z6c: a flat key on a rule that holds no SEQ records one diagnostic in a layer', async () => {
		const raw = await run("edits: { wrap: { 0: ($, m) => m } }");
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-site-missing', details: expect.objectContaining({ path: '0' }), message: expect.stringMatching(/holds no SEQ/) })]);
	}, 60_000);

	it('Z8: an inline edit in a layer rule callback records one diagnostic', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: BASE }, '', {
			bindings: "rules: { meth: ($, prev) => edit(prev, { '9': ($, m) => m }) }"
		});
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-site-missing' })]);
		expect(raw.layerDiagnostics).toHaveLength(1);
	}, 60_000);
});

describe('arm.default whose parent path is missing, outside the evaluator', () => {
	it('Z4: records exactly one edit-site-missing naming the parent path, and does not throw out of the context', () => {
		const rule = { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'b' }] };
		const { ctx } = withWireContext(null, (context) => {
			Object.assign(context, { layer: { name: 'top', depth: 1, diagnostics: [], narrows: [], leads: [] } });
			return transformRule(rule as never, { '(zzz)/0': arm.default } as never);
		});
		expect((ctx.layer as unknown as { diagnostics: unknown[] }).diagnostics).toEqual([
			expect.objectContaining({ code: 'edit-site-missing', details: expect.objectContaining({ path: '(zzz)/0' }), message: expect.stringMatching(/matched zero occurrences/) })
		]);
	});
});
