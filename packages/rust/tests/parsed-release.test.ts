import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const items = (root: any): any[] => root.statements();
const chunks = (rs: any): number => rs.diagnostics.builtMemory().chunks;

describe.each(['arena', 'object'] as const)('a parsed root released, %s storage', (nodeStorage) => {
	it('leaves a built node naming one of its items rendering, the source included', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root: any = rs.parse('fn a() { x; }\nfn b() {}\n');
		const kept: any = root.$with.statements(items(root)[0]);
		rs.release(root);
		expect(String(kept.$render())).toBe('fn a() { x; }\n');
	});

	it('leaves a built node naming one of its leaves rendering', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root: any = rs.parse('fn a() {}\nfn b() {}\n');
		const [first, second] = items(root);
		const kept: any = first.$with.name(second.name());
		rs.release(root);
		expect(String(kept.$render())).toBe('fn b() {}');
	});

	it('does nothing when released a second time', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root: any = rs.parse('fn a() {}\n');
		rs.release(root);
		expect(() => rs.release(root)).not.toThrow();
	});
});

describe('a parsed root released, arena storage', () => {
	it('frees every chunk its parse took', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const before = chunks(rs);
		const root: any = rs.parse('fn a() { x; }\n// c\nfn b() {}\n');
		expect(chunks(rs)).toBeGreaterThan(before);
		rs.release(root);
		expect(chunks(rs)).toBe(before);
	});

	it('frees the chunks a built node keeps once that node is released', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const opened: any = rs.parse('fn w() {}\n');
		const opening: any = opened.$with.statements(items(opened)[0]);
		rs.release(opening);
		rs.release(opened);
		const before = chunks(rs);
		const root: any = rs.parse('fn a() { x; }\nfn b() {}\n');
		const kept: any = root.$with.statements(items(root)[0]);
		rs.release(root);
		expect(chunks(rs)).toBeGreaterThan(before);
		rs.release(kept);
		expect(chunks(rs)).toBe(before);
	});

	it('leaves a source parsed after it reading as itself, and its own views refused', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const first: any = rs.parse('fn a() { x; }\nfn b() {}\n');
		const [stale] = items(first);
		rs.release(first);
		const second: any = rs.parse('fn c() { y; }\nfn d() {}\n');
		expect(String(rs.render(second))).toBe('fn c() { y; }\nfn d() {}\n');
		expect(items(second).map((item: any) => String(item.$render()))).toEqual(['fn c() { y; }', 'fn d() {}']);
		expect(() => String(stale.$render())).toThrow(/released/);
	});

	it('leaves a view of one of its items answering as a released node does', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const root: any = rs.parse('fn a() { x; }\nfn b() {}\n');
		const [first] = items(root);
		rs.release(root);
		expect(() => String(first.$render())).toThrow(/released/);
	});
});
