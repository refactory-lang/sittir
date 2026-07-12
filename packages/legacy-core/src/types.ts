// @sittir/legacy-core — type re-exports from @sittir/types
// Core is grammar-agnostic: uses AnyNodeData/AnyTreeNode (loose runtime types).
// Consumers use NodeData<G,K>/TreeNode<G,K> from @sittir/types for grammar-derived typing.

export type {
	AnyNodeData,
	AnyTreeNode,
	TemplateRule,
	TemplateRuleObject,
	RulesConfig,
	Edit,
	ByteRange,
	Position,
	CSTNode,
	FormatBoundary,
	FormatSlot,
	FormatLiteral,
	FormatTrivia,
	FormatRecord,
	KindFormatRecord,
	NodeTrivia,
	NativeParseResult,
	RenderContext,
	ReplaceTarget,
	Renderable,
	KindOf
} from '@sittir/types';

// NOTE: NodeId is kept as a deprecated `number` alias (ADR-0017).
// New code should use plain `number` for $nodeHandle / $childIndex.
