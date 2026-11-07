import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { PLAIN_KINDS, toNodeData } from '@sittir/common/utils';
import type { AnyUntypedNode } from '@sittir/types';
import language from '../src/index.ts';

const engine = await createEngine(language);
const WHOLE = { deep: true, depth: Infinity };

/** Each `$_layout` key a node of `given` holds that the same node of `crossed` lacks, by path. */
function droppedKeys(given: unknown, crossed: unknown, path = '$'): string[] {
	if (Array.isArray(given)) return given.flatMap((entry, at) => droppedKeys(entry, (crossed as unknown[] | undefined)?.[at], `${path}[${at}]`));
	if (given === null || typeof given !== 'object') return [];
	const into = crossed as Record<string, unknown> | undefined;
	const own = (given as { $_layout?: Record<string, unknown> }).$_layout;
	const kept = (into?.$_layout ?? {}) as Record<string, unknown>;
	const dropped = Object.keys(own ?? {}).filter((key) => !(key in kept)).map((key) => `${path}.$_layout.${key}`);
	return dropped.concat(Object.entries(given).flatMap(([key, child]) => (key === '$_layout' ? [] : droppedKeys(child, into?.[key], `${path}.${key}`))));
}

describe('a $_layout crossing', () => {
	it('carries every key a snapshot node holds', () => {
		const source = '\n/* lead */\nuse a;\n\nfn f(x: u8,\n     y: u8) { g(x, y) } // trail\n\n';
		const snap = engine.parse(source, WHOLE).$snapshot() as AnyUntypedNode;
		const keys = new Set<string>();
		const collect = (value: unknown): void => {
			if (Array.isArray(value)) return value.forEach(collect);
			if (value === null || typeof value !== 'object') return;
			for (const key of Object.keys((value as { $_layout?: object }).$_layout ?? {})) keys.add(key);
			Object.values(value).forEach(collect);
		};
		collect(snap);
		expect([...keys]).toEqual(expect.arrayContaining(['span', 'flanks', 'trivia']));
		expect(droppedKeys(snap, toNodeData(snap, PLAIN_KINDS))).toEqual([]);
	});
});
