import type { TreeHandle } from '@sittir/common';
import type { AnyNodeData, Edit } from '@sittir/types';
import { readFileSync } from 'node:fs';
export type { TreeHandle };

export function nodeText(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (value && typeof value === 'object' && '$text' in value) {
		const text = (value as { $text?: unknown }).$text;
		return typeof text === 'string' ? text : '';
	}
	return '';
}

export function renderText(value: unknown): string {
	if (value && typeof value === 'object' && '$render' in value) {
		const render = (value as { $render?: unknown }).$render;
		if (typeof render === 'function') return render.call(value) as string;
	}
	return nodeText(value);
}

export function isNodeData(value: unknown): value is AnyNodeData {
	return value !== null && typeof value === 'object' && '$type' in value;
}

export function isTypedNodeData(value: unknown): value is AnyNodeData & { $type: number } {
	return isNodeData(value) && typeof value.$type === 'number';
}

export function replaceAtSpan(
	target: { $span?: { start: number; end: number } },
	replacement: { $render(): string },
): Edit {
	if (!target.$span) {
		throw new Error('Cannot create an edit for a node without byte-span metadata.');
	}
	return {
		startPos: target.$span.start,
		endPos: target.$span.end,
		insertedText: replacement.$render(),
	};
}

/**
 * The kind tree of a wrapped node — `$type` plus each `_<slot>` storage
 * value, drilled through the wrap accessors — with source positions and
 * text dropped, so two parses of differently-formatted equivalent source
 * compare equal.
 */
export function structuralShape(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(structuralShape);
	if (node === null || typeof node !== 'object') return node;
	const record = node as Record<string, unknown>;
	const shape: Record<string, unknown> = { $type: record.$type };
	for (const key of Object.keys(record)) {
		if (!key.startsWith('_')) continue;
		const accessor = record[key.slice(1).replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())];
		const value = typeof accessor === 'function' ? (accessor as () => unknown).call(record) : record[key];
		shape[key] = structuralShape(value);
	}
	const isBareLeaf = Object.keys(shape).length === 1;
	if (typeof record.$text === 'string' && isBareLeaf) shape.$text = record.$text;
	if (record.$triviaData !== undefined) shape.$triviaData = structuralShape(record.$triviaData);
	return shape;
}

export interface DogfoodResult {
	readonly rendered: string;
	readonly reparsesEqual: boolean;
	readonly sameModuloWhitespace: boolean;
	/** The 80-character window around the first whitespace-insensitive
	 *  difference, `<target> ⟷ <rendered>`; absent when identical. */
	readonly firstDifference?: string;
}

function collapseWhitespace(s: string): string {
	return s.replace(/\s+/g, '');
}

/**
 * The dogfood contract: a rebuilt node renders to text that (1) re-parses
 * to the same tree as the target file and (2) is identical to the target
 * after collapsing whitespace. Layout is not the claim — canonical render
 * whitespace may differ from the author's.
 */
export function dogfoodContract(
	engine: { parse(source: string): unknown },
	rebuilt: { $render(): string },
	targetPath: string
): DogfoodResult {
	const target = readFileSync(targetPath, 'utf8');
	const rendered = rebuilt.$render();
	const reparsesEqual =
		JSON.stringify(structuralShape(engine.parse(rendered))) ===
		JSON.stringify(structuralShape(engine.parse(target)));
	const a = collapseWhitespace(target);
	const b = collapseWhitespace(rendered);
	if (a === b) return { rendered, reparsesEqual, sameModuloWhitespace: true };
	let i = 0;
	while (i < a.length && a[i] === b[i]) i++;
	const firstDifference = `${a.slice(Math.max(0, i - 40), i + 40)} ⟷ ${b.slice(Math.max(0, i - 40), i + 40)}`;
	return { rendered, reparsesEqual, sameModuloWhitespace: false, firstDifference };
}
