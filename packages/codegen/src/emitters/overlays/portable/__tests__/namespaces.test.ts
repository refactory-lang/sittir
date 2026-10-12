import { describe, expect, it } from 'vitest';
import { namespaceSection, namespaceTree } from '../namespaces.ts';

const tree = (entries: Record<string, readonly string[]>) =>
	namespaceTree(new Map(Object.entries(entries).map(([kind, vocabs]) => [kind, vocabs.map((vocab) => ({ vocab }))])));

describe('namespaceTree', () => {
	it('nests every claimed path under its prefixes, each node holding the kinds read at or under it', () => {
		const root = tree({ binary_expression: ['expression.binary', 'expression.binary.add'], call_expression: ['expression.call'] });
		expect([...root.children.keys()]).toEqual(['expression']);
		const expression = root.children.get('expression')!;
		expect(expression.kinds).toEqual(['binary_expression', 'call_expression']);
		expect(expression.children.get('binary')?.children.get('add')?.kinds).toEqual(['binary_expression']);
		expect(expression.children.get('call')?.path).toBe('expression.call');
	});
});

describe('namespaceSection', () => {
	it('counts each depth\'s paths, the kinds read exactly there, and the paths refining a read path', () => {
		const entries = new Map(
			Object.entries({
				binary: ['expression.binary', 'expression.binary.add'],
				assign: ['expression.assignment.add'],
				call: ['expression.call']
			}).map(([kind, vocabs]) => [kind, vocabs.map((vocab) => ({ vocab }))])
		);
		expect(namespaceSection(entries)).toEqual({
			levels: [
				{ depth: 1, paths: 1, kinds: 0, refinements: 0 },
				{ depth: 2, paths: 3, kinds: 2, refinements: 0 },
				{ depth: 3, paths: 2, kinds: 2, refinements: 1 }
			]
		});
	});
});
