import type { AssembledNode } from '../compiler/node-map.ts';

/** Constructor-based emitter with no init() lifecycle phase. */
export interface CodegenEmitter<TResult, TFinalizeArg = void> {
	emitLeaf?(node: Extract<AssembledNode, { modelType: 'pattern' | 'keyword' | 'enum' }>): void;
	emitBranch?(node: Extract<AssembledNode, { modelType: 'branch' }>): void;
	emitPolymorph?(node: Extract<AssembledNode, { modelType: 'polymorph' }>): void;
	emitGroup?(node: Extract<AssembledNode, { modelType: 'group' }>): void;
	finalize(arg: TFinalizeArg): TResult;
}
