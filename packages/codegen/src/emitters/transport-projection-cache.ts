import type { NodeMap } from '../compiler/types.ts';
import { collectTransportProjection, type TransportProjection } from './transport-projection.ts';

const projectionCache = new WeakMap<NodeMap, TransportProjection>();

export function getTransportProjection(nodeMap: NodeMap): TransportProjection {
	const cached = projectionCache.get(nodeMap);
	if (cached) return cached;
	const projection = collectTransportProjection(nodeMap);
	projectionCache.set(nodeMap, projection);
	return projection;
}
