import { describe, it, expect } from 'vitest';
import { inclusionCycles } from '../../src/inventory/derive.ts';

const key = (grammar: string, kind: string): string => `${grammar}${String.fromCharCode(0)}${kind}`;

const graph = (edges: Record<string, string[]>) =>
	new Map(Object.entries(edges).map(([k, v]) => [key(...(k.split(' ') as [string, string])), new Set(v)]));

describe('inclusionCycles', () => {
	it('finds a two-way inclusion', () => {
		expect(inclusionCycles(graph({ 'g a': ['b'], 'g b': ['a'] }))).toEqual(['g: a <-> b']);
	});

	it('finds a cycle of any length', () => {
		expect(inclusionCycles(graph({ 'g a': ['b'], 'g b': ['c'], 'g c': ['a'] }))).toEqual(['g: a <-> b <-> c']);
	});

	it('keeps grammars apart and ignores acyclic chains', () => {
		expect(inclusionCycles(graph({ 'g a': ['b'], 'g b': ['c'], 'g c': [], 'h a': ['c'], 'h c': [] }))).toEqual([]);
		expect(inclusionCycles(graph({ 'g a': ['b'], 'g b': ['a'], 'h a': ['b'], 'h b': [] }))).toEqual(['g: a <-> b']);
	});
});
