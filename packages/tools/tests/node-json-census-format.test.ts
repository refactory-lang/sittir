import { describe, expect, it } from 'vitest';
import { formatNodeJsonCensus, type NodeJsonCensus } from '../src/census/node-json-census.ts';

const census: NodeJsonCensus = {
	grammar: 'synth',
	entries: 1,
	skipped: 0,
	readFailures: [],
	textLeaves: [
		{ kind: 'comment_regular', instances: 0, rendering: 0, trivia: 2 },
		{ kind: 'identifier', instances: 4, rendering: 4, trivia: 0 },
		{ kind: 'string_end', instances: 3, rendering: 1, trivia: 0 },
		{ kind: 'unseen', instances: 0, rendering: 0, trivia: 0 }
	],
	unbuildable: [],
	unitsProduced: 0,
	slotShapes: {},
	commentKinds: ['comment']
};

describe('the node-json census text-leaf table', () => {
	const out = formatNodeJsonCensus(census);
	const section = (heading: string): string[] => {
		const lines = out.split('\n');
		const start = lines.findIndex((line) => line.startsWith(heading));
		const end = lines.findIndex((line, index) => index > start && line.startsWith('#'));
		return lines.slice(start + 1, end).map((line) => line.trim().split('\t')[0]!);
	};

	it('lists as unwrapped only a kind the corpus holds without $render', () => {
		expect(section('## 1. text-leaf kinds with no wrap')).toEqual(['string_end']);
	});

	it('reports a kind the corpus holds only in trivia as trivia only, and one it never holds as having no corpus instance', () => {
		expect(section('## 1b. text-leaf kinds with no corpus node')).toEqual(['comment_regular', 'unseen']);
		expect(out).toContain('  comment_regular\ttrivia only\ttrivia 2');
		expect(out).toContain('  unseen\tno corpus instance');
	});
});
