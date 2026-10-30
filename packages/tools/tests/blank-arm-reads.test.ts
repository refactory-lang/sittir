import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { PACKAGES_DIR } from '@sittir/codegen/grammars';
import type { QuerySlots } from '@sittir/types';
import { languageByName } from '../src/languages.ts';

interface ModelSlot {
	readonly name: string;
	readonly required: boolean;
	readonly registered?: boolean;
	readonly optionDefault?: unknown;
}

interface ModelNode {
	readonly typeName: string;
	readonly slots?: readonly ModelSlot[];
}

// A registered choice slot that may be left out has a blank arm: its default
// is an arm's kind id (a spelling slot's is text), and none is one of its arms.
function blankArmSlots(grammar: string): string[] {
	const model = JSON.parse(readFileSync(join(PACKAGES_DIR, grammar, 'src', 'node-model.json5'), 'utf-8')) as { readonly nodes: Record<string, ModelNode> };
	return Object.values(model.nodes)
		.flatMap((node) =>
			(node.slots ?? [])
				.filter((slot) => slot.registered === true && !slot.required && typeof slot.optionDefault === 'number')
				.map((slot) => `${node.typeName}.${slot.name}`)
		)
		.sort();
}

// A source whose parse holds a node of each blank-arm slot's kind that chose none.
const CHOSE_NONE: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	python: { 'ForInClause.trailing_comma': '[x for x in a, b]\n' },
	rust: { 'LastMatchArm.trailing_comma': 'fn f() { match x { a => 1, b => 2 } }\n' },
	typescript: {
		'AmbientDeclarationModule.terminator': 'declare module.x: T x',
		'ClassBodyMemberMethod.terminator': 'class C { m() {} n() {} }',
		'ClassDeclaration.terminator': 'class C {} x',
		'ClassStaticBlock.terminator': 'class C { static {} }',
		'DoStatement.terminator': 'do {} while (a) x',
		'ForHeaderLetConstKind.terminator': 'for (let x of y) {}',
		'FunctionDeclaration.terminator': 'function f() {} x',
		'GeneratorFunctionDeclaration.terminator': 'function* g() {} x',
		'StatementBlock.terminator': '{} x'
	}
};

type Json = Record<string, unknown>;
type Node = { readonly $type: number; toJSON(): Json } & Record<string, unknown>;
type Engine = {
	readonly kinds: Record<string, number>;
	readonly reviver: (key: string, value: unknown) => unknown;
	parse(source: string): { $query(): { readonly $descendants: { ofType(kind: number): Iterable<Node> } } };
};

const read = (node: Node, accessor: string): unknown => (node[accessor] as () => unknown).call(node);
const revive = (engine: Engine, json: Json): Node => JSON.parse(JSON.stringify(json), engine.reviver) as Node;

describe('the blank arm of an optional preference reads as null on every path', () => {
	it.each(Object.keys(CHOSE_NONE))('%s: every blank-arm slot has a source that chooses none', (grammar) => {
		expect(Object.keys(CHOSE_NONE[grammar]!).sort()).toEqual(blankArmSlots(grammar));
	});

	const cases = Object.entries(CHOSE_NONE).flatMap(([grammar, slots]) => Object.entries(slots).map(([slot, source]) => [grammar, slot, source] as const));

	it.each(cases)('%s %s', async (grammar, slot, source) => {
		const engine = (await createEngine(await languageByName(grammar))) as unknown as Engine;
		const { hooks } = (await import(`@sittir/${grammar}/api`)) as { hooks: { querySlots: QuerySlots } };
		const [typeName, slotName] = slot.split('.') as [string, string];
		const kindId = engine.kinds[typeName]!;
		const accessor = hooks.querySlots[kindId]!.find((row) => row[3] === `_${slotName}`)![0];

		const parsed = [...engine.parse(source).$query().$descendants.ofType(kindId)].find((node) => read(node, accessor) === null);
		expect(parsed, 'a parsed node that chose none').toBeDefined();
		const json = parsed!.toJSON();
		expect(json).toHaveProperty(accessor, null);

		const builtNone = revive(engine, json);
		expect(read(builtNone, accessor)).toBeNull();
		expect(builtNone.toJSON()).toEqual(json);

		const { [accessor]: _, ...unset } = json;
		const builtUnset = revive(engine, unset);
		expect(read(builtUnset, accessor)).toBeUndefined();
		expect(builtUnset.toJSON()).toEqual(unset);
	});
});
