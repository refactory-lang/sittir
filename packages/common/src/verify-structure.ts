import type { StructureRow, StructureTable } from '@sittir/types';
import { rejectBareText } from './runtime.ts';
import { Source } from './source.ts';
import { isRebuilt } from './node-data.ts';
import { sourceOf } from './source-stamp.ts';

export function verifyStructure(value: unknown, table: StructureTable, seen: WeakSet<object>): void {
	if (typeof value === 'object' && value !== null && !seen.has(value)) verifyNode(value as Record<string, unknown>, table, seen);
}

function verifyNode(node: Record<string, unknown>, table: StructureTable, seen: WeakSet<object>): void {
	const row = typeof node.$type === 'number' ? table[node.$type] : undefined;
	if (row !== undefined) checkRow(node, row);
	for (const [key, child] of Object.entries(node)) {
		if (!key.startsWith('$')) verifyBuilt(child, table, seen);
	}
	seen.add(node);
}

function verifyBuilt(value: unknown, table: StructureTable, seen: WeakSet<object>): void {
	if (Array.isArray(value)) {
		for (const item of value) verifyBuilt(item, table, seen);
		return;
	}
	if (typeof value !== 'object' || value === null || seen.has(value)) return;
	const node = value as Record<string, unknown>;
	if (sourceOf(node) === Source.Factory || isRebuilt(node)) verifyNode(node, table, seen);
}

function checkRow(node: Record<string, unknown>, row: StructureRow): void {
	for (const [storage, slot] of row.required ?? []) {
		if (node[storage] === undefined || node[storage] === null) throw new Error(`Missing required slot '${slot}' on ${row.kind}`);
	}
	for (const [storage, label] of row.nonEmpty ?? []) {
		const items = node[storage];
		if (!Array.isArray(items) || items.length === 0) throw new Error(`${label}: requires at least one element`);
	}
	for (const [storage, label, expected] of row.nodeOnly ?? []) rejectBareText(node[storage], label, expected);
}
