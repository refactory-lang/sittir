import type { AnyUntypedNode, ErrorNode, NodeMethods, GrammarTypeMap, NodeNs } from '@sittir/types';
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

const runtime = bindRuntime<FakeTypeMap>();

declare const value: unknown;
if (runtime.isNode(value)) value satisfies AnyUntypedNode;

declare const built: Leaf & NodeMethods<Comment>;
built.$trivia.leading() satisfies readonly (Comment | ErrorNode)[];
built.$trivia.leading('// note') satisfies typeof built;
