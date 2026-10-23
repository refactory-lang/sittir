import type { StructureRow, StructureTable } from '@sittir/types';
import { rejectBareText } from './runtime.ts';
import { Source } from './source.ts';
import { isRebuilt } from './node-data.ts';
import { isNodeValue } from './utils.ts';
import { sourceOf } from './source-stamp.ts';
import { isBuiltNode } from './built-arena.ts';

export function verifyStructure(value: unknown, table: StructureTable, seen: WeakSet<object>): void {
	if (typeof value === 'object' && value !== null && !seen.has(value) && !isBuiltNode(value)) verifyNode(value as Record<string, unknown>, table, seen);
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

export function checkInput(row: StructureRow, args: readonly unknown[], declared: readonly string[] | undefined = row.config): void {
	const head = args[0];
	if (declared !== undefined && isConfigInput(head)) {
		for (const key of Object.keys(head)) {
			if (!key.startsWith('$') && !declared.includes(key)) throw new Error(`${row.kind}: undeclared config key '${key}'`);
		}
	}
	for (const [slot, holes, arrival] of row.lists ?? []) {
		if (holes) continue;
		const absent = listInput(args, slot, arrival).findIndex((item) => item === undefined || item === null);
		if (absent >= 0) throw new Error(`${row.kind}.${slot}: absent item at index ${absent}`);
	}
}

function isConfigInput(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value) && !isNodeValue(value);
}

function listInput(args: readonly unknown[], slot: string, arrival: 'key' | number): readonly unknown[] {
	const head = args[0];
	if (arrival === 'key') return isConfigInput(head) && Array.isArray(head[slot]) ? (head[slot] as readonly unknown[]) : [];
	const keyed = args.length === 1 && isConfigInput(head) && slot in head;
	const rest = arrival === 1 && isConfigInput(head) && !keyed ? args.slice(1) : args;
	const [only] = rest;
	if (rest.length !== 1) return rest;
	if (Array.isArray(only)) return only;
	return isConfigInput(only) && slot in only ? (Array.isArray(only[slot]) ? (only[slot] as readonly unknown[]) : [only[slot]]) : rest;
}

export function checkRow(node: Readonly<Record<string, unknown>>, row: StructureRow): void {
	for (const [storage, slot] of row.required ?? []) {
		if (node[storage] === undefined || node[storage] === null) throw new Error(`Missing required slot '${slot}' on ${row.kind}`);
	}
	for (const [storage, label] of row.nonEmpty ?? []) {
		const items = node[storage];
		if (!Array.isArray(items) || items.length === 0) throw new Error(`${label}: requires at least one element`);
	}
	for (const [storage, label, expected] of row.nodeOnly ?? []) rejectBareText(node[storage], label, expected);
}
