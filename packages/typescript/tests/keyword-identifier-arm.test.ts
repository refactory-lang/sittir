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
	if (typeof content === 'number' || content === undefined) return content === undefined ? undefined : { $type: content };
	const leaf = content as { $type: number; $text(): string };
	return { $type: leaf.$type, $text: leaf.$text() };
}

describe('a contextual keyword at a slot the grammar relaxes it in', () => {
	it('loose text builds the identifier the parser reads', () => {
		const built = ts.build.assignmentExpression({ left: 'async', right: ts.build.identifier('b') });
		const text = built.$render().toString();
		expect(text).toBe('async = b');
		const content = (built._left as unknown as { _content: { $type: number; $text(): string } })._content;
		expect({ $type: content.$type, $text: content.$text() }).toEqual({ $type: ts.kinds.Identifier, $text: 'async' });
		expect(readLeftContent(text)).toMatchObject({ $type: ts.kinds.Identifier, $text: 'async' });
	});

	it('loose text that is not a keyword stays an identifier', () => {
		const built = ts.build.assignmentExpression({ left: 's', right: ts.build.identifier('b') });
		const text = built.$render().toString();
		expect(readLeftContent(text)).toMatchObject({ $type: ts.kinds.Identifier, $text: 's' });
	});

	it('accepts an identifier spelled as the relaxed keyword', () => {
		const built = ts.build.assignmentExpression({ left: ts.build.identifier('async'), right: ts.build.identifier('b') });
		expect(built.$render().toString()).toBe('async = b');
	});
});
