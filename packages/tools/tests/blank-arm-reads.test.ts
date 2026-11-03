import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { BLANK_KIND_ID, snapshotOf } from '@sittir/common/utils';
import { PACKAGES_DIR } from '@sittir/codegen/grammars';
import type { QuerySlots } from '@sittir/types';
import { languageByName } from '../src/languages.ts';

interface ModelSlot {
	readonly name: string;
	readonly blank?: boolean;
}

interface ModelNode {
	readonly typeName: string;
	readonly slots?: readonly ModelSlot[];
}

function blankArmSlots(grammar: string): string[] {
	const model = JSON.parse(readFileSync(join(PACKAGES_DIR, grammar, 'src', 'node-model.json5'), 'utf-8')) as { readonly nodes: Record<string, ModelNode> };
	return Object.values(model.nodes)
		.flatMap((node) =>
			(node.slots ?? [])
				.filter((slot) => slot.blank === true)
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
		'ForHeaderUsingKind.terminator': 'for (using x of y) {}',
		'FunctionDeclaration.terminator': 'function f() {} x',
		'GeneratorFunctionDeclaration.terminator': 'function* g() {} x',
		'StatementBlock.terminator': '{} x'
	}
};

type Node = { readonly $type: number; readonly $with: Record<string, (value: unknown) => Node> } & Record<string, unknown>;
type Engine = {
	readonly kinds: Record<string, number>;
	parse(source: string): { $query(): { readonly $descendants: { ofType(kind: number): Iterable<Node> } } };
};

const read = (node: Node, accessor: string): unknown => (node[accessor] as () => unknown).call(node);

const STORAGES = ['object', 'arena'] as const;

describe('the blank arm of an optional preference reads as null and is stored as the blank kind id, on both backends', () => {
	it.each(Object.keys(CHOSE_NONE))('%s: every blank-arm slot has a source that chooses none', (grammar) => {
		expect(Object.keys(CHOSE_NONE[grammar]!).sort()).toEqual(blankArmSlots(grammar));
	});

	const cases = STORAGES.flatMap((storage) =>
		Object.entries(CHOSE_NONE).flatMap(([grammar, slots]) => Object.entries(slots).map(([slot, source]) => [storage, grammar, slot, source] as const))
	);

	it.each(cases)('%s storage: %s %s', async (storage, grammar, slot, source) => {
		const engine = (await createEngine(await languageByName(grammar), { nodeStorage: storage })) as unknown as Engine;
		const { hooks } = (await import(`@sittir/${grammar}/api`)) as { hooks: { querySlots: QuerySlots } };
		const [typeName, slotName] = slot.split('.') as [string, string];
		const kindId = engine.kinds[typeName]!;
		const storageKey = `_${slotName}`;
		const row = hooks.querySlots[kindId]!.find((entry) => entry[3] === storageKey)!;
		expect(row[5], 'the slot row stamps the blank arm').toBe(true);
		const accessor = row[0];

		const parsed = [...engine.parse(source).$query().$descendants.ofType(kindId)].find((node) => read(node, accessor) === null);
		expect(parsed, 'a parsed node that chose none').toBeDefined();
		expect(snapshotOf(parsed!)).toHaveProperty(storageKey, BLANK_KIND_ID);

		const builtNone = parsed!.$with[accessor]!(null);
		expect(read(builtNone, accessor)).toBeNull();
		expect(snapshotOf(builtNone)).toHaveProperty(storageKey, BLANK_KIND_ID);
	});
});
