import { afterAll, describe, expect, it } from 'vitest';
import { createEngine, snapshotOf } from '@sittir/common';
import { ERROR_KIND_ID } from '@sittir/common/error-kind';
import { recordOf, storedSlotValues } from '@sittir/common/utils';
import python from '../../python/src/index.ts';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';
import { languageByName } from '../src/languages.ts';
import { nativeBackendOf } from '../src/validate/layout-runs.ts';
import { disposeNativeEngines, loadCorpusEntries } from '../src/validate/common.ts';

afterAll(disposeNativeEngines);

const WHOLE = { depth: Infinity };
const STORAGES = ['object', 'arena'] as const;

interface Queried {
	readonly $type: number;
	$query?(): { readonly $descendants: Iterable<Queried> };
}

const descendantsOf = (root: object): Queried[] => [...(root as Queried).$query!().$descendants];

const kindIn = (root: object, kind: number): Queried => {
	const found = descendantsOf(root).find((node) => node.$type === kind);
	if (found === undefined) throw new Error(`no node of kind ${kind}`);
	return found;
};

describe('a parsed snapshot takes no tree', () => {
	it.each(['rust', 'typescript', 'python'])('%s: in arena storage, every fixture node snapshots and every record view answers $query() with no tree live', async (grammar) => {
		using engine = await createEngine(await languageByName(grammar), { nodeStorage: 'arena' });
		const native = await nativeBackendOf(grammar);
		const live = native.liveTreeCount();
		let viewed = 0;
		for (const { name, source } of loadCorpusEntries(grammar)) {
			const root = engine.parse(source, WHOLE) as object;
			const nodes = [root as Queried, ...descendantsOf(root)];
			for (const node of nodes) snapshotOf(node);
			const views = nodes.filter((node) => recordOf(node) !== undefined);
			for (const view of views) view.$query?.();
			viewed += views.length;
			expect(native.liveTreeCount(), name).toBe(live);
		}
		expect(viewed).toBeGreaterThan(0);
	}, 120_000);
});

describe('an alias content snapshots as itself', () => {
	it.each(STORAGES)('%s: a type identifier content keeps its own kind and text, though it shares its envelope row', async (nodeStorage) => {
		using ts = await createEngine(typescript, { nodeStorage });
		const root = ts.parse('class A {}\n', WHOLE);
		const envelope = kindIn(root, ts.kinds.TypeIdentifier);
		const [, content] = storedSlotValues(envelope).find(([key]) => key === '_content')!;
		expect(snapshotOf(content as object)).toEqual({ $type: ts.kinds.Identifier, $_layout: { span: { start: { row: 0, column: 0 }, end: { row: 0, column: 1 } } }, $text: 'A' });
	});
});

describe('a spelled slot snapshots as its member', () => {
	it.each(STORAGES)('%s: a python UR prefix snapshots as ur, while the parsed node keeps UR', async (nodeStorage) => {
		using py = await createEngine(python, { nodeStorage });
		const parsed = py.parse('UR"a"\n', WHOLE);
		const snapshot = snapshotOf(kindIn(parsed, py.kinds.StringStart)) as { readonly _prefix?: unknown };
		expect(snapshot._prefix).toBe('ur');
		expect(py.render(parsed).toString()).toBe('UR"a"\n');
		expect(py.render(snapshotOf(parsed)).toString()).toBe('ur"a"\n');
	});
});

const point = (row: number, column: number) => ({ row, column });
const span = (start: [number, number], end: [number, number]) => ({ start: point(...start), end: point(...end) });

describe('a snapshot of an ERROR side or a MISSING token', () => {
	it.each(STORAGES)('%s: an ERROR in a leading side is its text with its span and its gap', async (nodeStorage) => {
		using ts = await createEngine(typescript, { nodeStorage });
		const root = ts.parse('let a = b + ;\nf(x) // c\n', WHOLE);
		expect(snapshotOf(kindIn(root, ts.kinds.CallExpressionCall))).toEqual({
			$type: ts.kinds.CallExpressionCall,
			$_layout: { trivia: { leading: [{ $type: ERROR_KIND_ID, $text: ';', span: span([0, 0], [0, 1]), $before: ' ' }, ts.kinds.Newline] }, span: span([1, 0], [1, 4]), flanks: 257 },
			_function: { $type: ts.kinds.Identifier, $_layout: { span: span([0, 0], [0, 1]) }, $text: 'f' },
			_arguments: { $type: ts.kinds.Arguments, $_layout: { span: span([0, 1], [0, 4]) }, _elements: [{ $type: ts.kinds.Identifier, $_layout: { span: span([0, 1], [0, 2]) }, $text: 'x' }] }
		});
	});
	it.each(STORAGES)('%s: an ERROR filling a root is its inner side', async (nodeStorage) => {
		using py = await createEngine(python, { nodeStorage });
		const root = py.parse('print(a\n', WHOLE);
		expect(snapshotOf(root)).toEqual({
			$type: py.kinds.Module,
			$_layout: { trivia: { inner: [{ $type: ERROR_KIND_ID, $text: 'print(a', span: span([0, 0], [0, 7]) }] }, span: span([0, 0], [1, 0]), flanks: 2049 },
			_statements: []
		});
	});
	it.each(STORAGES)('%s: a missing closing parenthesis takes no span of its own', async (nodeStorage) => {
		using ts = await createEngine(typescript, { nodeStorage });
		const root = ts.parse('let a = (1;\n', WHOLE);
		expect(snapshotOf(kindIn(root, ts.kinds.ParenthesizedExpressionTyped))).toEqual({
			$type: ts.kinds.ParenthesizedExpressionTyped,
			$_layout: { span: span([0, 0], [0, 2]), flanks: 257 },
			_expression: { $type: ts.kinds.NumberDecimal, $_layout: { span: span([0, 1], [0, 2]) }, $text: '1' }
		});
	});
	it.each(STORAGES)('%s: a missing semicolon leaves the statement its own span', async (nodeStorage) => {
		using rs = await createEngine(rust, { nodeStorage });
		const root = rs.parse('fn f() { let x = 1 }\n', WHOLE);
		expect(snapshotOf(kindIn(root, rs.kinds.LetDeclaration))).toEqual({
			$type: rs.kinds.LetDeclaration,
			$_layout: { span: span([0, 0], [0, 9]), flanks: 257 },
			_mutable: false,
			_name: { $type: rs.kinds.Identifier, $_layout: { span: span([0, 4], [0, 5]) }, $text: 'x' },
			_value: { $type: rs.kinds.IntegerLiteralDecimal, $_layout: { span: span([0, 8], [0, 9]) }, _content: '1' }
		});
	});
});

const RENDERS_AS_READ = {
	python: [
		"f(\n    $\n)\n",
		"x = [\n    $\n]\n",
		"x = [1 \\\n \\\n]\n",
		"x = [1 \\\n    \\\n]\n",
		"x = [1 $ \\\n]\n",
		"x = [1, $ \\\n]\n",
		"f(a $ \\\n)\n",
		"x = (1 $ \\\n)\n",
		"x = [1\n    # c\n]\n",
		"f(a\n    # c\n)\n",
		"x = {1: 2\n    # c\n}\n",
		"def f(a\n    # c\n):\n    pass\n",
		"x = [\n    1\n        # c\n    ]\n",
		"x = (1, 2\n    # c\n)\n",
		"x = [1 \\\n    # c\n]\n",
		"x = [1 \\\n    $ ]\n",
		"f(a \\\n    # c\n)\n",
		"f(a \\\n    $\n)\n"
	],
	rust: [
		"fn f() {\n\n    $\n}\n",
		"fn f() {\n    let a = 1; $ let b = 2;\n}\n",
		"fn f() {\n    let a = 1; \\ let b = 2;\n}\n",
		"fn f() {\n    let a = 1; $ }\n",
		"fn f() {\n    let a = 1;\n    $ }\n",
		"fn f() { $ }\n",
		"struct S { $ }\n",
		"fn f() {\n    match x {\n        1 => 2, $ _ => 3,\n    }\n}\n",
		"fn f() {\n    let x = [\n        1,\n        2, $ 3,\n        4,\n    ];\n}\n",
		"fn f() {\n    let p = P { a: 1\n        /* c */ };\n}\n",
		"fn f() {\n    let p = P { a: 1\n        $ };\n}\n",
		"fn f() {\n    let p = P { a: 1\n        /* c */\n    };\n}\n",
		"fn f() {\n    let p = P { a: 1\n        $\n    };\n}\n"
	],
	typescript: [
		"function f() {\n  let a = 1; # let b = 2;\n}\n",
		"function f() {\n  let a = 1;\n  # }\n",
		"class C {\n  a = 1; # b = 2;\n}\n",
		"class C { # }\n",
		"type T = {\n  a: 1;\n  b: 2; # c: 3;\n  d: 4;\n};\n",
		"type T = { a: 1\n  /* c */ };\n",
		"function f(a\n  /* c */ ) {}\n",
		"enum E {\n  A\n  # }\n",
		"interface I {\n  a: 1\n  \\ }\n",
		"import { a\n  /* c */ } from 'm';\n",
		"type T = { a: 1\n  // c\n};\n",
		"enum E {\n  A\n  #\n}\n",
		"import { a\n  /* c */\n} from 'm';\n"
	]
} as const;

describe('a snapshot renders as it reads', () => {
	it.each(STORAGES.flatMap((nodeStorage) => (['python', 'rust', 'typescript'] as const).map((grammar) => [grammar, nodeStorage] as const)))(
		'%s, %s: a source with an ERROR, a comment or a line continuation beside a list edge',
		async (grammar, nodeStorage) => {
			using engine = await createEngine(await languageByName(grammar), { nodeStorage });
			const sources = RENDERS_AS_READ[grammar];
			expect(sources.map((source) => engine.render(snapshotOf(engine.parse(source, WHOLE) as object)).toString())).toEqual(sources);
		}
	);
});
