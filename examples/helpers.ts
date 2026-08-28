import type { TreeHandle } from '@sittir/common';
import type { AnyNodeData, Edit } from '@sittir/types';
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
	if (typeof record.$text === 'string' && Object.keys(shape).length === 1) shape.$text = record.$text;
	return shape;
}
