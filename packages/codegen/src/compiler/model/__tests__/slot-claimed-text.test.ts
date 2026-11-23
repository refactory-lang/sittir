import { describe, expect, it } from 'vitest';
import { assemblePredicted, linkPredicted, predictedRawGrammarOf, rawIdTablesOf, withFixtureLexicalRanks } from '../../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../../__tests__/helpers/temp-grammar.ts';
import { emitAll } from '../../../emitters/emit.ts';
import { unexpectableExpectEntries } from '../../diagnostics/grammar-diagnostics.ts';
import { collectKindEntries } from '../../../emitters/kind-discriminant.ts';
import { runTemplateEmitter } from '../../../emitters/templates.ts';
import { assemble, AssembleCtx, hydrateSlotRefs } from '../../assemble.ts';
import { normalizeGrammar } from '../../normalize.ts';
import { stampIrSurface } from '../ir-surface.ts';
import { NO_JOINS } from '../join-seams/index.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const repeat = (content: unknown) => ({ type: 'REPEAT', content });
const pattern = (value: string) => ({ type: 'PATTERN', value });

const leaves = { name: pattern('[a-z]+'), number: pattern('[0-9]+') };
const quoted = () => choice(seq(str('"'), field('value', sym('name')), str('"')), seq(str('"""'), field('value', sym('name')), str('"""')));

const modelOf = (rule: unknown) => assemblePredicted(predictedRawGrammarOf({ root: seq(str('start'), sym('holder')), holder: rule, ...leaves }));
const refusals = (rule: unknown) => modelOf(rule).nodeMap.slotChoiceTextFailures?.get('holder') ?? [];

describe('a choice its one slot claims', () => {
	it('refuses arms told apart only by their text, naming the kind and the text', () => {
		const [failure, ...rest] = refusals(quoted());
		expect(rest).toEqual([]);
		expect(failure?.code).toBe('slot-choice-text-lost');
		expect(failure?.ownerKind).toBe('holder');
		expect(failure?.message).toContain('holder');
		expect(failure?.message).toContain(`'"""'`);
	});

	it('refuses text that belongs to each item of a list', () => {
		expect(refusals(seq(str('{'), repeat(choice(seq(field('items', sym('name')), str(';')), field('items', sym('number')))), str('}'))).map((failure) => failure.code)).toEqual(['slot-choice-text-lost']);
	});

	it('keeps a bare literal beside an arm with text out of the slot', () => {
		for (const literal of ['break', 'name']) {
			const rule = seq(str('yield'), choice(seq(str('return'), sym('name')), str(literal)));
			const holder = modelOf(rule).nodeMap.nodes.get('holder') as unknown as { slots: readonly { values: readonly { value?: string }[] }[] };
			expect(refusals(rule)).toEqual([]);
			expect(holder.slots.flatMap((slot) => slot.values).filter((value) => value.value !== undefined)).toEqual([]);
		}
	});

	it('refuses two bare literals beside an arm with text, which the slot being absent cannot tell apart', () => {
		expect(refusals(seq(str('yield'), choice(seq(str('return'), sym('name')), str('break'), str('stop')))).map((failure) => failure.code)).toEqual(['slot-choice-text-lost']);
	});

	it('passes when each arm with text is identified by the kinds it admits', () => {
		expect(refusals(seq(str('var'), choice(seq(str('='), field('value', sym('name'))), field('value', sym('number')))))).toEqual([]);
	});

	it('passes when every arm writes the same text', () => {
		expect(refusals(choice(seq(str('('), field('value', sym('name'))), seq(str('('), field('value', sym('number')))))).toEqual([]);
	});
});

describe('a bare literal beside an arm with text', () => {
	it('is written when the slot is absent', async () => {
		const rules = `source: ($) => repeat($.holder), holder: ($) => seq('yield', choice(seq('return', $.name), 'break'), ';'), name: ($) => /[a-z]+/`;
		const raw = await evaluateTempGrammar({ extras: '/\\s/', rules }, '');
		const normalized = normalizeGrammar(linkPredicted(raw, { generatedIdTables: withFixtureLexicalRanks(rawIdTablesOf(raw)) }));
		const nodeMap = assemble(AssembleCtx.from(normalized));
		hydrateSlotRefs(nodeMap, { inline: new Set(raw.inline) });
		type Part = { kind: string; text?: string; arms?: { test: string; kinds?: string[]; body: Part[] }[]; fallback?: Part[] };
		const body = runTemplateEmitter({ grammar: 'synth', nodeMap, kindEntries: collectKindEntries(nodeMap, normalized.generatedIdTables), joins: NO_JOINS }).bodies.get('holder') as unknown as Part[];
		const texts = (parts: readonly Part[] | undefined) => (parts ?? []).filter((part) => part.kind === 'text').map((part) => part.text);
		const gate = body.find((part) => part.kind === 'if');
		expect(gate?.arms?.map((arm) => [arm.test, arm.kinds, texts(arm.body)])).toEqual([['name', undefined, ['return']]]);
		expect(texts(gate?.fallback)).toEqual(['break']);
	}, 60_000);
});

describe('a choice whose arms are fixed tokens alone', () => {
	const channel = () => seq(choice(str('chan'), seq(str('chan'), str('<-')), seq(str('<-'), str('chan'))), field('value', sym('name')));

	it('refuses an arm of several tokens in a one-value slot, saying what is known', () => {
		const [failure, ...rest] = refusals(channel());
		expect(rest).toEqual([]);
		expect(failure?.code).toBe('slot-choice-text-lost');
		expect(failure?.message).toContain('holds one value');
		expect(failure?.message).toContain(`'chan <-'`);
		expect(failure?.message).not.toContain('would lose');
		expect(failure?.proposal).toContain('variant(');
	});

	it('takes a single-literal arm as slot content', () => {
		expect(refusals(seq(field('operator', choice(str('+'), str('-'))), field('value', sym('name'))))).toEqual([]);
	});
});

describe('the refusal of a slot-claimed choice', () => {
	const rules = `source: ($) => repeat($.holder), holder: ($) => choice(seq('"', field('value', $.name), '"'), seq('"""', field('value', $.name), '"""')), name: ($) => /[a-z]+/`;
	const compiled = async () => {
		const raw = await evaluateTempGrammar({ extras: '/\\s/', rules }, '');
		const normalized = normalizeGrammar(linkPredicted(raw, { generatedIdTables: withFixtureLexicalRanks(rawIdTablesOf(raw)) }));
		const nodeMap = assemble(AssembleCtx.from(normalized));
		stampIrSurface(nodeMap, normalized.generatedIdTables);
		return { nodeMap, generatedIdTables: normalized.generatedIdTables };
	};
	const emitted = async (allowDiagnostics?: ReadonlySet<string>) => {
		const { nodeMap, generatedIdTables } = await compiled();
		return () => emitAll({ grammar: 'synth', nodeMap, generatedIdTables, joins: NO_JOINS, ...(allowDiagnostics === undefined ? {} : { allowDiagnostics }) });
	};

	it('cannot be expected by a layer', () => {
		expect(unexpectableExpectEntries('g', { 'slot-choice-text-lost': ['holder'] })).toHaveLength(1);
	});

	it('leaves the model readable', async () => {
		expect((await compiled()).nodeMap.slotChoiceTextFailures?.has('holder')).toBe(true);
	}, 60_000);

	it('halts emit, naming the kind', async () => {
		expect(await emitted()).toThrow(/slot-choice-text-lost: holder/);
	}, 60_000);

	it('does not yield to another code in the allow set', async () => {
		expect(await emitted(new Set(['join-seam-unreached']))).toThrow(/slot-choice-text-lost: holder/);
	}, 60_000);

	it('emits when the run allows it by name', async () => {
		expect(await emitted(new Set(['slot-choice-text-lost']))).not.toThrow();
	}, 60_000);
});
