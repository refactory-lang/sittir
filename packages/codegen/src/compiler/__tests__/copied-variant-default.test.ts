import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { assemblePredicted } from '../../__tests__/helpers/linked.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { compileGrammar } from '../compile.ts';
import { AssembledSupertype, storageKindOfRef } from '../model/node-map.ts';
import { grammarPackage } from '../../grammars.ts';

const UPSTREAM = {
	extras: '$.outer, $.other',
	rules:
		"outer: ($) => seq('impl', field('body', $._suite)), other: ($) => seq('def', field('body', $._suite)), _suite: ($) => choice($.blk, $.inl), blk: ($) => seq('{', $.word, '}'), inl: ($) => seq(':', $.word)"
};
const EDITS = "edits: { _suite: { 0: variant('block', { default: true }), 1: variant('inline') }, outer: { 'body:/(_suite)/(blk as outer_blk)/1': alias('w') } }";

type Arm = { readonly type: string; readonly annotations?: Record<string, unknown>; readonly content?: { readonly annotations?: Record<string, unknown> } };
const annotationsOf = (arm: Arm): Record<string, unknown> | undefined => (arm.type === 'ALIAS' ? arm.content?.annotations : arm.annotations);

describe("a context's copy of a variant-bearing choice keeps its default", () => {
	it('the copy of the default arm stays the default', async () => {
		const raw = await evaluateTempGrammar(UPSTREAM, '', { bindings: EDITS });
		const arms = (raw.rules._suite_outer as unknown as { readonly members: readonly Arm[] }).members;
		expect(arms.map(annotationsOf)).toEqual([
			{ variant: 'outer_blk', variantOf: '_suite', default: true },
			{ variant: 'inline', variantOf: '_suite' }
		]);
	}, 60_000);

	it('the copied supertype finds its variants through its copy base, and its default is the copied arm', async () => {
		const { nodeMap } = assemblePredicted(await evaluateTempGrammar(UPSTREAM, '', { bindings: EDITS }));
		const copy = nodeMap.nodes.get('_suite_outer');
		expect(copy).toBeInstanceOf(AssembledSupertype);
		expect((copy as AssembledSupertype).variantSubtypes?.map((ref) => ref.variantOf)).toEqual(['_suite', '_suite']);
		const chosen = (copy as AssembledSupertype).defaultVariantSubtype;
		expect(chosen === undefined ? undefined : storageKindOfRef(chosen.node)).toBe('outer_blk');
	}, 60_000);

	it("python's class suite defaults to the class block, as its source defaults to the block", async () => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage('python') });
		const chosen = (kind: string) => {
			const node = nodeMap.nodes.get(kind);
			const ref = node instanceof AssembledSupertype ? node.defaultVariantSubtype : undefined;
			return ref === undefined ? undefined : storageKindOfRef(ref.node);
		};
		expect([chosen('_suite'), chosen('_suite_class_definition')]).toEqual(['suite_block', 'suite_block_class_declaration']);
	}, FULL_PIPELINE_TIMEOUT);
});
