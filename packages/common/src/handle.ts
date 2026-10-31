import type { NodeCoordinate } from '@sittir/types';
import type { BuiltText } from './built-arena.ts';
import type { ChunkWords, TreeHandle } from './read.ts';

export interface RecordPosition {
	readonly $type: number;
	readonly $tree: TreeHandle;
	readonly $at: number;
	readonly $_layout: { readonly at: NodeCoordinate } | undefined;
}

export interface RecordHandle extends RecordPosition {
	readonly $words: ChunkWords;
	$cache: Record<number, unknown> | undefined;
}

export type LeafSite = number | readonly number[];

export interface LeafHandle {
	readonly $type: number;
	readonly $tree: TreeHandle;
	readonly $entry: BuiltText;
	readonly $site: LeafSite | undefined;
}

export type LeafMaker = (tree: TreeHandle, entry: BuiltText, site: LeafSite | undefined) => object;

export const HANDLE_FIELDS: ReadonlySet<string> = new Set(['$tree', '$at', '$words', '$cache', '$entry', '$site']);

export function handleDispose(this: { readonly $tree: TreeHandle; readonly $at?: number }): void {
	this.$tree.built?.releaseHandle(this);
}

export function releaseNothing(): void {}

export function isHandle(value: object): boolean {
	return Object.hasOwn(value, Symbol.dispose) && (value as { readonly [Symbol.dispose]?: unknown })[Symbol.dispose] === handleDispose;
}

export function isRecordPosition(value: unknown): value is RecordPosition {
	return typeof value === 'object' && value !== null && typeof (value as { readonly $at?: unknown }).$at === 'number' && (value as { readonly $tree?: unknown }).$tree !== undefined;
}

export function isLeafHandle(value: unknown): value is LeafHandle {
	return typeof value === 'object' && value !== null && (value as { readonly $entry?: unknown }).$entry !== undefined && (value as { readonly $tree?: unknown }).$tree !== undefined;
}

export function isParsedPosition(value: unknown): value is RecordPosition {
	return isRecordPosition(value) && value.$tree.built === undefined;
}
