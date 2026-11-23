import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import { allGrammars, grammarPackage } from '@sittir/codegen/grammars';
import { compileGrammar } from '../../codegen/src/compiler/compile.ts';
import { displayNameOf } from '../../codegen/src/compiler/model/display-name.ts';
import { ParseOracle } from '../../codegen/src/compiler/model/join-seams/oracle.ts';
import { spaceRenderRules } from '../../codegen/src/compiler/model/render-rules.ts';
import { collectKindEntries } from '../../codegen/src/emitters/kind-discriminant.ts';
import type { ParsedTree } from '../../codegen/src/engine-loader.ts';
import { languageByName } from '../src/languages.ts';
import { loadCorpusEntries } from '../src/validate/common.ts';

type TreeNode = ParsedTree['root'];

interface StampedList {
	readonly name: string;
	readonly slot: string;
	readonly parents: ReadonlySet<string>;
	readonly items: ReadonlySet<string>;
}

const SAMPLES: Readonly<Record<string, readonly string[]>> = {
	python: ['x = f"a{b}c{{d}}\\n{e:>3{f}g}{h}{i}"\n', "y = '\\n\\t{a}b'\nz = f''\nw = ''\nv = f'{a:{b}{c}}'\n", 'u = f"""a{b}\n{c}"""\n'],
	rust: ['fn f() { let a = "a\\nb\\tc"; let b = ""; let c = "\\n\\t"; }\n'],
	typescript: ['a = `x${b}\\ny${c}${d}`;\nb = ``;\nc = "a\\nb\\t";\nd = \'a\\nb\\t\';\ne = "";\nf = \'\';\ntype T = `a${B}c${D}${E}`;\ntype U = ``;\n'],
	regex: ['[\\cA\\cBx]', '[a-z\\d]', '[abc]', 'x[\\d\\w-]y', '[^ab]'],
	scm: ['"a\\nb\\tc"\n', '""\n', '((a) @b (#eq? @b "x\\ny"))\n'],
	go: ['package p\nvar a = "a\\nb\\tc"\nvar b = ""\nvar c = "\\n\\t"\n'],
	java: ['class A { String a = "a\\nb\\{c}d\\{e}\\{f}"; String b = ""; String c = "\\n\\t"; String d = """\n  a\\nb\\{c}d\n  """; String e = """\n  """; }\n'],
	c: ['char *a = "a\\nb\\tc";\nchar *b = "";\nchar c = \'\\n\';\nint d = \'ab\';\nint e = \'\\n\\t\';\n'],
	csharp: ['class A { string a = $"x{b}\\ny{c}{d}"; string e = $@"x{b}y{c}{d}"; string f = $"""x{b}y{c}{d}"""; string g = "a\\nb\\t"; string h = ""; string i = $""; string j = $@""; }\n']
};

const TRIVIA_AT_MARK: Readonly<Record<string, readonly string[]>> = {
	python: ['f(§a, b)\n', 'x = [§a, b]\n', 'x = f"{§a}"\n'],
	rust: ['fn f() { g(§a, b); }\n', 'fn f() { let x = [§a, b]; }\n'],
	typescript: ['f(§a, b);\n', 'x = [§a, b];\n', 'x = `${§a}`;\n'],
	scm: ['(§a)\n', '(a §(b))\n'],
	go: ['package p\nvar x = f(§a, b)\n'],
	java: ['class A { int x = f(§a, b); }\n', 'class A { String x = "\\{§a}"; }\n'],
	c: ['int x = f(§a, b);\n'],
	csharp: ['class A { int x = f(§a, b); }\n', 'class A { string x = $"{§a}"; }\n']
};

const REBUILT: Readonly<Record<string, readonly (readonly [source: string, value: string])[]>> = {
	python: [
		['x = f"a {{{b}"\n', 'f"a {{{b}"'],
		['x = f"a {{{b}}}"\n', 'f"a {{{b}}}"'],
		['x = ""\n', '""']
	],
	go: [['package p\nvar a = ""\n', '""']],
	java: [['class A { String a = ""; }\n', '""']]
};

const BUILT: Readonly<Record<string, readonly (readonly [input: unknown, value: string])[]>> = {
	go: [[{ $path: 'literal.string', elements: [] }, '""']]
};

const MAX_PER_PAIR = 3;

const childrenOf = (node: TreeNode): TreeNode[] => node.children.filter((child) => child !== null);

const walk = (node: TreeNode, visit: (node: TreeNode) => void): void => {
	visit(node);
	for (const child of childrenOf(node)) walk(child, visit);
};

const spaceIsTrivia = (oracle: ParseOracle, text: string, at: number, hadError: boolean): boolean => {
	using tree = oracle.parse(`${text.slice(0, at)} ${text.slice(at)}`);
	if (tree.root.hasError && !hadError) return false;
	let held = false;
	walk(tree.root, (node) => {
		if (node === tree.root || node.endIndex <= node.startIndex) return;
		if (node.startIndex === at || node.endIndex === at + 1 || (node.childCount === 0 && node.startIndex <= at && node.endIndex > at)) held = true;
	});
	return !held;
};

const stampedLists = (compiled: Awaited<ReturnType<typeof compileGrammar>>): StampedList[] => {
	const { nodeMap, generatedIdTables } = compiled;
	const stamped = spaceRenderRules({ nodeMap, kindEntries: collectKindEntries(nodeMap, generatedIdTables) }).noExtrasLists ?? new Set();
	return [...nodeMap.nodes].flatMap(([kind, node]) =>
		('slots' in node ? node.slots : [])
			.filter((slot) => slot.sourceRuleIds.some((id) => stamped.has(id)))
			.map((slot) => ({
				name: `${kind}.${slot.name}`,
				slot: slot.name,
				parents: new Set([kind, displayNameOf(kind, nodeMap)]),
				items: new Set(slot.values.flatMap(({ node: item }) => (item === undefined ? [] : [item.kind, displayNameOf(item.kind, nodeMap)])))
			}))
	);
};

const itemsOf = (list: StampedList, node: TreeNode): TreeNode[] => {
	const fielded = node.childrenForFieldName(list.slot).filter((child) => child !== null);
	const typed = childrenOf(node).filter((child) => list.items.has(child.type));
	const unique = new Map([...fielded, ...typed].map((child) => [`${child.startIndex}:${child.endIndex}`, child]));
	return [...unique.values()].sort((a, b) => a.startIndex - b.startIndex);
};

const boundariesOf = (list: StampedList, node: TreeNode): readonly (readonly [where: string, left: TreeNode, right: TreeNode])[] => {
	const kids = childrenOf(node);
	const items = itemsOf(list, node);
	if (items.length === 0) return kids.slice(1).map((right, i) => ['empty', kids[i]!, right] as const);
	const indexOf = (item: TreeNode): number => kids.findIndex((kid) => kid.startIndex === item.startIndex && kid.endIndex === item.endIndex);
	const before = kids[indexOf(items[0]!) - 1];
	const after = kids[indexOf(items.at(-1)!) + 1];
	return [
		...items.slice(1).map((right, i) => ['between', items[i]!, right] as const),
		...(before === undefined ? [] : [['before', before, items[0]!] as const]),
		...(after === undefined ? [] : [['after', items.at(-1)!, after] as const])
	];
};

const failuresIn = (grammar: string, lists: readonly StampedList[], sources: readonly string[], oracle: ParseOracle): string[] => {
	const failures: string[] = [];
	const instances = new Map<StampedList, number>();
	const tried = new Map<string, number>();
	const check = (list: StampedList, node: TreeNode, text: string, hadError: boolean): void => {
		instances.set(list, (instances.get(list) ?? 0) + 1);
		for (const [where, left, right] of boundariesOf(list, node)) {
			const pair = `${grammar} ${list.name} ${where} ${left.type}|${right.type}`;
			if (left.endIndex !== right.startIndex) {
				if (/^\s+$/u.test(text.slice(left.endIndex, right.startIndex))) failures.push(`${pair}: the source holds whitespace here: ${JSON.stringify(node.text.slice(0, 60))}`);
				continue;
			}
			const count = tried.get(pair) ?? 0;
			if (count >= MAX_PER_PAIR) continue;
			tried.set(pair, count + 1);
			if (spaceIsTrivia(oracle, text, left.endIndex, hadError)) failures.push(`${pair}: a space here is trivia: ${JSON.stringify(node.text.slice(0, 60))}`);
		}
	};
	for (const text of sources) {
		using tree = oracle.parse(text);
		const hadError = tree.root.hasError;
		walk(tree.root, (node) => {
			if (node.hasError) return;
			for (const list of lists) if (list.parents.has(node.type)) check(list, node, text, hadError);
		});
	}
	for (const list of lists) if (!instances.has(list)) failures.push(`${grammar} ${list.name}: no instance in the corpus or samples`);
	return failures;
};

describe.each(allGrammars())('the lists %s stamps as admitting no extras', (grammar) => {
	it('hold content at every item boundary seen in the corpus and samples', async () => {
		const compiled = await compileGrammar({ package: grammarPackage(grammar) });
		if (compiled.generatedIdTables.parser === null) throw new Error(`${grammar} has no built parser`);
		using oracle = new ParseOracle(compiled.generatedIdTables.parser.language);
		for (const marked of TRIVIA_AT_MARK[grammar] ?? []) {
			const text = marked.replace('§', '');
			using tree = oracle.parse(text);
			expect(spaceIsTrivia(oracle, text, marked.indexOf('§'), tree.root.hasError), `${grammar} control ${JSON.stringify(marked)}`).toBe(true);
		}
		const sources = [...(SAMPLES[grammar] ?? []), ...loadCorpusEntries(grammar).map((entry) => entry.source)];
		expect(failuresIn(grammar, stampedLists(compiled), sources, oracle)).toEqual([]);
	}, 300_000);
});

describe.each(allGrammars().filter((grammar) => grammar in REBUILT || grammar in BUILT))('a string beside a list that admits no extras in %s', (grammar) => {
	describe.each(['object', 'arena'] as const)('on %s storage', async (nodeStorage) => {
		const engine = await sharedEngine(async () => createEngine(await languageByName(grammar), { api: 'strict', nodeStorage }));
		const runtime = await portableRuntime(engine);
		const rendered = (input: unknown): string => String(engine.render(runtime.build(input as never) as never));

		it.each(REBUILT[grammar] ?? [])('keeps the value of %j through a read and build', (source, value) => {
			expect(rendered(runtime.read(engine.parse(source)))).toContain(value);
		});

		it.each(BUILT[grammar] ?? [])('builds %j with nothing added', (input, value) => {
			expect(rendered(input)).toContain(value);
		});
	});
});
