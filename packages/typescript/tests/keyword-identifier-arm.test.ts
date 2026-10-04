import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

function memberNames(node: object): string[] {
	const names = new Set<string>();
	for (let o: object | null = node; o !== null && o !== Object.prototype && o !== Array.prototype; o = Object.getPrototypeOf(o)) {
		for (const name of Object.getOwnPropertyNames(o)) if (/^[a-z]/.test(name) && !(name in Array.prototype)) names.add(name);
	}
	return [...names];
}

function findParsed(node: unknown, kind: number): Record<string, unknown> | undefined {
	if (node === null || typeof node !== 'object') return undefined;
	if ((node as { $type?: unknown }).$type === kind) return node as Record<string, unknown>;
	for (const name of memberNames(node)) {
		const member = (node as Record<string, unknown>)[name];
		if (typeof member !== 'function' || member.length !== 0) continue;
		const held: unknown = member.call(node);
		for (const child of Array.isArray(held) ? held : [held]) {
			const found = findParsed(child, kind);
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

function readLeftContent(text: string): { $type: number; $text?: string } | undefined {
	const lhs = findParsed(ts.parse(`${text};`), ts.kinds.LhsExpression) as { content(): unknown } | undefined;
	const content = lhs?.content();
	return typeof content === 'number' ? { $type: content } : (content as { $type: number; $text?: string } | undefined);
}

describe('a contextual keyword at a slot that declares it as a keyword arm', () => {
	it('loose text resolves to the keyword arm the parser reads', () => {
		const built = ts.build.assignmentExpression({ left: 'async', right: ts.build.identifier('b') });
		const text = built.$render().toString();
		expect(text).toBe('async = b');
		expect((built._left as unknown as { _content: unknown })._content).toBe(ts.kinds.AsyncKeyword);
		expect(readLeftContent(text)?.$type).toBe(ts.kinds.AsyncKeyword);
	});

	it('loose text that is not a keyword arm stays an identifier', () => {
		const built = ts.build.assignmentExpression({ left: 's', right: ts.build.identifier('b') });
		const text = built.$render().toString();
		expect(readLeftContent(text)).toMatchObject({ $type: ts.kinds.Identifier, $text: 's' });
	});

	it('rejects an identifier spelled as the keyword arm', () => {
		expect(() => ts.build.assignmentExpression({ left: ts.build.identifier('async'), right: ts.build.identifier('b') })).toThrow(
			"LhsExpression.content: 'async' is this slot's keyword"
		);
	});
});
