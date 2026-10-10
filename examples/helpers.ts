import type { NodeTrivia } from '@sittir/types';
import { readFileSync } from 'node:fs';

/** Whether a trivia entry is a node (a comment) rather than a whitespace unit variant, which carries layout only. */
function isTriviaNode(entry: unknown): boolean {
	return typeof entry === 'object' && entry !== null;
}

/**
 * The kind tree of a wrapped node — `$type` plus each `_<slot>` storage
 * value, hydrated through the wrap accessors — with source positions and
 * text dropped, and whitespace trivia with them, so two parses of
 * differently-formatted equivalent source compare equal.
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
	const trivia = (record.$_layout as { readonly trivia?: NodeTrivia } | undefined)?.trivia;
	if (trivia !== undefined) {
		const sides = record.$trivia as { leading(): readonly unknown[]; trailing(): readonly unknown[] };
		const triviaShape: Record<string, unknown> = {};
		const leading = trivia.leading === undefined ? [] : sides.leading().filter(isTriviaNode);
		const trailing = trivia.trailing === undefined ? [] : sides.trailing().filter(isTriviaNode);
		if (leading.length > 0) triviaShape.leading = leading.map(structuralShape);
		if (trailing.length > 0) triviaShape.trailing = trailing.map(structuralShape);
		if (leading.length + trailing.length > 0) shape.$_layout = { trivia: triviaShape };
	}
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
