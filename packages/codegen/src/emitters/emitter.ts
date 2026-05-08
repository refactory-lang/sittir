import type { AssembledNode } from '../compiler/node-map.ts';

export interface LoopDrivenEmitter<TConfig, TResult> {
	init(config: TConfig): void;
	emitLeaf?(node: AssembledNode): void;
	emitBranch?(node: AssembledNode): void;
	emitPolymorph?(node: AssembledNode): void;
	emitGroup?(node: AssembledNode): void;
	finalize(): TResult;
}
