import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

type Node = { readonly $type: number; readonly _content?: unknown };
type Pair = Node & { key(): Node };
type Assignment = Node & { right(): { properties(): readonly Pair[] } };

function keysOf(source: string): readonly Node[] {
	const statement = ts.parse(source).statements()[0] as unknown as { expression(): Assignment };
	return statement.expression().right().properties().map((pair) => pair.key());
}

describe('an alias envelope is seated by the kind the parser shows', () => {
	it('reads a keyword-spelled property name as an identifier inside the property_identifier envelope', () => {
		const [key] = keysOf("x = { type: 'css' };\n");
		expect(key!.$type).toBe(ts.kinds.PropertyIdentifier);
		const content = key!._content as { $type: number; $text: string };
		expect(content.$type).toBe(ts.kinds.Identifier);
		expect(content.$text).toBe('type');
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

describe("a trivia write on a content that shares its envelope's parser node", () => {
	it.each(['leading', 'trailing'] as const)('%s: the envelope unfolds and the written comment renders', (side) => {
		const root = ts.parse('interface A { x: number }\nlet b = 1;\n');
		const declaration = root.statements()[0];
		if (declaration === undefined || !ts.is.interfaceDeclaration(declaration)) throw new Error('expected an interface declaration');
		const envelope = declaration.body();
		const content = envelope.content();
		expect(content).not.toBe(envelope);
		content.$trivia[side]('// c');
		const out = root.$render();
		expect(out).toContain('// c\n');
		expect(out.endsWith('let b = 1;\n')).toBe(true);
		expect(ts.parse(out).$errors).toEqual([]);
		const comments = (entries: readonly unknown[]) => entries.filter((entry) => typeof entry !== 'number');
		expect(comments(envelope.$trivia[side]())).toHaveLength(1);
		expect(content.$trivia[side]()).toEqual([]);
		expect(out.split('// c').length - 1).toBe(1);
		expect(JSON.stringify(root).match(/"(?:leading|trailing)Comments":\[\{/g)).toHaveLength(1);
	});
});
