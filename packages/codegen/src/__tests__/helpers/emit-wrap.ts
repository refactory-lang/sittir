/**
 * Shared emitWrap driver for codegen emitter tests.
 * Non-test module — safe to import without registering test cases.
 */

import { WrapEmitter, type EmitWrapConfig } from '../../emitters/wrap.ts';

export function emitWrap(config: EmitWrapConfig): string {
	const wrapEmitter = new WrapEmitter(config);
	for (const [kind, node] of config.nodeMap.nodes) {
		wrapEmitter.dispatchNode(kind, node);
	}
	return wrapEmitter.finalize();
}
