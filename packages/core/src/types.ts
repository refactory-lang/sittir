// @sittir/core — type re-exports from @sittir/types
// Core is grammar-agnostic: uses AnyNodeData/AnyTreeNode (loose runtime types).
// Consumers use NodeData<G,K>/TreeNode<G,K> from @sittir/types for grammar-derived typing.

export type {
	AnyNodeData,
	AnyTreeNode,
	RenderTemplate,
	RenderRule,
	TemplateElement,
	ParsedTemplate,
	Edit,
	ByteRange,
	Position,
	CSTNode,
	RenderContext,
	RulesRegistry,
	JoinByMap,
	ReplaceTarget,
	Renderable,
	KindOf,
} from '@sittir/types';
