/**
 * Shared builder-table driver for codegen emitter tests.
 * Non-test module — safe to import without registering test cases.
 */

import type { NodeMap } from '../../compiler/types.ts';
import { builderTables } from '../../emitters/overlays/build-table.ts';
import { collectPolymorphWires } from '../../emitters/overlays/polymorphs.ts';

export interface EmittedTables {
	readonly wiring: string;
	readonly combinators: string;
	readonly loose: string;
	readonly strict: string;
}

export function emitTables(nodeMap: NodeMap): EmittedTables {
	const { files } = builderTables(nodeMap, collectPolymorphWires(nodeMap));
	return {
		wiring: files['factories/build-table.ts']!,
		combinators: files['factories/combinators.ts']!,
		loose: files['factories/loose.ts']!,
		strict: files['factories/strict.ts']!
	};
}
