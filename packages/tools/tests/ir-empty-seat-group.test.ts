import { describe, expect, it } from 'vitest';
import {
	buildFactoryNodeFromReference,
	buildReadHandle,
	loadIrSurface,
	loadNodeModel,
	loadScopedFactoryMap,
	loadSlotAccessorOf,
	loadStorageKindNameFromId,
	materialize,
	readNodeOf,
	walkWrappedTree,
	type TypedNode
} from '../src/validate/common.ts';
import { requireGrammarModule } from '../src/grammar-internals.ts';

async function irBuild(grammar: string, source: string, rootKind: string) {
	const kindNameFromId = await loadStorageKindNameFromId(grammar);
	const model = await loadNodeModel(grammar);
	const factoryMap = await loadScopedFactoryMap(grammar, (await requireGrammarModule(grammar, 'factories/raw.ts'))._factoryMap);
	const surface = await loadIrSurface(grammar);
	const accessorOf = await loadSlotAccessorOf(grammar);
	const readNode = await readNodeOf(grammar);
	if (surface === undefined) throw new Error(`${grammar} has no ir surface`);
	const tree = await buildReadHandle(grammar, source);
	const artifacts = { factoryMap, factoryShapes: model.factoryShapes, fieldAliasMap: model.fieldAliasMap, factoryFields: model.factoryFields, factorySlots: model.factorySlots, surface };
	const built = buildFactoryNodeFromReference(materialize(readNode(tree), accessorOf), rootKind, artifacts, { kindNameFromId, tree, placeText: true, accessorOf });
	const nodesOf = (kind: string): TypedNode[] => {
		const nodes: TypedNode[] = [];
		walkWrappedTree(built, accessorOf, (node) => {
			if (kindNameFromId(node.$type) === kind) nodes.push(node);
		});
		return nodes;
	};
	return { built, nodesOf };
}

describe('the ir lane keeps an empty seat group a flattened seat cannot spell', () => {
	it('python: a nested slice keeps its empty step group', async () => {
		const { nodesOf } = await irBuild('python', 'a[:]\nc[::]\nd[1:2:3]\n', 'module');
		const steps = nodesOf('slice').map((slice) => (slice as unknown as { step: () => unknown }).step() !== undefined);
		expect(steps).toEqual([false, true, true]);
	});

	it('rust: a nested use wildcard keeps its empty group', async () => {
		const { nodesOf } = await irBuild('rust', 'use my::{*};\nuse ::*;\nuse a::b::*;\n', 'source_file');
		const groups = nodesOf('use_wildcard').map(
			(wildcard) => (wildcard as unknown as { useWildcardGroup: () => unknown }).useWildcardGroup() !== undefined
		);
		expect(groups).toEqual([false, true, true]);
	});
});
