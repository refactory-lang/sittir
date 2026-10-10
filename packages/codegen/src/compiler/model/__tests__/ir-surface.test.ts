import { describe, expect, it } from 'vitest';
import type { NodeMap } from '../../types.ts';
import { bundleKeyedNodes, flattenedVariantParents, irPlanOf, resolveBuilderPaths, stampIrSurface, type OwnerRoute } from '../ir-surface.ts';
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

	it('refuses a cycle of owner routes, naming it', () => {
		const [a, b] = [...unstamped().nodes.values()];
		const routes = new Map<string, readonly OwnerRoute[]>([
			[a!.kind, [{ parent: b!, name: 'x' }]],
			[b!.kind, [{ parent: a!, name: 'y' }]]
		]);
		const owners = { all: routes, declared: routes, contained: new Map(), grouped: new Map() };
		expect(() => resolveBuilderPaths('rust', [a!, b!], owners)).toThrow(`'rust' has a cycle of owner routes (${a!.kind} → ${b!.kind} → ${a!.kind})`);
	});
});
