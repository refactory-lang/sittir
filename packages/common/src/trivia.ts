export const TRIVIA_SIDES = ['leading', 'trailing', 'inner'] as const;

/** The trivia a node owns, by position: before it, after it, and, with no child, inside it. */
export interface TriviaSides<Entry> {
	readonly leading?: readonly Entry[];
	readonly trailing?: readonly Entry[];
	readonly inner?: readonly Entry[];
}

/**
 * Visit every list of trivia entries a node owns — leading, trailing and
 * inner — skipping the sides that are absent. Trivia entries are
 * children of their owner, so whatever a pass does to slot children it does
 * to each of these lists through this one walk.
 */
export function forEachTriviaList<Entry>(trivia: TriviaSides<Entry>, visit: (entries: readonly Entry[]) => void): void {
	const { leading, trailing, inner } = trivia;
	if (leading) visit(leading);
	if (trailing) visit(trailing);
	if (inner) visit(inner);
}

/**
 * Map every list of trivia entries a node owns, as {@link forEachTriviaList}
 * visits them.
 */
export function mapTriviaEntries<In, Out>(
	trivia: TriviaSides<In>,
	map: (entries: readonly In[]) => readonly Out[]
): TriviaSides<Out> {
	const { leading, trailing, inner } = trivia;
	return {
		...(leading && { leading: map(leading) }),
		...(trailing && { trailing: map(trailing) }),
		...(inner && { inner: map(inner) })
	};
}

export function carryTokensBetween<Entry>(from: unknown, to: Entry): Entry {
	if (to === null || typeof to !== 'object' || from === null || typeof from !== 'object') return to;
	if ((from as { $tokensBetween?: unknown }).$tokensBetween === true) (to as { $tokensBetween?: true }).$tokensBetween = true;
	return to;
}
