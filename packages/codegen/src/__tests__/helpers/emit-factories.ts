/**
 * Shared emitFactories driver for codegen emitter tests.
 * Non-test module — safe to import without registering test cases.
 */

import { FactoryEmitter, type EmitFactoriesConfig } from '../../emitters/factories.ts';

export function emitFactories(config: EmitFactoriesConfig): string {
	const factoryEmitter = new FactoryEmitter(config);
	for (const [kind, node] of config.nodeMap.nodes) {
		factoryEmitter.dispatchNode(kind, node);
	}
	return factoryEmitter.finalize();
}
