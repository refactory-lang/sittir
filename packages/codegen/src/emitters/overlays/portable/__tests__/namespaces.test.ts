import { describe, expect, it } from 'vitest';
import { aliasesOf, namespaceSection, namespaceTree } from '../namespaces.ts';

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

describe('aliasesOf', () => {
	it('aliases a path under each ancestor where its last segment is unique among the ancestor\'s descendants', () => {
		const { aliases } = aliasesOf(tree({ a: ['expression.binary.add'], b: ['expression.binary.sub'] }));
		expect(aliases).toContainEqual({ under: 'expression', name: 'add', path: 'expression.binary.add' });
		expect(aliases).toContainEqual({ under: '', name: 'add', path: 'expression.binary.add' });
	});

	it('drops a segment two descendants share, naming both paths', () => {
		const { aliases, dropped } = aliasesOf(tree({ a: ['expression.binary.add'], b: ['expression.assignment.add'] }));
		expect(aliases.filter((a) => a.name === 'add' && a.under === 'expression')).toEqual([]);
		expect(dropped).toContainEqual({ under: 'expression', name: 'add', paths: ['expression.assignment.add', 'expression.binary.add'] });
	});

	it('lets a real child of the same name win over an alias', () => {
		const { aliases } = aliasesOf(tree({ a: ['type.named'], b: ['expression.type.named'] }));
		expect(aliases.filter((a) => a.under === '' && a.name === 'type')).toEqual([]);
	});

	it('never aliases a direct child, which is already there', () => {
		const { aliases } = aliasesOf(tree({ a: ['expression.call'] }));
		expect(aliases.filter((a) => a.under === 'expression')).toEqual([]);
	});
});

describe('namespaceSection', () => {
	it('counts each depth\'s paths, the kinds read exactly there, the paths refining a read path, and the aliases it adds, and lists the dropped aliases', () => {
		const entries = new Map(
			Object.entries({
				binary: ['expression.binary', 'expression.binary.add'],
				assign: ['expression.assignment.add'],
				call: ['expression.call']
			}).map(([kind, vocabs]) => [kind, vocabs.map((vocab) => ({ vocab }))])
		);
		expect(namespaceSection(entries)).toEqual({
			levels: [
				{ depth: 1, paths: 1, kinds: 0, refinements: 0, aliases: 3 },
				{ depth: 2, paths: 3, kinds: 2, refinements: 0, aliases: 0 },
				{ depth: 3, paths: 2, kinds: 2, refinements: 1, aliases: 0 }
			],
			dropped: [
				{ under: '', name: 'add', paths: ['expression.assignment.add', 'expression.binary.add'] },
				{ under: 'expression', name: 'add', paths: ['expression.assignment.add', 'expression.binary.add'] }
			]
		});
	});
});
