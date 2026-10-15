import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { QuerySlots } from '@sittir/types';
import rust from '@sittir/rust';
import python from '@sittir/python';
import typescript from '@sittir/typescript';
import { createEngine } from '../src/create-engine.ts';
import { slotItems } from '../src/query.ts';
import { hooks as rustHooks } from '../../rust/src/api.ts';
import { hooks as pythonHooks } from '../../python/src/api.ts';
import { hooks as typescriptHooks } from '../../typescript/src/api.ts';

type Node = { readonly $type: number; readonly $_layout: { readonly at: { readonly $span: { readonly start: number; readonly end: number } } } };
type View = Iterable<Node> & { ofType(kind: number): View; where(condition: (c: Record<string, { eq(v: unknown): unknown; match(p: RegExp): unknown }>) => unknown): View };

const source = (path: string): string => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

const GRAMMARS = [
	['rust', () => createEngine(rust), rustHooks.querySlots, source('rust/crates/sittir-core/src/query.rs')],
	['python', () => createEngine(python), pythonHooks.querySlots, source('docs/superpowers/probes/2026-10-13-node-flags/census.py')],
	['typescript', () => createEngine(typescript), typescriptHooks.querySlots, source('packages/common/src/query.ts')]
] as const;

/** The kind id of the blank arm a parsed optional keeps when no child came: the slot holds nothing there. */
const BLANK = 0;

const at = (node: Node): string => `${node.$type}@${node.$_layout.at.$span.start}-${node.$_layout.at.$span.end}`;

const textOf = (text: string, item: unknown): string | undefined => {
	if (typeof item === 'string') return item;
	const span = (item as Partial<Node> | null)?.$_layout?.at.$span;
	return span === undefined ? undefined : text.slice(span.start, span.end);
};

describe('a where over a slot selects the nodes its read gives the slot', () => {
	it.each(GRAMMARS)('%s: every slot of every kind the source holds, natively as read', async (_, engineOf, querySlots: QuerySlots, text) => {
		const engine = await engineOf();
		const root = engine.parse(text) as unknown as { $query(): { $descendants: View } };
		const all = () => root.$query().$descendants;
		const byKind = new Map<number, Node[]>();
		for (const node of all()) byKind.set(node.$type, [...(byKind.get(node.$type) ?? []), node]);
		const disagreements: string[] = [];
		let checked = 0;
		for (const [kind, nodes] of byKind) {
			for (const [accessor, , keyword] of querySlots[kind] ?? []) {
				const held = (node: Node) => slotItems(node, accessor).filter((item) => (keyword === undefined ? item !== false && item !== BLANK : item === true));
				const expected = nodes.filter((node) => held(node).length > 0).map(at);
				const native = (condition: Parameters<View['where']>[0]) => [...all().ofType(kind).where(condition)].filter((node) => node.$type === kind).map(at);
				const present = native((c) => (keyword === undefined ? c[accessor]!.match(/^/) : c[accessor]!.eq(true)));
				if (JSON.stringify(present) !== JSON.stringify(expected)) disagreements.push(`${kind}.${accessor}: read ${expected.length}, query ${present.length}`);
				const first = nodes.find((node) => held(node).length > 0);
				const firstText = keyword === undefined && first !== undefined ? textOf(text, held(first)[0]) : undefined;
				if (firstText !== undefined && !native((c) => c[accessor]!.eq(firstText)).includes(at(first!))) disagreements.push(`${kind}.${accessor}: eq ${JSON.stringify(firstText)} misses ${at(first!)}`);
				checked++;
			}
		}
		expect(disagreements).toEqual([]);
		expect(checked).toBeGreaterThan(50);
	});
});
