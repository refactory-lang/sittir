import { describe, expect, it } from 'vitest';
import type { NodeMap } from '../../types.ts';
import { bundleKeyedNodes, flattenedVariantParents, irPlanOf, stampIrSurface } from '../ir-surface.ts';
import { makeMinimalNodeMap } from '../../../__tests__/helpers/node-map-fixtures.ts';

function unstamped(): NodeMap {
	const { irSurface: _, ...rest } = makeMinimalNodeMap();
	return rest;
}

describe('ir surface', () => {
	it('refuses a node map whose surface was never stamped', () => {
		expect(() => irPlanOf(unstamped())).toThrow(/'rust' was not stamped/);
		expect(() => bundleKeyedNodes(unstamped())).toThrow(/was not stamped/);
		expect(() => flattenedVariantParents(unstamped())).toThrow(/was not stamped/);
	});

	it('reads what the stamp stored', () => {
		const nodeMap = unstamped();
		stampIrSurface(nodeMap);
		expect(irPlanOf(nodeMap)).toBe(nodeMap.irSurface?.plan);
		expect(bundleKeyedNodes(nodeMap).map((entry) => entry.key)).toEqual(['callExpression']);
	});
});
