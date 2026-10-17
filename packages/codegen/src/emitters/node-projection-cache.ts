import type { NodeMap } from '../compiler/types.ts';
import { collectNodeProjection, type NodeProjection } from './node-projection.ts';

const projectionCache = new WeakMap<NodeMap, NodeProjection>();

export function getNodeProjection(nodeMap: NodeMap): NodeProjection {
	const cached = projectionCache.get(nodeMap);
	if (cached) return cached;
	const projection = collectNodeProjection(nodeMap);
	projectionCache.set(nodeMap, projection);
	return projection;
}
