/**
 * Shared emitFrom driver for codegen emitter tests.
 * Non-test module — safe to import without registering test cases.
 */

import { FromEmitter, type EmitFromConfig } from '../../emitters/from.ts';

export function emitFrom(config: EmitFromConfig): string {
	const fromEmitter = new FromEmitter(config);
	for (const [kind, node] of config.nodeMap.nodes) {
		fromEmitter.dispatchNode(kind, node);
	}
	return fromEmitter.finalize();
}
