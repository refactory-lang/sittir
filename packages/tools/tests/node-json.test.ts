// A node's JSON is its structure: kind names, accessor-named slots, leaf
// text and comments. Nothing else crosses: no stamp, tree token, layout,
// storage keys or `$with`, so revived JSON renders with the engine's
// formatting.
import { describe, expect, it } from 'vitest';
import { createEngine, Source, sourceOf } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

const rs = await createEngine(await languageByName('rust'));
const py = await createEngine(await languageByName('python'));
const scm = await createEngine(await languageByName('scm'));
const ts = await createEngine(await languageByName('typescript'));

type Json = { readonly [key: string]: unknown };
const json = (node: unknown): Json => JSON.parse(JSON.stringify(node)) as Json;
const META = new Set(['$type', '$text', 'leadingComments', 'trailingComments', 'innerComments']);

function everyObject(value: unknown, visit: (object: Json) => void): void {
	if (Array.isArray(value)) for (const item of value) everyObject(item, visit);
	else if (value !== null && typeof value === 'object') {
		visit(value as Json);
		for (const child of Object.values(value)) everyObject(child, visit);
	}
}

function find(value: unknown, kind: string): Json | undefined {
	let found: Json | undefined;
	everyObject(value, (object) => {
		if (found === undefined && object.$type === kind) found = object;
	});
	return found;
}

describe('toJSON writes a node as its structure', () => {
	const fn = rs.parse('fn f(a: u8) {}\n').statements()[0]!;

	it('names kinds and slots: kind names, accessor names, leaf text', () => {
		expect(json(fn)).toMatchObject({
			$type: 'function_item',
			name: { $type: 'identifier', $text: 'f' },
			parameters: { $type: 'parameters' },
			body: { $type: 'block' }
		});
	});

	it('writes only $type, $text, the comment keys and accessor names, at every depth', () => {
		everyObject(json(fn), (object) => {
			for (const key of Object.keys(object)) {
				if (key.startsWith('$') || key.startsWith('_')) expect(META.has(key), `key ${key}`).toBe(true);
			}
		});
	});

	it('writes a list slot as an array, an empty list as [], and omits an absent optional slot', () => {
		const written = json(fn);
		const elements = (written.parameters as Json).elements as Json;
		expect(Array.isArray(elements.items)).toBe(true);
		expect(elements.items).toHaveLength(1);
		expect((written.body as Json).statements).toEqual([]);
		expect(written).not.toHaveProperty('returnType');
		expect(written).not.toHaveProperty('visibilityModifier');
	});

	it('writes comments Babel-style and leaves layout out', () => {
		const item = rs.parse('// x\n\n    fn f() {}\n').statements()[0]!;
		const written = json(item);
		expect(written.leadingComments).toEqual([{ $type: 'line_comment', content: { $type: 'line_comment_regular', $text: ' x' } }]);
		expect(written).not.toHaveProperty('trailingComments');
	});

	it('writes a kind id as its kind name, a keyword presence as true, and omits an absent one', () => {
		const comparison = find(json(py.parse('a < b\n')), 'comparison_operator_comparator');
		expect(comparison?.operators).toEqual({ $type: 'lt' });
		expect(find(json(py.parse('async def f():\n    pass\n')), 'function_definition')?.async).toBe(true);
		expect(find(json(py.parse('def f():\n    pass\n')), 'function_definition')).not.toHaveProperty('async');
	});

	it('writes an optional slot that chose none as null, the way a builder takes it', () => {
		expect(find(json(py.parse('[e for f in g]\n')), 'for_in_clause')).toHaveProperty('trailingComma', null);
	});

	it('gives a parsed node and the node built from the same source equal JSON', () => {
		const parsed = rs.parse('fn f() {}\n').statements()[0]!;
		const built = rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: rs.build.block({ statements: [] }) });
		expect(json(built)).toEqual(json(parsed));
	});

	it('writes an ERROR entry as its kind name and text, on the side that holds it', () => {
		const item = rs.parse('fn f() {} @@ fn g() {}').statements()[0]!;
		expect(json(item).trailingComments).toEqual([{ $type: 'ERROR', $text: '@@' }]);
	});

	it('writes a string slot as its string, inferring no kind from the text', () => {
		const escape = find(json(scm.parse('((x) @a (#eq? @a "b\\n"))\n')), 'escape_sequence');
		expect(typeof escape?.content).toBe('string');
	});
});

describe('engine.reviver builds JSON back into nodes', () => {
	const roundTrip = (engine: { reviver: (key: string, value: unknown) => unknown }, node: unknown): unknown => {
		const revived = JSON.parse(JSON.stringify(node), engine.reviver) as object;
		expect(sourceOf(revived)).toBe(Source.Factory);
		return revived;
	};

	it('round-trips a node to JSON-equal JSON, and the revived node is a built node', () => {
		const source = rs.parse('fn f(a: u8) -> u8 { a }\n').statements()[0]!;
		const revived = roundTrip(rs, source) as object;
		expect(JSON.stringify(revived)).toBe(JSON.stringify(source));
		expect(sourceOf(revived)).toBe(Source.Factory);
	});

	it('renders a revived node under the engine', () => {
		const revived = roundTrip(rs, rs.parse('fn  f()  {}\n').statements()[0]!);
		expect(String(revived)).toBe('fn f() {}');
	});

	it('names the path of an unknown kind and of an unknown slot, at the root and deep', () => {
		expect(() => JSON.parse('{"$type":"foo"}', rs.reviver)).toThrow("$: unknown kind 'foo'");
		expect(() => JSON.parse('{"$type":"function_item","nmae":{"$type":"identifier","$text":"f"}}', rs.reviver)).toThrow(
			"$: function_item has no slot 'nmae'"
		);
		const deep = '{"$type":"function_item","name":{"$type":"identifier","$text":"f"},"parameters":{"$type":"parameters"},"body":{"$type":"block","statements":[{"$type":"foo"}]}}';
		expect(() => JSON.parse(deep, rs.reviver)).toThrow("$.body.statements[0]: unknown kind 'foo'");
	});

	it('revives a node inside a larger document and leaves the other fields as they are', () => {
		const ast = rs.parse('fn f() {}\n').statements()[0]!;
		const doc = JSON.parse(JSON.stringify({ file: 'a.rs', lines: [1, 2], ast }), rs.reviver) as { file: string; lines: number[]; ast: object };
		expect(doc.file).toBe('a.rs');
		expect(doc.lines).toEqual([1, 2]);
		expect(String(doc.ast)).toBe('fn f() {}');
	});

	it('refuses JSON missing a required slot at parse when structure is verified, and at render otherwise', async () => {
		const verifying = await createEngine(await languageByName('rust'), { verifyStructure: 'runtime' });
		const missing = '{"$type":"function_item","parameters":{"$type":"parameters"},"body":{"$type":"block"}}';
		expect(() => JSON.parse(missing, verifying.reviver)).toThrow();
		const parsed = JSON.parse(missing, rs.reviver) as object;
		expect(() => String(parsed)).toThrow();
	});

	it('refuses an ERROR, naming its path', () => {
		const item = rs.parse('fn f() {} @@ fn g() {}').statements()[0]!;
		expect(() => roundTrip(rs, item)).toThrow('$.trailingComments[0]: an ERROR node cannot be built');
	});

	it('revives comments onto their side', () => {
		const revived = roundTrip(rs, rs.parse('// x\nfn f() {}\n').statements()[0]!);
		expect(String(revived)).toContain('// x');
		expect(JSON.parse(JSON.stringify(revived)).leadingComments).toHaveLength(1);
	});

	it('revives by what the kind is, not by which keys the object has', () => {
		const block = JSON.parse('{"$type":"block"}', rs.reviver) as { statements(): unknown };
		expect([...(block.statements() as Iterable<unknown>)]).toEqual([]);
		expect(JSON.parse('{"$type":"mutable_specifier"}', rs.reviver)).toBe(rs.kinds.MutableSpecifier);
	});

	it('is bound to its engine', () => {
		const { reviver } = rs;
		const text = JSON.stringify(rs.parse('fn f() {}\n').statements()[0]!);
		const unbound = JSON.parse(text, reviver) as object;
		expect(sourceOf(unbound)).toBe(Source.Factory);
		expect(JSON.stringify(unbound)).toBe(JSON.stringify(JSON.parse(text, rs.reviver)));
	});

	it('revives a string slot as the same string', () => {
		const escape = find(json(roundTrip(scm, scm.parse('((x) @a (#eq? @a "b\\n"))\n'))), 'escape_sequence');
		expect(escape?.content).toBe('n');
	});

	it('revives a word reserved only for identifiers through its envelope', () => {
		for (const [source, word] of [['x.default;\n', 'default'], ['({ class: 1 });\n', 'class'], ['class A { delete() {} }\n', 'delete']] as const) {
			const parsed = ts.parse(source);
			expect(JSON.stringify(roundTrip(ts, parsed))).toBe(JSON.stringify(parsed));
			expect(String(roundTrip(ts, parsed))).toContain(word);
		}
	});

	it('revives a list hole as a hole', () => {
		const array = ts.parse('[a, , b];\n');
		expect(JSON.stringify(roundTrip(ts, array))).toBe(JSON.stringify(array));
		expect(String(roundTrip(ts, array))).toMatch(/a, ?, b/);
	});

	it('round-trips each form a kind built from text takes, with a leading comment kept out of its text', () => {
		for (const [engine, source, kind] of [
			[rs, '// c\nconst A: T = 0x1F_u8;\n', 'integer_literal_hex'],
			[rs, "// c\nconst A: char = 'q';\n", 'char_literal_plain'],
			[rs, '// c\nconst A: T = b;\n', 'type_identifier'],
			[rs, '// c\nconst A: T = b;\n', 'identifier'],
			[scm, '; c\n((x) @a (#eq? @a "b\\n"))\n', 'escape_sequence'],
			[ts, '// c\nlet a: T;\n', 'type_identifier']
		] as const) {
			const root = (engine as typeof rs).parse(source);
			const written = json(root);
			expect(find(written, kind), `${kind} in ${source}`).toBeDefined();
			expect(JSON.stringify(roundTrip(engine as typeof rs, root))).toBe(JSON.stringify(root));
			expect(JSON.stringify(find(written, kind))).not.toContain('// c');
		}
	});
});
