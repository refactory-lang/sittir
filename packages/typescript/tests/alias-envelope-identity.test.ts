import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

type Node = { readonly $type: number; readonly _content?: unknown };
type Pair = Node & { key(): Node };
type Assignment = Node & { right(): { elements(): readonly Pair[] } };

function keysOf(source: string): readonly Node[] {
	const statement = ts.parse(source).statements()[0] as unknown as { expression(): Assignment };
	return statement.expression().right().elements().map((pair) => pair.key());
}

describe('an alias envelope is seated by the kind the parser shows', () => {
	it('keeps a keyword-spelled property name as a property_identifier around the keyword', () => {
		const [key] = keysOf("x = { type: 'css' };\n");
		expect(key!.$type).toBe(ts.kinds.PropertyIdentifier);
		expect(key!._content).toBe(ts.kinds.TypeKeyword);
	});

	it('keeps an identifier-spelled property name as a property_identifier around the identifier', () => {
		const [key] = keysOf('x = { a: 1 };\n');
		expect(key!.$type).toBe(ts.kinds.PropertyIdentifier);
		expect((key!._content as Node).$type).toBe(ts.kinds.Identifier);
	});

	it('renders both back to their source', () => {
		const source = "x = { type: 'css', a: 1 };\n";
		expect(ts.parse(source).$render()).toBe(source);
	});
});
