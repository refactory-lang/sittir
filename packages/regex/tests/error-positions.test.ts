import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isErrorNode } from '@sittir/common/utils';
import regex from '../src/index.ts';

const sideEntryOf = (node: object): object | undefined => {
	const seen = new Set<object>();
	const open: unknown[] = [node];
	while (open.length > 0) {
		const at = open.pop();
		if (typeof at !== 'object' || at === null || seen.has(at)) continue;
		seen.add(at);
		const sides = (at as { readonly $trivia?: Record<string, () => readonly unknown[]> }).$trivia;
		for (const side of ['leading', 'trailing', 'inner'] as const) {
			const entry = sides?.[side]?.().find(isErrorNode);
			if (entry !== undefined) return entry as object;
		}
		for (const [key, value] of Object.entries(at)) {
			if (key.startsWith('$') || key.startsWith('_') || key === 'toJSON' || key === 'toString' || typeof value !== 'function' || value.length !== 0) continue;
			const read: unknown = (value as () => unknown).call(at);
			open.push(...(Array.isArray(read) ? read : [read]));
		}
	}
	return undefined;
};

describe.each(['object', 'arena'] as const)('an ERROR read in %s storage', (nodeStorage) => {
	it('is a node of its kind wherever it is read: it renders its bytes and is disposable', async () => {
		const re = await createEngine(regex, { nodeStorage });
		const root = re.parse(')');
		const entry = sideEntryOf(re.parse('a)b'));
		for (const [error, text] of [
			[root, ')'],
			[entry, 'a)']
		] as const) {
			expect(isErrorNode(error)).toBe(true);
			const node = error as unknown as { $render(): unknown; [Symbol.dispose](): void };
			expect(typeof node[Symbol.dispose]).toBe('function');
			expect(String(node.$render())).toBe(text);
			expect(re.render(error as never).toString()).toBe(text);
		}
	});

	it('read in its tree holds sides; read as a side entry it holds none, and a write to one is refused', async () => {
		const re = await createEngine(regex, { nodeStorage });
		const root = re.parse(')') as unknown as { $trivia: { leading(...items: unknown[]): unknown; trailing(...items: unknown[]): { $render(): unknown; $trivia: { trailing(): readonly { $text(): string }[] } } } };
		const entry = sideEntryOf(re.parse('a)b')) as unknown as typeof root;
		expect(entry.$trivia.leading()).toEqual([]);
		expect(() => entry.$trivia.trailing(entry)).toThrow(/an ERROR read as a side entry holds no sides/);
		expect(root.$trivia.leading()).toEqual([]);
		const written = root.$trivia.trailing(entry);
		expect(String(written.$render())).toBe(')a)');
		expect(written.$trivia.trailing().map((item) => item.$text())).toEqual(['a)']);
	});
});
