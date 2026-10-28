// Every corpus case the factory validator builds as records, on every grammar:
// each built node, handed to its own builder as reference data (nodeToConfig
// reading a built node's slots), rebuilds to the same structure. The validator
// hands built children to their parents' builders as they are, so this is the
// one place a built node is rebuilt from its slots. Once the validator has
// released its roots, the built arena holds no record.
import { describe, expect, it } from 'vitest';
import { isNode, snapshotOf, storedSlotValues } from '@sittir/common/utils';
import { builtRefOf } from '../../common/src/built-ref.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../codegen/src/__tests__/helpers/timeouts.ts';
import {
	buildFactoryNodeFromReference,
	loadNativeEngine,
	loadNodeModel,
	loadScopedFactoryMap,
	loadSlotAccessorOf,
	loadStorageKindNameFromId,
	useValidationConstruction,
	useValidationNodeStorage,
	type FactoryDispatchArtifacts,
	type ReadNodeLike
} from '../src/validate/common.ts';
import { validateFactoryStorage } from '../src/validate/factory-storage.ts';
import { requireGrammarModule } from '../src/grammar-internals.ts';
import { structureOf } from '../../../examples/helpers.ts';

useValidationNodeStorage('arena');
useValidationConstruction('record');

async function artifactsOf(grammar: string): Promise<FactoryDispatchArtifacts> {
	const model = await loadNodeModel(grammar);
	return {
		factoryMap: await loadScopedFactoryMap(grammar, (await requireGrammarModule(grammar, 'factories/raw.ts'))._factoryMap),
		factoryShapes: model.factoryShapes,
		fieldAliasMap: model.fieldAliasMap,
		factoryFields: model.factoryFields,
		factorySlots: model.factorySlots
	};
}

function items(value: unknown): readonly unknown[] | undefined {
	if (value === null || typeof value !== 'object' || isNode(value) || !(Symbol.iterator in value)) return undefined;
	return [...(value as Iterable<unknown>)];
}

function builtViews(node: object, out: Set<object>): Set<object> {
	if (builtRefOf(node) === undefined || out.has(node)) return out;
	out.add(node);
	for (const [, value] of storedSlotValues(node)) {
		for (const child of items(value) ?? [value]) if (isNode(child)) builtViews(child, out);
	}
	return out;
}

const structure = (node: unknown): string => JSON.stringify(structureOf(snapshotOf(node as object)));

describe.each(['rust', 'typescript', 'python', 'regex', 'scm'])('the %s corpus, built as records', (grammar) => {
	it(
		'rebuilds each built node from its own slots, and holds no record once its roots are released',
		async () => {
			const engine = await loadNativeEngine(grammar);
			const artifacts = await artifactsOf(grammar);
			const kindNameFromId = await loadStorageKindNameFromId(grammar);
			const accessorOf = await loadSlotAccessorOf(grammar);
			const failed = new Map<string, string>();
			let rebuilt = 0;
			await validateFactoryStorage(grammar, 'native', {
				onBuilt: (built, at) => {
					for (const view of builtViews(built, new Set())) {
						const kind = kindNameFromId((view as { readonly $type: number }).$type);
						if (kind === undefined || artifacts.factoryMap[kind] === undefined || artifacts.factoryShapes[kind] === 'constant') continue;
						try {
							const copy = buildFactoryNodeFromReference(view as ReadNodeLike, kind, artifacts, { kindNameFromId, accessorOf });
							rebuilt++;
							const [want, got] = [structure(view), structure(copy)];
							if (got !== want) failed.set(kind, `${at.entry}: ${got.slice(0, 160)}`);
							if (copy !== view) (copy as Partial<Disposable> | null)?.[Symbol.dispose]?.();
						} catch (error) {
							failed.set(kind, `${at.entry}: throws ${(error as Error).message.slice(0, 160)}`);
						}
					}
				}
			});
			expect(rebuilt).toBeGreaterThan(0);
			expect(Object.fromEntries(failed)).toEqual({});
			expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
		},
		FULL_PIPELINE_TIMEOUT
	);
});
