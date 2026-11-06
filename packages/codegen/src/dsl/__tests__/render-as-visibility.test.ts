import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { diagnoseEvaluationStages } from '../../compiler/stage.ts';
import { diagnoseRuleCauses } from '../../compiler/diagnostics/rule-causes.ts';
import { unexpectableExpectEntries } from '../../compiler/diagnostics/grammar-diagnostics.ts';

interface Ref {
	readonly aliasedAs: string | undefined;
}

function referencesTo(rule: unknown, external: string): Ref[] {
	const out: Ref[] = [];
	const visit = (node: unknown, aliasedAs: string | undefined): void => {
		if (node === null || typeof node !== 'object') return;
		const walked = node as { type?: string; name?: string; value?: string; content?: unknown; members?: unknown[] };
		if (walked.type === 'SYMBOL' && walked.name === external) out.push({ aliasedAs });
		const next = walked.type === 'ALIAS' ? walked.value : undefined;
		if (walked.content !== undefined) visit(walked.content, next);
		for (const member of walked.members ?? []) visit(member, undefined);
	};
	visit(rule, undefined);
	return out;
}

const UPSTREAM = {
	extras: '/\\s/',
	externals: '$._marker',
	rules: 'item: ($) => seq($.word, $._marker), other: ($) => seq("x", $._marker), source2: ($) => repeat(choice($.item, $.other))'
};

const UPSTREAM_ALIASING = {
	...UPSTREAM,
	rules: 'item: ($) => seq($.word, alias($._marker, $.mark)), other: ($) => seq("x", $._marker), source2: ($) => repeat(choice($.item, $.other))'
};

async function diagnosticsOf(upstream: typeof UPSTREAM, config: string) {
	const raw = await evaluateTempGrammar(upstream, config);
	const stages = raw.stages === undefined ? undefined : diagnoseEvaluationStages(raw.stages);
	return { raw, diagnostics: diagnoseRuleCauses({ grammar: 'demo', raw, enriched: stages?.enriched }) };
}

describe('a hidden external with a renderAs body', () => {
	it('is aliased visible at every use, named by the key without its underscores', async () => {
		const { raw } = await diagnosticsOf(UPSTREAM, "renderAs: ($) => ({ _marker: string('m') })");
		expect(raw.visibleAs).toMatchObject({ _marker: 'marker' });
		expect(referencesTo(raw.rules.item, '_marker')).toEqual([{ aliasedAs: 'marker' }]);
		expect(referencesTo(raw.rules.other, '_marker')).toEqual([{ aliasedAs: 'marker' }]);
	}, 60_000);

	it('takes the name its entry gives with alias(body, $.name)', async () => {
		const { raw } = await diagnosticsOf(UPSTREAM, "renderAs: ($) => ({ _marker: alias(string('m'), $.mark) })");
		expect(raw.visibleAs).toMatchObject({ _marker: 'mark' });
		expect(referencesTo(raw.rules.other, '_marker')).toEqual([{ aliasedAs: 'mark' }]);
		expect(raw.renderAs?._marker).toMatchObject({ type: 'STRING', value: 'm' });
	}, 60_000);

	it('keeps upstream\'s sites and leaves its bare uses bare when upstream aliases it somewhere', async () => {
		const { raw } = await diagnosticsOf(UPSTREAM_ALIASING, "renderAs: ($) => ({ _marker: string('m') })");
		expect(raw.visibleAs?._marker).toBeUndefined();
		expect(referencesTo(raw.rules.item, '_marker')).toEqual([{ aliasedAs: 'mark' }]);
		expect(referencesTo(raw.rules.other, '_marker')).toEqual([{ aliasedAs: undefined }]);
	}, 60_000);
});

describe('an authored alias of an external outside renderAs', () => {
	const authored = 'rules: { extra: ($) => seq("y", alias($._marker, $.mark2)) }';

	it('blocks with external-alias-outside-render-as, naming the rule and the renderAs form', async () => {
		const { diagnostics } = await diagnosticsOf(UPSTREAM, authored);
		const found = diagnostics.filter((d) => d.code === 'external-alias-outside-render-as');
		expect(found).toHaveLength(1);
		expect(found[0]).toMatchObject({ canProceed: false, ownerKind: '_marker' });
		expect(found[0]?.message).toContain("rules: 'extra'");
		expect(found[0]?.message).toContain('alias(body, $.mark2)');
	}, 60_000);

	it('exempts an alias that copies an upstream site exactly', async () => {
		const { diagnostics } = await diagnosticsOf(UPSTREAM_ALIASING, 'rules: { extra: ($) => seq("y", alias($._marker, $.mark)) }');
		expect(diagnostics.filter((d) => d.code === 'external-alias-outside-render-as')).toEqual([]);
	}, 60_000);

	it('is unexpectable', () => {
		expect(unexpectableExpectEntries('demo', { 'external-alias-outside-render-as': ['_marker'] })).toHaveLength(1);
	});
});

describe('an entry alias that names nothing', () => {
	it('is refused when it is a string', async () => {
		const { diagnostics } = await diagnosticsOf(UPSTREAM, "renderAs: ($) => ({ _marker: alias(string('m'), 'mark') })");
		expect(diagnostics.filter((d) => d.code === 'render-as-alias-invalid')).toMatchObject([{ canProceed: false, ownerKind: '_marker' }]);
	}, 60_000);

	it('is refused on an external upstream already aliases', async () => {
		const { diagnostics } = await diagnosticsOf(UPSTREAM_ALIASING, "renderAs: ($) => ({ _marker: alias(string('m'), $.mark) })");
		const found = diagnostics.filter((d) => d.code === 'render-as-alias-invalid');
		expect(found).toMatchObject([{ canProceed: false, ownerKind: '_marker' }]);
		expect(found[0]?.message).toContain('already aliased by the upstream grammar');
	}, 60_000);

	it('is unexpectable', () => {
		expect(unexpectableExpectEntries('demo', { 'render-as-alias-invalid': ['_marker'] })).toHaveLength(1);
	});
});
