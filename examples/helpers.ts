import { readFileSync } from 'node:fs';

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

const SIDES = ['leading', 'trailing', 'inner'] as const;

type Sides = Partial<Record<(typeof SIDES)[number], readonly unknown[]>>;

interface UnitSides extends Sides {
	readonly slot: string;
	readonly item: number;
}

interface Layout {
	readonly trivia?: Sides;
	readonly units?: readonly UnitSides[];
}

/** The text of a comment that a snapshot holds as its parts, such as the engine's render of it. */
export type CommentText = (comment: object) => string;

/**
 * A tree's structure, from a snapshot (`$snapshot()`, `snapshotOf`): each node's kind, its text and its stored
 * slots, and the comments on its sides and on its units' sides. Every layout fact is left out (spans, flanks,
 * slot spacing, separators, the blank lines and indentation a side holds), so two trees that differ only in
 * layout have equal structures. A flag slot that is off is left out like an empty one.
 *
 * Each comment is its kind and its text. A tree's snapshot holds its comments as text, while a built node's
 * holds a comment it was given as its parts; to compare a built tree with a parsed one, pass `commentText`,
 * which spells a comment held as parts. Without it, such a comment is its structure.
 */
export function structureOf(snapshot: unknown, commentText?: CommentText): unknown {
	if (Array.isArray(snapshot)) return snapshot.map((entry) => structureOf(entry, commentText));
	if (snapshot === null || typeof snapshot !== 'object') return snapshot;
	const out: Record<string, unknown> = {};
	for (const [key, member] of Object.entries(snapshot)) {
		if (key === '$type' || key === '$text' || (key.startsWith('_') && member !== undefined && member !== false)) out[key] = structureOf(member, commentText);
		else if (key === '$_layout') Object.assign(out, layoutComments(member as Layout, commentText));
	}
	return out;
}

function layoutComments(layout: Layout, commentText: CommentText | undefined): Record<string, unknown> {
	const trivia = layout.trivia === undefined ? undefined : sideComments(layout.trivia, commentText);
	const units = (layout.units ?? []).flatMap((unit) => {
		const sides = sideComments(unit, commentText);
		return sides === undefined ? [] : [{ slot: unit.slot, item: unit.item, ...sides }];
	});
	return { ...(trivia === undefined ? {} : { $trivia: trivia }), ...(units.length === 0 ? {} : { $units: units }) };
}

function sideComments(sides: Sides, commentText: CommentText | undefined): Record<string, unknown> | undefined {
	const out: Record<string, unknown> = {};
	for (const side of SIDES) {
		const comments = (sides[side] ?? [])
			.filter((entry): entry is object => typeof entry === 'object' && entry !== null)
			.map((entry) => commentOf(entry as { readonly $type?: unknown; readonly $text?: unknown }, commentText));
		if (comments.length > 0) out[side] = comments;
	}
	return Object.keys(out).length === 0 ? undefined : out;
}

function commentOf(entry: { readonly $type?: unknown; readonly $text?: unknown }, commentText: CommentText | undefined): unknown {
	const text = typeof entry.$text === 'string' ? entry.$text : commentText?.(entry);
	return text === undefined ? structureOf(entry) : { $type: entry.$type, $text: text };
}

/** Whether two parsed trees have the same structure (`structureOf`). */
export function sameStructure(a: { $snapshot(): unknown }, b: { $snapshot(): unknown }): boolean {
	return JSON.stringify(structureOf(a.$snapshot())) === JSON.stringify(structureOf(b.$snapshot()));
}

/**
 * The dogfood contract: a rebuilt node renders to text that (1) re-parses
 * to the same structure as the target file (`sameStructure`) and (2) is
 * identical to the target after collapsing whitespace. Layout is not the
 * claim — canonical render whitespace may differ from the author's.
 */
export function dogfoodContract(
	engine: { parse(source: string): { $snapshot(): unknown } },
	rebuilt: { $render(): string },
	targetPath: string
): DogfoodResult {
	const target = readFileSync(targetPath, 'utf8');
	const rendered = rebuilt.$render();
	const reparsesEqual = sameStructure(engine.parse(rendered), engine.parse(target));
	const a = collapseWhitespace(target);
	const b = collapseWhitespace(rendered);
	if (a === b) return { rendered, reparsesEqual, sameModuloWhitespace: true };
	let i = 0;
	while (i < a.length && a[i] === b[i]) i++;
	const firstDifference = `${a.slice(Math.max(0, i - 40), i + 40)} ⟷ ${b.slice(Math.max(0, i - 40), i + 40)}`;
	return { rendered, reparsesEqual, sameModuloWhitespace: false, firstDifference };
}
