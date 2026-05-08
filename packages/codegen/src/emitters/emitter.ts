import type { AssembledNode } from '../compiler/node-map.ts';

export interface LoopDrivenEmitter<TConfig, TResult> {
	init(config: TConfig): void;
	emitLeaf?(node: AssembledNode): void;
	emitBranch?(node: AssembledNode): void;
	emitPolymorph?(node: AssembledNode): void;
	emitGroup?(node: AssembledNode): void;
	finalize(): TResult;
}

/** Constructor-based emitter with no init() lifecycle phase. */
export interface CodegenEmitter<TResult, TFinalizeArg = void> {
	emitLeaf?(node: Extract<AssembledNode, { modelType: 'pattern' | 'keyword' | 'enum' }>): void;
	emitBranch?(node: Extract<AssembledNode, { modelType: 'branch' }>): void;
	emitPolymorph?(node: Extract<AssembledNode, { modelType: 'polymorph' }>): void;
	emitGroup?(node: Extract<AssembledNode, { modelType: 'group' }>): void;
	finalize(arg: TFinalizeArg): TResult;
}
