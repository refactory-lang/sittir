import { describe, expect, it } from 'vitest';
import { assemblePredicted, predictedRawGrammarOf } from '../../__tests__/helpers/linked.ts';
import { slot } from '../render-body.ts';
import { emitTests } from '../test.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const field = (name: string) => ({ type: 'FIELD', name, content: sym('word') });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const optional = (content: unknown) => choice(content, { type: 'BLANK' });

const assembled = (host: unknown) =>
	assemblePredicted(
		predictedRawGrammarOf({
			root: seq(str('start'), sym('outer')),
			outer: seq(str('['), { type: 'FIELD', name: 'holder', content: sym('holder') }, str(']')),
			holder: seq(str('('), { type: 'FIELD', name: 'host', content: sym('host') }, str(')')),
			host,
			word: { type: 'PATTERN', value: '[a-z]+' }
		} as never)
	);

const builtChild = (host: unknown): string => {
	const { nodeMap, generatedIdTables } = assembled(host);
	const line = emitTests({ grammar: 'synth', nodeMap, generatedIdTables })
		.split('\n')
		.find((candidate) => candidate.includes('ir.outer('));
	expect(line).toBeDefined();
	return line!;
};

describe('the generated test of a kind holding a child with a required choice', () => {
	it('builds the child with every slot of one arm', () => {
		const line = builtChild(seq(choice(seq(field('first'), field('second')), field('other')), optional(field('tag'))));
		expect(line).toContain('first:');
		expect(line).toContain('second:');
		expect(line).not.toContain('other:');
		expect(line).not.toContain('tag:');
	});

	it('seats no arm when the choice has an empty arm', () => {
		const line = builtChild(seq(str('x'), optional(seq(field('first'), field('second')))));
		expect(line).not.toContain('first:');
		expect(line).not.toContain('second:');
	});

	it('seats no arm when an arm writes only fixed text', () => {
		const line = builtChild(choice(seq(field('first'), field('second')), str('none')));
		expect(line).not.toContain('first:');
		expect(line).not.toContain('second:');
	});

	it('seats no further slot when the required slots already fill an arm', () => {
		const line = builtChild(seq(field('lead'), choice(seq(field('extra'), field('last')), field('last'))));
		expect(line).toContain('lead:');
		expect(line).toContain('last:');
		expect(line).not.toContain('extra:');
	});

	it('asserts a non-empty render for a kind whose required arm writes text', () => {
		const { nodeMap, generatedIdTables } = assembled(choice(seq(field('first'), field('second')), field('other')));
		const renderBodies = new Map([['host', [...slot('first'), ...slot('second'), ...slot('other')]]]);
		const section = emitTests({ grammar: 'synth', nodeMap, generatedIdTables, renderBodies })
			.split("describe('")
			.find((candidate) => candidate.startsWith('host'));
		expect(section).toContain('expect(rendered.length).toBeGreaterThan(0);');
	});
});
