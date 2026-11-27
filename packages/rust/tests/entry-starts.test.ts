import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const items = (root: any): any[] => root.statements();

describe.each(['arena', 'object'] as const)('a render reads the sides its tree holds, wherever they are, %s storage', (nodeStorage) => {
	it('renders a read with no entry and no blank line as it reads', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const source = 'fn a() {}\nfn b() {}\n';
		expect(String(rs.render(rs.parse(source)))).toBe(source);
	});

	it.each([
		['a read with no entry', 'fn a() {}\n\nfn b() {}\n'],
		['a comment at the top only', '// c\nfn a() {}\n\nfn b() {}\n'],
		['a comment inside the first item', 'fn a() { /* c */ x; }\n\nfn b() {}\n'],
		['a comment trailing the last item', 'fn a() {}\n\nfn b() {} // c\n'],
	])('renders %s as it reads, twice and rebuilt', async (_, source) => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root: any = rs.parse(source);
		expect(String(rs.render(root))).toBe(source);
		expect(String(rs.render(root))).toBe(source);
		expect(String(root.$with.statements(...items(root)).$render())).toBe(source);
	});

	it('renders an item below the root with the comment inside it', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const [first, second] = items(rs.parse('fn a() { /* c */ x; }\nfn b() {}\n'));
		expect(String(first.$render())).toBe('fn a() { /* c */ x; }');
		expect(String(second.$render())).toBe('fn b() {}');
	});

	it('renders a comment a write gave an item after the parse', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root: any = rs.parse('fn a() {}\nfn b() {}\n');
		items(root)[1].$trivia.leading('// w');
		expect(String(rs.render(root))).toBe({ arena: 'fn a() {}\n// w\nfn b() {}\n', object: 'fn a() {}\n\n// w\nfn b() {}\n' }[nodeStorage]);
	});

	it('moves a comment with the item it leads when the items swap', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root: any = rs.parse('fn a() {}\n// c\nfn b() {}\n');
		const [first, second] = items(root);
		expect(String(root.$with.statements(second, first).$render())).toBe('// c\nfn b() {}\n\nfn a() {}\n');
	});

	it('renders an item of one read, with its comment, inside another read', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const [, commented] = items(rs.parse('fn a() {}\n// c\nfn b() {}\n'));
		const other: any = rs.parse('fn x() {}\n');
		expect(String(other.$with.statements(...items(other), commented).$render())).toBe('fn x() {}\n\n// c\nfn b() {}\n');
	});
});
