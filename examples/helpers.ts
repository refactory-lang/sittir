import type { TreeHandle } from '@sittir/common';
import type { AnyNodeData, Edit } from '@sittir/types';

export function parseSource<
	TParsed extends { root: AnyNodeData; tree: TreeHandle },
	TEngine extends { reader?: { parseAndRead(source: string): TParsed } },
>(engine: TEngine, source: string): TParsed {
	if (!engine.reader) {
		throw new Error('This example requires an engine reader. The current backend is render-only.');
	}
	return engine.reader.parseAndRead(source);
}

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
