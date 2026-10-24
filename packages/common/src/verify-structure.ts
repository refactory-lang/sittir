import type { KindMembership, StructureRow, StructureTable } from '@sittir/types';
import { rejectBareText } from './runtime.ts';
import { Source } from './source.ts';
import { isRebuilt } from './node-data.ts';
import { isNodeValue } from './utils.ts';
import { isCoordinate } from './read.ts';
import { sourceOf } from './source-stamp.ts';

export function verifyStructure(value: unknown, table: StructureTable, membership: KindMembership, seen: WeakSet<object>): void {
	if (typeof value === 'object' && value !== null && !seen.has(value)) verifyNode(value as Record<string, unknown>, table, membership, seen);
}

function verifyNode(node: Record<string, unknown>, table: StructureTable, membership: KindMembership, seen: WeakSet<object>): void {
	const row = typeof node.$type === 'number' ? table[node.$type] : undefined;
	if (row !== undefined) checkRow(node, row, membership);
	for (const [key, child] of Object.entries(node)) {
		if (!key.startsWith('$')) verifyBuilt(child, table, membership, seen);
	}
	seen.add(node);
}

function verifyBuilt(value: unknown, table: StructureTable, membership: KindMembership, seen: WeakSet<object>): void {
	if (Array.isArray(value)) {
		for (const item of value) verifyBuilt(item, table, membership, seen);
		return;
	}
	if (typeof value !== 'object' || value === null || seen.has(value)) return;
	const node = value as Record<string, unknown>;
	if (sourceOf(node) === Source.Factory || isRebuilt(node)) verifyNode(node, table, membership, seen);
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

function checkRow(node: Record<string, unknown>, row: StructureRow, membership: KindMembership): void {
	for (const [storage, slot] of row.required ?? []) {
		if (node[storage] === undefined || node[storage] === null) throw new Error(`Missing required slot '${slot}' on ${row.kind}`);
	}
	for (const [storage, label] of row.nonEmpty ?? []) {
		const items = node[storage];
		if (!Array.isArray(items) || items.length === 0) throw new Error(`${label}: requires at least one element`);
	}
	for (const [storage, label, expected, kinds] of row.nodeOnly ?? []) {
		const value = rejectNonNode(rejectBareText(node[storage], label, expected), label, expected);
		if (kinds !== undefined) rejectForeignKind(value, label, expected, kinds, membership);
	}
	for (const [storage, label] of row.booleans ?? []) {
		requireScalar(rejectBareText(node[storage], label, 'a boolean'), label, 'a boolean', (value) => typeof value === 'boolean');
	}
	for (const [storage, label, kinds] of row.kindIds ?? []) {
		requireScalar(rejectBareText(node[storage], label, 'a kind id'), label, `a kind id of ${kinds.join(' / ')}`, (value) => typeof value === 'number' && kinds.includes(value));
	}
	for (const [storage, label, texts] of row.texts ?? []) {
		requireScalar(node[storage], label, `one of ${texts.map((text) => `'${text}'`).join(' / ')}`, (value) => typeof value === 'string' && texts.includes(value));
	}
}

function rejectNonNode(value: unknown, label: string, expected: string): unknown {
	if (Array.isArray(value)) {
		for (const item of value) rejectNonNode(item, label, expected);
		return value;
	}
	if (typeof value === 'function' || typeof value === 'boolean' || typeof value === 'symbol') {
		throw new Error(`${label}: a strict factory takes a built node, not a ${typeof value}; expected ${expected}, or use .coerce`);
	}
	return value;
}

function requireScalar(value: unknown, label: string, expected: string, holds: (value: unknown) => boolean): void {
	if (value !== undefined && value !== null && !holds(value)) throw new Error(`${label}: takes ${expected}, not ${describeValue(value)}`);
}

function describeValue(value: unknown): string {
	if (typeof value === 'number') return `kind id ${value}`;
	if (typeof value === 'string') return `the string '${value}'`;
	return `a ${typeof value}`;
}

function rejectForeignKind(value: unknown, label: string, expected: string, kinds: readonly number[], membership: KindMembership): void {
	if (Array.isArray(value)) {
		for (const item of value) rejectForeignKind(item, label, expected, kinds, membership);
		return;
	}
	if (typeof value !== 'object' || value === null || isCoordinate(value)) return;
	const type = (value as { $type?: unknown }).$type;
	if (typeof type === 'number' && !kinds.some((kind) => membership.isMember(kind, type))) {
		throw new Error(`${label}: a strict factory takes ${expected}, not a node of kind ${type}`);
	}
}
