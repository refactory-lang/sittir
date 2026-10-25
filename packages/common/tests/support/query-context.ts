import type { QuerySlots } from '@sittir/types';
import { queryFacet, type DescendantWalk, type QueryHooks } from '../../src/query.ts';
import { holdTreeOn, mintTreeToken, registerTree } from '../../src/tree-token.ts';
import { holdsKinds } from '../../src/language.ts';

export const IDENTITY: QueryHooks['membership'] = { isMember: (kind, type) => kind === type, membersOf: (kind) => [kind] };

type FlagTables = Pick<QueryHooks, 'queryFlags' | 'querySlotFlags'>;

/** The descendants view of a node on an empty synthetic tree that records each walk, with kinds named `kind_<id>`. */
export function queryContext<View>(querySlots: QuerySlots, membership = IDENTITY, flags: FlagTables = { queryFlags: {}, querySlotFlags: {} }) {
	const walks: DescendantWalk[] = [];
	const node = { $type: 0, $_layout: { at: { $treeHandle: 1, $span: { start: 0, end: 0 }, $type: 0 } } } as const;
	const token = mintTreeToken(1);
	registerTree(token, {
		query: {
			descendants(walk) {
				walks.push(walk);
				return { items: [], resume: null, origin: 0 };
			},
			planHolds: () => []
		}
	});
	holdTreeOn(node, token);
	const hooks: QueryHooks = {
		querySlots,
		...flags,
		membership,
		kindTest: holdsKinds,
		portable: undefined,
		kindName: (kind) => `kind_${kind}`,
		wrap: (data) => data
	};
	const facet = queryFacet(node, hooks) as { readonly $descendants: View };
	return { view: facet.$descendants, walks };
}
