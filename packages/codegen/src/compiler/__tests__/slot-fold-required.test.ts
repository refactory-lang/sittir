import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { assemblePredicted, predictedRawGrammarOf } from '../../__tests__/helpers/linked.ts';
import { grammarPackage } from '../../grammars.ts';
import { compileGrammar } from '../compile.ts';
import { isMultiple, isNonEmpty, isRequired } from '../model/node-map.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const repeat = (content: unknown) => ({ type: 'REPEAT', content });
const repeat1 = (content: unknown) => ({ type: 'REPEAT1', content });
const optional = (content: unknown) => choice(content, { type: 'BLANK' });
const pattern = (value: string) => ({ type: 'PATTERN', value });

const cardinalityOf = (rule: unknown, slot = 'parts') => {
	const { nodeMap } = assemblePredicted(
		predictedRawGrammarOf({ root: seq(str('start'), sym('holder')), holder: seq(str('('), rule, str(')')), first: pattern('[a-z]+'), second: pattern('[0-9]+'), third: pattern('[A-Z]+') })
	);
	const found = nodeMap.nodes.get('holder')!.slots.find((candidate) => candidate.name === slot)!;
	return { required: isRequired(found), multiple: isMultiple(found), nonEmpty: isNonEmpty(found) };
};

const parts = (content: unknown) => field('parts', content);

describe('a slot folded from positions of one name', () => {
	it('is required and non-empty when a repeat1 position stands beside an optional one', () => {
		expect(cardinalityOf(seq(parts(repeat1(sym('first'))), parts(optional(sym('second')))))).toEqual({ required: true, multiple: true, nonEmpty: true });
	});

	it('is required and non-empty when a repeat stands beside a required position', () => {
		expect(cardinalityOf(seq(parts(repeat(sym('first'))), parts(sym('second'))))).toEqual({ required: true, multiple: true, nonEmpty: true });
	});

	it('stays optional when no position is required', () => {
		expect(cardinalityOf(seq(parts(repeat(sym('first'))), parts(optional(sym('second')))))).toEqual({ required: false, multiple: true, nonEmpty: false });
	});

	it('stays optional when another arm of a choice does not hold it', () => {
		const arm = seq(parts(repeat1(sym('first'))), parts(optional(sym('second'))));
		expect(cardinalityOf(choice(arm, field('other', sym('third'))))).toEqual({ required: false, multiple: true, nonEmpty: false });
	});

	it('is required when every arm of a choice requires it', () => {
		const arm = seq(parts(repeat(sym('first'))), parts(sym('second')));
		expect(cardinalityOf(choice(arm, seq(str('x'), parts(sym('third')))))).toMatchObject({ required: true, multiple: true });
	});
});

describe('the grammars', () => {
	const slotOf = async (grammar: string, kind: string, name: string) => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar) });
		const found = nodeMap.nodes.get(kind)!.slots.find((slot) => slot.name === name)!;
		return { required: isRequired(found), nonEmpty: isNonEmpty(found) };
	};
	let java: Awaited<ReturnType<typeof slotOf>>;
	let rust: Awaited<ReturnType<typeof slotOf>>;
	let python: Awaited<ReturnType<typeof slotOf>>;

	beforeAll(async () => {
		java = await slotOf('java', 'array_creation_expression_arm1', 'dimensions');
		rust = await slotOf('rust', 'match_block_arms', 'arms');
		python = await slotOf('python', 'match_block', 'alternative');
	}, FULL_PIPELINE_TIMEOUT);

	it("java's array dimensions are non-empty", () => {
		expect(java).toEqual({ required: true, nonEmpty: true });
	});

	it("rust's match arms are non-empty", () => {
		expect(rust).toEqual({ required: true, nonEmpty: true });
	});

	it("python's match arms admit an empty list", () => {
		expect(python).toEqual({ required: false, nonEmpty: false });
	});
});
