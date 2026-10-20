import { describe, expect, it } from 'vitest';
import { isCoordinate, sideOf } from '@sittir/common/utils';
import {
	buildFactoryNodeFromReference,
	buildReadHandle,
	hydrateOf,
	loadSlotReaders,
	loadIrSurface,
	loadNativeEngine,
	loadNodeModel,
	loadScopedFactoryMap,
	readNodeOf,
	type ReadNodeLike
} from '../common.ts';
import { importGrammarModule } from '../../grammar-internals.ts';

/** Comments on their own lines: at a file's edges, between statements and in a childless node, laid out by the layout runs their sides carry. */
const OWN_LINE: Record<string, readonly string[]> = {
	rust: ['// a\nfn f() {}\n// b\n', 'fn f() {\n    s1();\n    // y\n    s2();\n}\n', 'fn f() {\n    // c\n}\n'],
	typescript: ['// a\nf();\n// b\n', 'f();\n// y\ng();\n', 'function f() {\n  // c\n}\n'],
	python: ['# a\nf()\n# b\n', 'f()\n# y\ng()\n', 'if a:\n    b\n    # c\nd\n']
};

/** Comments on their owner's line, and either side of a separator. A side stores no in-line run, so a copy's in-line spacing is the render's: these are compared in order, whitespace aside. */
const SAME_LINE: Record<string, readonly string[]> = {
	rust: ['fn f() {\n    s1(); // x\n    // y\n    s2();\n}\n', 'fn f() {\n    g(a /* x */, /* y */ b);\n}\n'],
	typescript: ['f(); // x\n// y\ng();\n', 'f(a /* x */, /* y */ b);\n'],
	python: ['f()  # x\n# y\ng()\n', 'f(a,  # x\n  b)\n']
};

/** Comments the storage lanes carried only as copied data: at a python block's end, in a rust token tree and in a block's first line, after a typescript signature, and a python line continuation. */
const COPIED: Record<string, readonly string[]> = {
	python: [
		'if a:\n  b\n  # one\n  # two\n\nif c:\n  d\n    # three\n      # four\n\ndef a():\n    if b:\n        b # comment\n    b # comment\n\n# five\n',
		'len("a") \\\nor len("aa")\n'
	],
	rust: ['ok! {\n  // one\n  /* two */\n}\n', "impl Foo {\n  const default fn bar() -> i32 {\n    // Make 'default' still works as an identifier\n    default.bar();\n  }\n}\n"],
	typescript: ['function foo()\n  // above is a signature\nfoo();\n\nfunction bar()\n  // above is a function declaration\n{}\n\nfunction foo()\n  : number;\n']
};

const tokens = (text: string): string => text.replace(/\s+/g, '');

async function lane(grammar: string) {
	const raw = await importGrammarModule(grammar, 'factories/raw.ts');
	const model = await loadNodeModel(grammar);
	const artifacts = {
		factoryMap: await loadScopedFactoryMap(grammar, raw?._factoryMap ?? {}),
		factoryShapes: model.factoryShapes,
		fieldAliasMap: model.fieldAliasMap,
		factoryFields: model.factoryFields,
		factorySlots: model.factorySlots,
		surface: await loadIrSurface(grammar)
	};
	const kindNames = (await importGrammarModule(grammar, 'types.ts'))?.KIND_NAMES;
	const kindNameFromId = (id: number): string | undefined => kindNames?.get(id);
	const readNode = await readNodeOf(grammar);
	const hydrate = (await hydrateOf(grammar)) ?? undefined;
	const readers = await loadSlotReaders(grammar);
	const engine = await loadNativeEngine(grammar);
	const read = async (source: string): Promise<ReadNodeLike> => readNode?.(await buildReadHandle(grammar, source)) as ReadNodeLike;
	return {
		read,
		async render(source: string): Promise<string> {
			const tree = await buildReadHandle(grammar, source);
			const root = readNode?.(tree) as ReadNodeLike;
			const built = buildFactoryNodeFromReference(root, kindNameFromId(Number(root.$type)) ?? '', artifacts, { kindNameFromId, readers, tree, hydrate });
			return engine.render(built as never).toString();
		}
	};
}

describe('the ir lane spells comments from the trivia table', () => {
	it("reads a source node's side from its tree's table", async () => {
		const { read } = await lane('rust');
		const root = await read('// a\nfn f() {}\n');
		const [statement] = (root as unknown as { _statements: ReadNodeLike[] })._statements;
		if (statement === undefined) throw new Error('expected a statement');
		const leading = sideOf(statement, 'leading').filter(isCoordinate);
		expect(leading.map((entry) => entry.$span)).toEqual([{ start: 0, end: 4 }]);
	});

	for (const [grammar, sources] of Object.entries(OWN_LINE)) {
		it(`${grammar}: a built tree renders each own-line comment back to the source`, async () => {
			const { render } = await lane(grammar);
			for (const source of sources) expect(await render(source), source).toBe(source);
		});
	}

	for (const [grammar, sources] of Object.entries(COPIED)) {
		it(`${grammar}: a built tree keeps the comments a copy used to carry`, async () => {
			const { render } = await lane(grammar);
			for (const source of sources) expect(tokens(await render(source)), source).toBe(tokens(source));
		});
	}

	for (const [grammar, sources] of Object.entries(SAME_LINE)) {
		it(`${grammar}: a built tree keeps each comment on its side of its owner and separator`, async () => {
			const { render } = await lane(grammar);
			for (const source of sources) expect(tokens(await render(source)), source).toBe(tokens(source));
		});
	}
});
