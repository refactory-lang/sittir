import type { AnyNodeData, GrammarFacts, GrammarNodeMethods, GrammarTypeMap, NodeNs } from '@sittir/types';
import { bindRuntime } from '../../packages/common/src/utils.ts';

interface List {
	readonly $type: 1;
	readonly $source: 2;
	readonly _items?: readonly Leaf[];
}
interface EmptyList extends List {
	readonly empty: true;
}
interface Leaf {
	readonly $type: 2;
	readonly $source: 2;
	readonly $text: string;
}
interface Comment {
	readonly $type: 3;
	readonly $source: 2;
	readonly $text: string;
}
interface FakeTypeMap extends GrammarTypeMap {
	readonly namespaces: { readonly 1: NodeNs<List>; readonly 2: NodeNs<Leaf> };
	readonly empty: { readonly node: List; readonly empty: EmptyList };
	readonly trivia: Comment;
}

declare const facts: GrammarFacts;
const runtime = bindRuntime<FakeTypeMap>(facts);

declare const list: List;
if (runtime.isEmpty(list)) list satisfies EmptyList;

declare const leaf: Leaf;
// @ts-expect-error a kind that never realizes empty has no isEmpty
runtime.isEmpty(leaf);

declare const value: unknown;
if (runtime.isNodeData(value)) value satisfies AnyNodeData;

const built = runtime.withMethods(leaf, facts);
built satisfies Leaf & GrammarNodeMethods<Comment>;
built.$trivia.leading() satisfies readonly Comment[];
built.$trivia.leading('// note') satisfies typeof built;
