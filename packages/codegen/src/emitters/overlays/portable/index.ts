import { resolveRoutes, type GrammarInput, type ReadEntry } from '../../../bindings/routes.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import { fixedTextKinds, kindDiscriminantExpr, type KindEnumEntry } from '../../kind-discriminant.ts';
import { emitPortableNodeModel } from './node-model.ts';
import { readTestOf, slotRoutesOf } from './read-tests.ts';
import { emitPortableSurface } from './surface.ts';

export interface PortableOutputs {
	readonly nodeModel: string;
	readonly surface: string;
}

export function emitPortable(input: GrammarInput, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): PortableOutputs {
	const routes = resolveRoutes(input);
	const readTest = (entry: ReadEntry) => readTestOf(entry, input.model, slotRoutesOf(nodeMap));
	const kindIdOf = (kind: string) => kindDiscriminantExpr(kind, nodeMap, kindEntries);
	return {
		nodeModel: emitPortableNodeModel(routes, readTest),
		surface: emitPortableSurface({
			routes,
			readTest,
			kindIdOf,
			fixedText: fixedTextKinds(nodeMap, kindEntries).map(([kind, text]) => [kindIdOf(kind), text] as const)
		})
	};
}
