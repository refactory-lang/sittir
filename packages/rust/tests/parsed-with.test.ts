import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { useRecordConstruction } from '@sittir/common/engine';
import rust from '../src/index.ts';

type Node = Record<string, unknown> & {
	readonly $type: number;
	readonly $with: Record<string, (...values: unknown[]) => Node>;
	$render(): string;
};

const object = await createEngine(rust, { nodeStorage: 'object' });
const arenaObjects = await createEngine(rust, { nodeStorage: 'arena' });
const arenaRecords = await createEngine(rust, { nodeStorage: 'arena' });
type Engine = typeof object;
useRecordConstruction(arenaRecords, await import('../src/factories/records.ts'));

const constructions: readonly (readonly [string, Engine])[] = [
	['object construction', arenaObjects],
	['record construction', arenaRecords]
];

function slot(node: Node, key: string): unknown {
	return (node[key] as () => unknown).call(node);
}

function nth(node: Node, key: string, index: number): Node {
	return (slot(node, key) as Node[])[index]!;
}

function rebuiltThrough(node: Node, key: string): Node {
	const value = slot(node, key);
	const setter = node.$with[key]!;
	return Array.isArray(value) && setter.length === 0 ? setter(...value) : setter(value);
}

function call(engine: Engine, name: string): unknown {
	const b = engine.build;
	return b.expressionStatement(b.callExpression({ function: b.identifier(name), arguments: b.arguments() }));
}

function root(engine: Engine, source: string): Node {
	return engine.parse(source) as unknown as Node;
}

function body(engine: Engine, source: string): Node {
	return slot(nth(root(engine, source), 'statements', 0), 'body') as Node;
}

const cases: readonly (readonly [string, (engine: Engine) => Node, string])[] = [
	[
		'a kept statement beside a built one',
		(engine) => {
			const block = body(engine, 'fn f() {\n    s1(); // a\n    // b\n    s2();\n}\n');
			return block.$with.statements!(nth(block, 'statements', 0), call(engine, 's3'));
		},
		'{\n    s1(); // a\n    s3();\n}'
	],
	[
		'the root, a kept item beside an edited one across an ERROR',
		(engine) => {
			const file = root(engine, 'fn f() {}\n@\nfn g() {}\n');
			const edited = nth(file, 'statements', 1).$with.name!(engine.build.identifier('h'));
			return file.$with.statements!(nth(file, 'statements', 0), edited);
		},
		'fn f() {}\n@\nfn h() {}\n'
	],
	[
		'every kept statement and a built one',
		(engine) => {
			const block = body(engine, 'fn f() {\n    a();\n}\n');
			return block.$with.statements!(...(slot(block, 'statements') as unknown[]), call(engine, 'b'));
		},
		'{\n    a();\n    b();\n}'
	],
	['an empty block, which keeps its inner layout', (engine) => rebuiltThrough(body(engine, 'fn f() {\n}\n'), 'statements'), '{\n}'],
	['a list, which keeps its own spacing', (engine) => rebuiltThrough(slot(nth(root(engine, 'fn f(a: u8,b: u8) {}\n'), 'statements', 0), 'parameters') as Node, 'elements'), '(a: u8,b: u8)'],
	['a padded statement, rendered without its padding as a render root', (engine) => rebuiltThrough(nth(body(engine, 'fn f() { a(); }\n'), 'statements', 0), 'content'), 'a();'],
	['a block indented by two, which keeps its source indent', (engine) => rebuiltThrough(body(engine, 'fn f() {\n  if x {\n    a();\n  }\n}\n'), 'statements'), '{\n  if x {\n    a();\n  }\n}']
];

describe('a parsed node rebuilt through $with renders as it does under object storage', () => {
	for (const [name, rebuild, expected] of cases) {
		it(`${name}: object storage`, () => {
			expect(rebuild(object).$render()).toBe(expected);
		});
		for (const [construction, engine] of constructions) {
			it(`${name}: arena storage, ${construction}`, () => {
				expect(rebuild(engine).$render()).toBe(expected);
			});
		}
	}
});
