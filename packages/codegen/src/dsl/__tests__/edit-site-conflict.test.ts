import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const SEQ = "k: ($) => seq('x', $.y, 'z'), y: () => /y/";
const TWO = "k: ($) => seq('x', $.y), y: () => /y/";
const ARMS = "k: ($) => choice(seq('x', $.y), seq('z', $.y)), y: () => /y/";
const CONFLICT = 'edit-site-conflict';

describe('an inline write and a declarative entry on one site', () => {
	it('is a diagnostic naming the kind and the entry key', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: SEQ }, '', {
			bindings: "rules: { k: ($, p) => edit(p, { '1': field('a') }) }, edits: { k: { '1': field('b') } }"
		});
		expect(raw.layerDiagnostics ?? []).toContainEqual(
			expect.objectContaining({ code: CONFLICT, severity: 'fail', canProceed: false, ownerKind: 'k', details: { kind: 'k', path: '1' } })
		);
	}, 60_000);

	it('compares sites by the member they resolve to, not by how the path is spelt', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: TWO }, '', {
			bindings: "rules: { k: ($, p) => edit(p, { '1': field('a') }) }, edits: { k: { '-1': field('b') } }"
		});
		expect(raw.layerDiagnostics ?? []).toContainEqual(
			expect.objectContaining({ code: CONFLICT, severity: 'fail', canProceed: false, ownerKind: 'k', details: { kind: 'k', path: '-1' } })
		);
	}, 60_000);

	it('is a diagnostic when the entry writes an arm the inline variant minted', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: ARMS }, '', {
			bindings: "rules: { k: ($) => choice(variant('a', seq('x', $.y)), variant('c', seq('z', $.y))) }, edits: { k: { '0': variant('b') } }"
		});
		expect(raw.layerDiagnostics ?? []).toContainEqual(
			expect.objectContaining({ code: CONFLICT, severity: 'fail', canProceed: false, ownerKind: 'k', details: { kind: 'k', path: '0' } })
		);
	}, 60_000);

	it('is not a diagnostic when the entry writes a different member of the same rule, and both edits apply', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: SEQ }, '', {
			bindings: "rules: { k: ($, p) => edit(p, { '1': field('a') }) }, edits: { k: { '0': field('b') } }"
		});
		expect(raw.layerDiagnostics ?? []).not.toContainEqual(expect.objectContaining({ code: CONFLICT }));
		expect(raw.rules.k).toMatchObject({
			type: 'SEQ',
			members: [{ type: 'FIELD', name: 'b' }, { type: 'FIELD', name: 'a' }, { type: 'STRING', value: 'z' }]
		});
	}, 60_000);

	it('is not a diagnostic when the inline write and the entry sit on different kinds', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: `${SEQ}, j: ($) => seq('x', $.y, 'z')` }, '', {
			bindings: "rules: { k: ($, p) => edit(p, { '1': field('a') }) }, edits: { j: { '1': field('b') } }"
		});
		expect(raw.layerDiagnostics ?? []).not.toContainEqual(expect.objectContaining({ code: CONFLICT }));
		expect(raw.rules.k).toMatchObject({ type: 'SEQ', members: [{ type: 'STRING' }, { type: 'FIELD', name: 'a' }, { type: 'STRING' }] });
		expect(raw.rules.j).toMatchObject({ type: 'SEQ', members: [{ type: 'STRING' }, { type: 'FIELD', name: 'b' }, { type: 'STRING' }] });
	}, 60_000);

	it('is not a diagnostic when the entry edits inside the member the inline variant wrote', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: ARMS }, '', {
			bindings: "rules: { k: ($) => choice(variant('a', seq('x', $.y)), variant('c', seq('z', $.y))) }, edits: { k: { '0/1': field('q') } }"
		});
		expect(raw.layerDiagnostics ?? []).toEqual([]);
		expect(raw.rules.k_a).toMatchObject({ type: 'SEQ', members: [{ type: 'STRING', value: 'x' }, { type: 'FIELD', name: 'q' }] });
	}, 60_000);
});
