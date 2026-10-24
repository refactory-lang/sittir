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
const rx = await createEngine(await languageByName('regex'));

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

	it('writes a kind aliased under a display name as its model kind, and revives it at the alias site', () => {
		for (const [engine, source, kind] of [
			[rs, 'fn f() {\n    if let Some(x) = a && b {}\n}\n', '_let_chain'],
			[ts, 'a.b = 1;\nfor (a.b of c) {}\n', '_lhs_expression'],
			[py, 'x = 1\n', '_simple_statements'],
			[py, 'match x:\n    case 1:\n        pass\n', '_simple_pattern']
		] as const) {
			const root = (engine as typeof rs).parse(source);
			expect(find(json(root), kind), `${kind} in ${source}`).toBeDefined();
			const revived = roundTrip(engine as typeof rs, root);
			expect(JSON.stringify(revived)).toBe(JSON.stringify(root));
			expect(String(revived)).toBe(source);
		}
	});

	it('revives a token kind id among a list slot’s items as that token', () => {
		const root = rx.parse('[\\-a]');
		expect(find(json(root), 'character_class')?.classAtoms).toEqual([{ $type: 'bslash_dash' }, { $type: 'class_character', $text: 'a' }]);
		expect(String(roundTrip(rx, root))).toBe('[\\-a]');
	});

	it('refuses envelope content that is not the envelope’s content kind, naming its path', () => {
		expect(() => JSON.parse('{"$type":"property_identifier","content":{"$type":"ERROR","$text":"foo"}}', ts.reviver)).toThrow(
			'$.content: an ERROR node cannot be built'
		);
		expect(() => JSON.parse('{"$type":"property_identifier","content":{"$type":"bogus","$text":"foo"}}', ts.reviver)).toThrow("$.content: unknown kind 'bogus'");
		expect(() => JSON.parse('{"$type":"property_identifier","content":{"$type":"number","$text":"1"}}', ts.reviver)).toThrow('$.content');
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

describe('a parsed alias envelope and its content are one node, whose comments the envelope holds', () => {
	type Sided = { readonly $trivia: { leading(...items: unknown[]): readonly unknown[] } };
	type Member = { expression(): { property(): Sided & { content(): Sided } } };
	const property = () => (ts.parse('x./* c */normal;\n').statements()[0] as unknown as Member).expression().property();
	const comments = (text: string): number => (text.match(/\/\* c \*\//g) ?? []).length;

	it('writes and renders a comment at an envelope once, through three revivals', () => {
		for (const [engine, source] of [
			[ts, 'x./* c */normal;\n'],
			[ts, 'a./* c */b = 1;\n'],
			[ts, 'let a: /* c */ T;\n'],
			[rs, 'const A: /* c */ T = 0;\n'],
			[ts, 'interface I /* c */ { a: T }\n']
		] as const) {
			let node: unknown = (engine as typeof rs).parse(source);
			const written = JSON.stringify(node);
			let entries = 0;
			everyObject(JSON.parse(written), (object) => {
				for (const key of ['leadingComments', 'trailingComments', 'innerComments']) entries += ((object[key] as unknown[] | undefined) ?? []).length;
			});
			expect(entries, source).toBe(1);
			for (let cycle = 1; cycle <= 3; cycle++) {
				node = JSON.parse(JSON.stringify(node), (engine as typeof rs).reviver);
				expect(JSON.stringify(node), `${source} cycle ${cycle}`).toBe(written);
				expect(comments(String(node)), `${source} cycle ${cycle}`).toBe(1);
			}
		}
	});

	it('reads the comment on the envelope and none on its content', () => {
		const envelope = property();
		expect(envelope.$trivia.leading().filter((entry) => typeof entry !== 'number')).toHaveLength(1);
		expect(envelope.content().$trivia.leading()).toEqual([]);
	});

	it('revives a commented word reserved only for identifiers', () => {
		for (const [source, word] of [['x./* c */default;\n', 'default'], ['({ /* c */ class: 1 });\n', 'class'], ['class A { /* c */ delete() {} }\n', 'delete']] as const) {
			const parsed = ts.parse(source);
			const revived = JSON.parse(JSON.stringify(parsed), ts.reviver) as object;
			expect(JSON.stringify(revived)).toBe(JSON.stringify(parsed));
			expect(String(revived)).toContain(word);
			expect(comments(String(revived))).toBe(1);
		}
	});
});

describe('a comment written through $trivia reads back as the node a parsed comment is', () => {
	type Entry = { readonly $type: number; content(): unknown };
	type Sides = { readonly $trivia: Record<'leading' | 'trailing', (...items: unknown[]) => readonly unknown[]> };
	const comments = (entries: readonly unknown[]): Entry[] => entries.filter((entry): entry is Entry => typeof entry !== 'number');

	it.each(['leading', 'trailing'] as const)('%s: its text survives JSON and a revive, and it renders once', (side) => {
		const root = ts.parse('let a = 1;\nlet b = 2;\n');
		(root.statements()[0] as unknown as Sides).$trivia[side]('// c');
		const written = JSON.stringify(root);
		expect(written).toContain('" c"');
		const revived = JSON.parse(written, ts.reviver) as object;
		expect(JSON.stringify(revived)).toBe(written);
		expect(String(revived).split('// c')).toHaveLength(2);
	});

	it.each(['leading', 'trailing'] as const)('%s: a written entry has the content a read entry has', (side) => {
		const read = ts.parse(side === 'leading' ? '// c\nlet a = 1;\nlet b = 2;\n' : 'let a = 1; // c\nlet b = 2;\n').statements()[0] as unknown as Sides;
		const written = ts.parse('let a = 1;\nlet b = 2;\n').statements()[0] as unknown as Sides;
		written.$trivia[side]('// c');
		const [fromRead] = comments(read.$trivia[side]());
		const [fromWrite] = comments(written.$trivia[side]());
		expect(fromWrite?.$type).toBe(fromRead?.$type);
		expect(fromWrite?.content()).toEqual(fromRead?.content());
	});
});

describe('an empty node keeps its inner comment through JSON', () => {
	it.each(['function f(){/* c */}', 'if (a) {/* c */}'])('%s', (source) => {
		const root = ts.parse(source);
		const revived = JSON.parse(JSON.stringify(root), ts.reviver) as object;
		expect(JSON.stringify(revived)).toBe(JSON.stringify(root));
		expect(String(revived)).toContain('/* c */');
	});

	it.each([
		['a kind whose delimiters are a choice of tokens has no inner gap', 'type T = {/* c */};'],
		['an alias envelope has no gap of its own for its content’s inner side', 'interface I {/* c */}']
	])('known gap, %s: %s loses its comment', (_, source) => {
		expect(String(JSON.parse(JSON.stringify(ts.parse(source)), ts.reviver))).not.toContain('/* c */');
	});
});

describe('a comment on a token stored as its kind id survives JSON', () => {
	it.each(['let a = /* keep */true;', 'let a = true /* keep */;', 'function f() { /* keep */; }'])('%s', (source) => {
		const root = ts.parse(source);
		expect(String(root)).toContain('/* keep */');
		const revived = JSON.parse(JSON.stringify(root), ts.reviver) as object;
		expect(String(revived)).toContain('/* keep */');
		expect(JSON.stringify(revived)).toBe(JSON.stringify(root));
	});

	it('writes both sides on one unit, Babel-style', () => {
		const root = ts.parse('function f() { /* a */; /* b */; }');
		const block = find(json(root), 'statement_block') as { statements: Json[] };
		expect(block.statements[0]).toMatchObject({
			$type: 'empty_statement',
			leadingComments: [{ $type: 'comment_block' }],
			trailingComments: [{ $type: 'comment_block' }]
		});
		const revived = String(JSON.parse(JSON.stringify(root), ts.reviver));
		expect(revived).toContain('/* a */');
		expect(revived).toContain('/* b */');
	});

	it('keeps a list item’s comments on that item', () => {
		const root = ts.parse('function f() {\n  ;\n  /* k */\n  ;\n}\n');
		const block = find(json(root), 'statement_block') as { statements: Json[] };
		expect(block.statements[0]).not.toHaveProperty('leadingComments');
		expect(block.statements[1]).toHaveProperty('leadingComments');
		const revived = JSON.parse(JSON.stringify(root), ts.reviver) as object;
		expect(JSON.stringify(revived)).toBe(JSON.stringify(root));
		expect(String(revived)).toContain('/* k */');
	});

	it('keeps it on a revived node an edit rebuilds', () => {
		const revived = JSON.parse(JSON.stringify(ts.parse('let a = /* keep */true;')), ts.reviver) as { statements(): Iterable<unknown> };
		const [statement] = [...revived.statements()] as { declarators(): Iterable<{ $with: Record<string, (value: unknown) => object> }> }[];
		const [first] = [...statement!.declarators()];
		const rebuilt = first!.$with.name!(ts.build.identifier('b'));
		expect(String(rebuilt)).toContain('/* keep */');
		expect(String(JSON.parse(JSON.stringify(rebuilt), ts.reviver))).toContain('/* keep */');
	});

	it('realigns a revived list’s unit comments under an edit as a parsed list’s are', () => {
		const source = 'function f() {\n  ;\n  /* k */\n  ;\n}\n';
		type Fn = { body(): { statements(): Iterable<unknown>; $with: Record<string, (...items: unknown[]) => object> } };
		const prepended = (root: { statements(): Iterable<unknown> }): string => {
			const body = ([...root.statements()] as Fn[])[0]!.body();
			return String(body.$with.statements!(ts.kinds.EmptyStatement, ...body.statements()));
		};
		const tokens = (text: string): string => text.replace(/\s+/g, ' ').trim();
		const parsed = tokens(prepended(ts.parse(source)));
		expect(parsed).toBe('{ ; /* k */ ; ; }');
		expect(tokens(prepended(JSON.parse(JSON.stringify(ts.parse(source)), ts.reviver) as { statements(): Iterable<unknown> }))).toBe(parsed);
	});

	it.each(['fn f() { let a = /* keep */true; }', 'fn f() { let a = /* keep */false; }', 'fn f() { let a = true /* keep */; }'])(
		'keeps the comment of a flattened enum the read stores as a kind id: %s',
		(source) => {
			const root = rs.parse(source);
			const json = JSON.stringify(root);
			expect(json).toContain(' keep ');
			expect(String(JSON.parse(json, rs.reviver))).toContain('/* keep */');
		}
	);

	it('keeps a revived list wrapper’s unit comments when an edit rebuilds it in place', () => {
		const source = 'foo<T, /* keep */this>();';
		type Args = { types(): Iterable<unknown>; $with: Record<string, (...items: unknown[]) => object> };
		type Statement = { expression(): { typeArguments(): Args } };
		const reset = (root: { statements(): Iterable<unknown> }): string => {
			const args = ([...root.statements()] as Statement[])[0]!.expression().typeArguments();
			return String(args.$with.types!(...args.types())).replace(/\s+/g, '');
		};
		const parsed = reset(ts.parse(source));
		expect(parsed).toBe('<T,/*keep*/this>');
		expect(reset(JSON.parse(JSON.stringify(ts.parse(source)), ts.reviver) as { statements(): Iterable<unknown> })).toBe(parsed);
	});

	it('anchors a revived list’s unit comments on the statements an edit keeps', () => {
		const source = 'function f() {\n  a();\n  /* A */\n  ;\n  b();\n  /* B */\n  ;\n}\n';
		type Fn = { body(): { statements(): Iterable<unknown>; $with: Record<string, (...items: unknown[]) => object> } };
		const tail = (root: { statements(): Iterable<unknown> }): string => {
			const body = ([...root.statements()] as Fn[])[0]!.body();
			return String(body.$with.statements!(...[...body.statements()].slice(2))).replace(/\s+/g, ' ').trim();
		};
		const parsed = tail(ts.parse(source));
		expect(parsed).toContain('/* B */');
		expect(parsed).not.toContain('/* A */');
		expect(tail(JSON.parse(JSON.stringify(ts.parse(source)), ts.reviver) as { statements(): Iterable<unknown> })).toBe(parsed);
	});

	it('keeps it on a rebuilt node', () => {
		const declarators = (ts.parse('let a = /* keep */true;').statements()[0] as unknown as { declarators(): Iterable<{ $with: Record<string, (value: unknown) => object> }> }).declarators();
		const [first] = [...declarators];
		const rebuilt = first!.$with.name!(ts.build.identifier('b'));
		expect(String(rebuilt)).toContain('/* keep */');
		expect(String(JSON.parse(JSON.stringify(rebuilt), ts.reviver))).toContain('/* keep */');
	});
});

describe('a rebuilt node reads each side from where that side lives', () => {
	type Rebuildable = { readonly $trivia: Record<'leading' | 'trailing', (...items: unknown[]) => unknown>; readonly $with: Record<string, (value: unknown) => Rebuildable> };
	const comments = (text: string): number => (text.match(/\/\/ [lt]\b/g) ?? []).length;

	it.each([
		['trailing', 'leading'],
		['leading', 'trailing']
	] as const)('a %s side written before a rebuild and a %s side written after both survive JSON', (before, after) => {
		const statement = ts.parse('a;\nb;\n').statements()[0] as unknown as Rebuildable & { expression(): unknown };
		statement.$trivia[before](before === 'leading' ? '// l' : '// t');
		const rebuilt = statement.$with.expression!((ts.parse('c;\n').statements()[0] as unknown as { expression(): unknown }).expression());
		rebuilt.$trivia[after](after === 'leading' ? '// l' : '// t');
		const revived = JSON.parse(JSON.stringify(rebuilt), ts.reviver) as object;
		expect(JSON.stringify(revived)).toBe(JSON.stringify(rebuilt));
		expect(comments(String(revived))).toBe(2);
	});

	it('keeps a comment written on rebuilt alias content', () => {
		const content = (ts.parse('interface I {}').statements()[0] as unknown as { body(): { content(): Rebuildable & { members(): unknown } } }).body().content();
		const rebuilt = content.$with.members!(content.members());
		rebuilt.$trivia.leading('/* new */');
		expect(String(rebuilt)).toContain('/* new */');
		expect(String(JSON.parse(JSON.stringify(rebuilt), ts.reviver))).toContain('/* new */');
	});
});
