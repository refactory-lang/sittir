// @generated from packages/rust/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
//
// Each transport's record layout, as rust/crates/sittir-rust/src/render/transport.rs stamps it.

export const RECORD_HEADER_WORDS = 2;

export const records = {
	SourceFileTransport: { words: 9, shebang: { word: 2, width: 5 }, statements: { word: 7, width: 2, run: 5 } },
	ExpressionStatementTransport: { words: 7, content: { word: 2, width: 5 } },
	MacroRuleTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	TokenBindingPatternTransport: { words: 12, name: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	TokenRepetitionPatternTransport: {
		words: 14,
		token_patterns: { word: 2, width: 2, run: 5 },
		separator: { word: 4, width: 5 },
		operator: { word: 9, width: 5 }
	},
	TokenRepetitionTransport: {
		words: 14,
		tokens: { word: 2, width: 2, run: 5 },
		separator: { word: 4, width: 5 },
		operator: { word: 9, width: 5 }
	},
	NonSpecialTokenTransport: { words: 7, content: { word: 2, width: 5 } },
	AttributeItemTransport: { words: 7, content: { word: 2, width: 5 } },
	InnerAttributeItemTransport: { words: 7, content: { word: 2, width: 5 } },
	AttributeTransport: { words: 12, path: { word: 2, width: 5 }, input: { word: 7, width: 5 } },
	DeclarationListTransport: { words: 4, declarations: { word: 2, width: 2, run: 5 } },
	UnionItemTransport: {
		words: 27,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		type_parameters: { word: 12, width: 5 },
		where_clause: { word: 17, width: 5 },
		body: { word: 22, width: 5 }
	},
	EnumItemTransport: {
		words: 27,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		type_parameters: { word: 12, width: 5 },
		where_clause: { word: 17, width: 5 },
		body: { word: 22, width: 5 }
	},
	EnumVariantListTransport: { words: 7, elements: { word: 2, width: 5 } },
	EnumVariantTransport: {
		words: 22,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		body: { word: 12, width: 5 },
		value: { word: 17, width: 5 }
	},
	FieldDeclarationListTransport: { words: 7, elements: { word: 2, width: 5 } },
	FieldDeclarationTransport: {
		words: 17,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		type_: { word: 12, width: 5 }
	},
	OrderedFieldDeclarationListTransport: { words: 7, attributes: { word: 2, width: 5 } },
	ExternCrateDeclarationTransport: {
		words: 17,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		alias: { word: 12, width: 5 }
	},
	ConstItemTransport: {
		words: 22,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		type_: { word: 12, width: 5 },
		value: { word: 17, width: 5 }
	},
	StaticItemTransport: {
		words: 23,
		visibility_modifier: { word: 3, width: 5 },
		by_reference: { word: 2, bit: 0 },
		mutable: { word: 2, bit: 1 },
		name: { word: 8, width: 5 },
		type_: { word: 13, width: 5 },
		value: { word: 18, width: 5 }
	},
	TypeItemTransport: {
		words: 32,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		type_parameters: { word: 12, width: 5 },
		where_clause: { word: 17, width: 5 },
		value: { word: 22, width: 5 },
		trailing_where_clause: { word: 27, width: 5 }
	},
	FunctionItemTransport: {
		words: 42,
		visibility_modifier: { word: 2, width: 5 },
		function_modifiers: { word: 7, width: 5 },
		name: { word: 12, width: 5 },
		type_parameters: { word: 17, width: 5 },
		parameters: { word: 22, width: 5 },
		return_type: { word: 27, width: 5 },
		where_clause: { word: 32, width: 5 },
		body: { word: 37, width: 5 }
	},
	FunctionSignatureItemTransport: {
		words: 37,
		visibility_modifier: { word: 2, width: 5 },
		function_modifiers: { word: 7, width: 5 },
		name: { word: 12, width: 5 },
		type_parameters: { word: 17, width: 5 },
		parameters: { word: 22, width: 5 },
		return_type: { word: 27, width: 5 },
		where_clause: { word: 32, width: 5 }
	},
	FunctionModifiersTransport: { words: 4, modifier: { word: 2, width: 2, run: 5 } },
	WhereClauseTransport: { words: 7, where_predicates: { word: 2, width: 5 } },
	WherePredicateTransport: { words: 12, left: { word: 2, width: 5 }, bounds: { word: 7, width: 5 } },
	TraitItemTransport: {
		words: 33,
		visibility_modifier: { word: 3, width: 5 },
		unsafe_: { word: 2, bit: 0 },
		name: { word: 8, width: 5 },
		type_parameters: { word: 13, width: 5 },
		bounds: { word: 18, width: 5 },
		where_clause: { word: 23, width: 5 },
		body: { word: 28, width: 5 }
	},
	AssociatedTypeTransport: {
		words: 22,
		name: { word: 2, width: 5 },
		type_parameters: { word: 7, width: 5 },
		bounds: { word: 12, width: 5 },
		where_clause: { word: 17, width: 5 }
	},
	TraitBoundsTransport: { words: 4, bounds: { word: 2, width: 2, run: 5 } },
	HigherRankedTraitBoundTransport: { words: 12, type_parameters: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	RemovedTraitBoundTransport: { words: 7, type_: { word: 2, width: 5 } },
	TypeParametersTransport: { words: 7, elements: { word: 2, width: 5 } },
	ConstParameterTransport: {
		words: 17,
		name: { word: 2, width: 5 },
		type_: { word: 7, width: 5 },
		default: { word: 12, width: 5 }
	},
	TypeParameterTransport: {
		words: 17,
		name: { word: 2, width: 5 },
		bounds: { word: 7, width: 5 },
		default: { word: 12, width: 5 }
	},
	LifetimeParameterTransport: { words: 12, name: { word: 2, width: 5 }, bounds: { word: 7, width: 5 } },
	LetDeclarationTransport: {
		words: 23,
		mutable: { word: 2, bit: 0 },
		name: { word: 3, width: 5 },
		type_: { word: 8, width: 5 },
		value: { word: 13, width: 5 },
		alternative: { word: 18, width: 5 }
	},
	UseDeclarationTransport: { words: 12, visibility_modifier: { word: 2, width: 5 }, argument: { word: 7, width: 5 } },
	ScopedUseListTransport: { words: 12, path: { word: 2, width: 5 }, list: { word: 7, width: 5 } },
	UseListTransport: { words: 7, use_clauses: { word: 2, width: 5 } },
	UseAsClauseTransport: { words: 12, name: { word: 2, width: 5 }, alias: { word: 7, width: 5 } },
	UseWildcardTransport: { words: 7, use_wildcard_group: { word: 2, width: 5 } },
	ParametersTransport: { words: 7, elements: { word: 2, width: 5 } },
	SelfParameterTransport: {
		words: 8,
		reference: { word: 2, bit: 0 },
		lifetime: { word: 3, width: 5 },
		mutable: { word: 2, bit: 1 }
	},
	VariadicParameterTransport: { words: 8, mutable: { word: 2, bit: 0 }, pattern: { word: 3, width: 5 } },
	ParameterTransport: {
		words: 13,
		mutable: { word: 2, bit: 0 },
		name: { word: 3, width: 5 },
		type_: { word: 8, width: 5 }
	},
	ExternModifierTransport: { words: 7, abi: { word: 2, width: 5 } },
	VisibilityModifierTransport: { words: 7, content: { word: 2, width: 5 } },
	BracketedTypeTransport: { words: 7, type_: { word: 2, width: 5 } },
	QualifiedTypeTransport: { words: 12, type_: { word: 2, width: 5 }, alias: { word: 7, width: 5 } },
	LifetimeTransport: { words: 7, name: { word: 2, width: 5 } },
	ArrayTypeTransport: { words: 12, element: { word: 2, width: 5 }, length: { word: 7, width: 5 } },
	ForLifetimesTransport: { words: 7, lifetimes: { word: 2, width: 5 } },
	FunctionTypeTransport: {
		words: 22,
		for_lifetimes: { word: 2, width: 5 },
		content: { word: 7, width: 5 },
		parameters: { word: 12, width: 5 },
		return_type: { word: 17, width: 5 }
	},
	TupleTypeTransport: { words: 7, types: { word: 2, width: 5 } },
	GenericFunctionTransport: { words: 12, function: { word: 2, width: 5 }, type_arguments: { word: 7, width: 5 } },
	GenericTypeTransport: { words: 12, type_: { word: 2, width: 5 }, type_arguments: { word: 7, width: 5 } },
	GenericTypeWithTurbofishTransport: { words: 12, type_: { word: 2, width: 5 }, type_arguments: { word: 7, width: 5 } },
	BoundedTypeTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	UseBoundsTransport: { words: 7, bounds: { word: 2, width: 5 } },
	TypeArgumentsTransport: { words: 7, elements: { word: 2, width: 5 } },
	TypeBindingTransport: {
		words: 17,
		name: { word: 2, width: 5 },
		type_arguments: { word: 7, width: 5 },
		type_: { word: 12, width: 5 }
	},
	ReferenceTypeTransport: {
		words: 13,
		lifetime: { word: 3, width: 5 },
		exclusive: { word: 2, bit: 0 },
		type_: { word: 8, width: 5 }
	},
	AbstractTypeTransport: { words: 12, type_parameters: { word: 2, width: 5 }, trait_: { word: 7, width: 5 } },
	DynamicTypeTransport: { words: 7, trait_: { word: 2, width: 5 } },
	MacroInvocationTransport: { words: 12, function: { word: 2, width: 5 }, arguments: { word: 7, width: 5 } },
	ScopedIdentifierTransport: { words: 12, path: { word: 2, width: 5 }, name: { word: 7, width: 5 } },
	ScopedTypeIdentifierInExpressionPositionTransport: {
		words: 12,
		path: { word: 2, width: 5 },
		name: { word: 7, width: 5 }
	},
	ScopedTypeIdentifierTransport: { words: 12, path: { word: 2, width: 5 }, name: { word: 7, width: 5 } },
	UnaryExpressionTransport: { words: 12, operator: { word: 2, width: 5 }, argument: { word: 7, width: 5 } },
	TryExpressionTransport: { words: 7, argument: { word: 2, width: 5 } },
	BinaryExpressionTransport: {
		words: 17,
		left: { word: 2, width: 5 },
		operator: { word: 7, width: 5 },
		right: { word: 12, width: 5 }
	},
	AssignmentExpressionTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	CompoundAssignmentExprTransport: {
		words: 17,
		left: { word: 2, width: 5 },
		operator: { word: 7, width: 5 },
		right: { word: 12, width: 5 }
	},
	TypeCastExpressionTransport: { words: 12, expression: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	ReturnExpressionTransport: { words: 7, expression: { word: 2, width: 5 } },
	YieldExpressionTransport: { words: 7, expression: { word: 2, width: 5 } },
	CallExpressionTransport: { words: 12, function: { word: 2, width: 5 }, arguments: { word: 7, width: 5 } },
	ArgumentsTransport: { words: 7, elements: { word: 2, width: 5 } },
	ParenthesizedExpressionTransport: { words: 7, expression: { word: 2, width: 5 } },
	TupleExpressionTransport: { words: 9, attributes: { word: 2, width: 2, run: 5 }, elements: { word: 4, width: 5 } },
	StructExpressionTransport: { words: 12, name: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	FieldInitializerListTransport: { words: 7, initializers: { word: 2, width: 5 } },
	ShorthandFieldInitializerTransport: {
		words: 9,
		attributes: { word: 2, width: 2, run: 5 },
		field: { word: 4, width: 5 }
	},
	FieldInitializerTransport: {
		words: 14,
		attributes: { word: 2, width: 2, run: 5 },
		field: { word: 4, width: 5 },
		value: { word: 9, width: 5 }
	},
	BaseFieldInitializerTransport: { words: 7, value: { word: 2, width: 5 } },
	IfExpressionTransport: {
		words: 17,
		condition: { word: 2, width: 5 },
		consequence: { word: 7, width: 5 },
		alternative: { word: 12, width: 5 }
	},
	LetConditionTransport: { words: 12, pattern: { word: 2, width: 5 }, value: { word: 7, width: 5 } },
	LetChainTransport: { words: 9, left: { word: 2, width: 5 }, right: { word: 7, width: 2, run: 5 } },
	ElseClauseTransport: { words: 7, body: { word: 2, width: 5 } },
	MatchExpressionTransport: { words: 12, subject: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	MatchBlockTransport: { words: 7, match_block_arms: { word: 2, width: 5 } },
	LastMatchArmTransport: {
		words: 15,
		attributes: { word: 3, width: 2, run: 5 },
		pattern: { word: 5, width: 5 },
		value: { word: 10, width: 5 },
		comma: { word: 2, bit: 0 }
	},
	MatchPatternTransport: { words: 12, pattern: { word: 2, width: 5 }, condition: { word: 7, width: 5 } },
	WhileExpressionTransport: {
		words: 17,
		label: { word: 2, width: 5 },
		condition: { word: 7, width: 5 },
		body: { word: 12, width: 5 }
	},
	LoopExpressionTransport: { words: 12, label: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	ForExpressionTransport: {
		words: 22,
		label: { word: 2, width: 5 },
		left: { word: 7, width: 5 },
		right: { word: 12, width: 5 },
		body: { word: 17, width: 5 }
	},
	ConstBlockTransport: { words: 7, body: { word: 2, width: 5 } },
	ClosureParametersTransport: { words: 4, parameters: { word: 2, width: 2, run: 5 } },
	LabelTransport: { words: 7, name: { word: 2, width: 5 } },
	BreakExpressionTransport: { words: 12, label: { word: 2, width: 5 }, expression: { word: 7, width: 5 } },
	ContinueExpressionTransport: { words: 7, label: { word: 2, width: 5 } },
	IndexExpressionTransport: { words: 12, object: { word: 2, width: 5 }, index: { word: 7, width: 5 } },
	AwaitExpressionTransport: { words: 7, expression: { word: 2, width: 5 } },
	FieldExpressionTransport: { words: 12, object: { word: 2, width: 5 }, property: { word: 7, width: 5 } },
	UnsafeBlockTransport: { words: 7, body: { word: 2, width: 5 } },
	AsyncBlockTransport: { words: 8, move_: { word: 2, bit: 0 }, body: { word: 3, width: 5 } },
	GenBlockTransport: { words: 8, move_: { word: 2, bit: 0 }, body: { word: 3, width: 5 } },
	TryBlockTransport: { words: 7, body: { word: 2, width: 5 } },
	BlockTransport: {
		words: 14,
		label: { word: 2, width: 5 },
		statements: { word: 7, width: 2, run: 5 },
		trailing_expression: { word: 9, width: 5 }
	},
	GenericPatternTransport: { words: 12, name: { word: 2, width: 5 }, type_arguments: { word: 7, width: 5 } },
	TuplePatternTransport: { words: 7, elements: { word: 2, width: 5 } },
	SlicePatternTransport: { words: 7, elements: { word: 2, width: 5 } },
	TupleStructPatternTransport: { words: 12, type_: { word: 2, width: 5 }, patterns: { word: 7, width: 5 } },
	StructPatternTransport: { words: 12, type_: { word: 2, width: 5 }, fields: { word: 7, width: 5 } },
	MutPatternTransport: { words: 7, pattern: { word: 2, width: 5 } },
	RefPatternTransport: { words: 7, pattern: { word: 2, width: 5 } },
	CapturedPatternTransport: { words: 12, name: { word: 2, width: 5 }, pattern: { word: 7, width: 5 } },
	ReferencePatternTransport: { words: 8, exclusive: { word: 2, bit: 0 }, pattern: { word: 3, width: 5 } },
	NegativeLiteralTransport: { words: 7, value: { word: 2, width: 5 } },
	StringLiteralTransport: { words: 9, string_open: { word: 2, width: 5 }, elements: { word: 7, width: 2, run: 5 } },
	RawStringLiteralTransport: {
		words: 17,
		raw_string_literal_start: { word: 2, width: 5 },
		string_content: { word: 7, width: 5 },
		raw_string_literal_end: { word: 12, width: 5 }
	},
	LineCommentTransport: { words: 7, content: { word: 2, width: 5 } },
	BlockCommentTransport: { words: 7, content: { word: 2, width: 5 } },
	IdentifierTransport: { words: 2 },
	ShebangTransport: { words: 6, content: { word: 2, width: 4 } },
	MetavariableTransport: { words: 6, name: { word: 2, width: 4 } },
	MacroRulesTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	EnumVariantListElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	FieldDeclarationListElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	OrderedFieldDeclarationListElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	WherePredicatesTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	TypeParametersElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	UseClausesTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	ParametersElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	LifetimesTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	TypesTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	UseBoundsElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	TypeArgumentsElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	ArgumentsElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	ExpressionsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	FieldInitializerListElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	TuplePatternElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	PatternsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	StructPatternElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	UseWildcardGroupTransport: { words: 7, path: { word: 2, width: 5 } },
	TokenRepetitionPatternTextTransport: { words: 2 },
	StringOpenTransport: { words: 2 },
	IntegerLiteralDecimalTransport: { words: 10, content: { word: 2, width: 4 }, suffix: { word: 6, width: 4 } },
	IntegerLiteralHexTransport: { words: 10, content: { word: 2, width: 4 }, suffix: { word: 6, width: 4 } },
	IntegerLiteralBinaryTransport: { words: 10, content: { word: 2, width: 4 }, suffix: { word: 6, width: 4 } },
	IntegerLiteralOctalTransport: { words: 10, content: { word: 2, width: 4 }, suffix: { word: 6, width: 4 } },
	CharLiteralPlainTransport: { words: 7, byte: { word: 2, bit: 0 }, content: { word: 3, width: 4 } },
	CharLiteralEmptyTransport: { words: 2 },
	CharLiteralEscapedSimpleTransport: { words: 7, byte: { word: 2, bit: 0 }, content: { word: 3, width: 4 } },
	CharLiteralEscapedUnicodeFixedTransport: { words: 7, byte: { word: 2, bit: 0 }, content: { word: 3, width: 4 } },
	CharLiteralEscapedUnicodeBracedTransport: { words: 7, byte: { word: 2, bit: 0 }, content: { word: 3, width: 4 } },
	CharLiteralEscapedHexTransport: { words: 7, byte: { word: 2, bit: 0 }, content: { word: 3, width: 4 } },
	EscapeSequenceSimpleTransport: { words: 6, content: { word: 2, width: 4 } },
	EscapeSequenceUnicodeFixedTransport: { words: 6, content: { word: 2, width: 4 } },
	EscapeSequenceUnicodeBracedTransport: { words: 6, content: { word: 2, width: 4 } },
	EscapeSequenceHexTransport: { words: 6, content: { word: 2, width: 4 } },
	ArrayExpressionSemiTransport: {
		words: 14,
		attributes: { word: 2, width: 2, run: 5 },
		element: { word: 4, width: 5 },
		length: { word: 9, width: 5 }
	},
	ArrayExpressionListTransport: {
		words: 9,
		attributes: { word: 2, width: 2, run: 5 },
		elements: { word: 4, width: 5 }
	},
	AttributeInputTransport: { words: 12, value: { word: 2, width: 5 }, arguments: { word: 7, width: 5 } },
	ClosureExpressionBlockTransport: {
		words: 18,
		static_: { word: 2, bit: 0 },
		async_: { word: 2, bit: 1 },
		move_: { word: 2, bit: 2 },
		parameters: { word: 3, width: 5 },
		return_type: { word: 8, width: 5 },
		body: { word: 13, width: 5 }
	},
	ClosureExpressionExprTransport: {
		words: 13,
		static_: { word: 2, bit: 0 },
		async_: { word: 2, bit: 1 },
		move_: { word: 2, bit: 2 },
		parameters: { word: 3, width: 5 },
		body: { word: 8, width: 5 }
	},
	ReferenceExpressionRawConstTransport: { words: 7, value: { word: 2, width: 5 } },
	ReferenceExpressionRawMutTransport: { words: 7, value: { word: 2, width: 5 } },
	ReferenceExpressionMutTransport: { words: 7, value: { word: 2, width: 5 } },
	ReferenceExpressionBareTransport: { words: 7, value: { word: 2, width: 5 } },
	ImplItemPositiveClauseTransport: { words: 7, trait_: { word: 2, width: 5 } },
	ImplItemNegativeClauseTransport: { words: 7, trait_: { word: 2, width: 5 } },
	ImplItemBodyTransport: {
		words: 28,
		unsafe_: { word: 2, bit: 0 },
		type_parameters: { word: 3, width: 5 },
		trait_clause: { word: 8, width: 5 },
		type_: { word: 13, width: 5 },
		where_clause: { word: 18, width: 5 },
		body: { word: 23, width: 5 }
	},
	ImplItemSemiTransport: {
		words: 23,
		unsafe_: { word: 2, bit: 0 },
		type_parameters: { word: 3, width: 5 },
		trait_clause: { word: 8, width: 5 },
		type_: { word: 13, width: 5 },
		where_clause: { word: 18, width: 5 }
	},
	VisibilityModifierPubScopeInPathTransport: { words: 7, path: { word: 2, width: 5 } },
	VisibilityModifierPubScopeTransport: { words: 7, content: { word: 2, width: 5 } },
	VisibilityModifierPubTransport: { words: 7, visibility_modifier_pub_scope: { word: 2, width: 5 } },
	FunctionTypeTraitFormTransport: { words: 7, trait_: { word: 2, width: 5 } },
	FunctionTypeFnFormTransport: { words: 7, function_modifiers: { word: 2, width: 5 } },
	ModItemExternalTransport: { words: 12, visibility_modifier: { word: 2, width: 5 }, name: { word: 7, width: 5 } },
	ModItemInlineTransport: {
		words: 17,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		body: { word: 12, width: 5 }
	},
	OrPatternBinaryTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	OrPatternPrefixTransport: { words: 7, right: { word: 2, width: 5 } },
	PointerTypeConstTransport: { words: 7, type_: { word: 2, width: 5 } },
	PointerTypeMutTransport: { words: 7, type_: { word: 2, width: 5 } },
	RangeExpressionBinaryTransport: {
		words: 17,
		start: { word: 2, width: 5 },
		operator: { word: 7, width: 5 },
		end: { word: 12, width: 5 }
	},
	RangeExpressionPostfixTransport: { words: 7, start: { word: 2, width: 5 } },
	RangeExpressionPrefixTransport: { words: 7, end: { word: 2, width: 5 } },
	RangeExpressionBareTransport: { words: 7, range_expression_bare: { word: 2, width: 5 } },
	ExpressionStatementWithSemiTransport: { words: 7, expression: { word: 2, width: 5 } },
	ForeignModItemSemiTransport: {
		words: 12,
		visibility_modifier: { word: 2, width: 5 },
		extern_modifier: { word: 7, width: 5 }
	},
	ForeignModItemBodyTransport: {
		words: 17,
		visibility_modifier: { word: 2, width: 5 },
		extern_modifier: { word: 7, width: 5 },
		body: { word: 12, width: 5 }
	},
	MatchArmWithCommaTransport: {
		words: 14,
		attributes: { word: 2, width: 2, run: 5 },
		pattern: { word: 4, width: 5 },
		value: { word: 9, width: 5 }
	},
	MatchArmBlockEndingTransport: {
		words: 14,
		attributes: { word: 2, width: 2, run: 5 },
		pattern: { word: 4, width: 5 },
		value: { word: 9, width: 5 }
	},
	LineCommentExtraSlashesTransport: { words: 2 },
	LineCommentDocOuterTransport: { words: 7, doc: { word: 2, width: 5 } },
	LineCommentDocInnerTransport: { words: 7, doc: { word: 2, width: 5 } },
	LineCommentRegularTransport: { words: 2 },
	BlockCommentDocOuterTransport: { words: 7, doc: { word: 2, width: 5 } },
	BlockCommentDocInnerTransport: { words: 7, doc: { word: 2, width: 5 } },
	BlockCommentRegularTransport: { words: 2 },
	TokenTreePatternParenTransport: { words: 4, token_patterns: { word: 2, width: 2, run: 5 } },
	TokenTreePatternBracketTransport: { words: 4, token_patterns: { word: 2, width: 2, run: 5 } },
	TokenTreePatternBraceTransport: { words: 4, token_patterns: { word: 2, width: 2, run: 5 } },
	TokenTreeParenTransport: { words: 4, tokens: { word: 2, width: 2, run: 5 } },
	TokenTreeBracketTransport: { words: 4, tokens: { word: 2, width: 2, run: 5 } },
	TokenTreeBraceTransport: { words: 4, tokens: { word: 2, width: 2, run: 5 } },
	DelimTokenTreeParenTransport: { words: 4, delim_tokens: { word: 2, width: 2, run: 5 } },
	DelimTokenTreeBracketTransport: { words: 4, delim_tokens: { word: 2, width: 2, run: 5 } },
	DelimTokenTreeBraceTransport: { words: 4, delim_tokens: { word: 2, width: 2, run: 5 } },
	FieldPatternShorthandTransport: {
		words: 8,
		ref_: { word: 2, bit: 0 },
		mutable: { word: 2, bit: 1 },
		name: { word: 3, width: 5 }
	},
	FieldPatternNamedTransport: {
		words: 13,
		ref_: { word: 2, bit: 0 },
		mutable: { word: 2, bit: 1 },
		name: { word: 3, width: 5 },
		pattern: { word: 8, width: 5 }
	},
	MacroDefinitionParenTransport: { words: 12, name: { word: 2, width: 5 }, macro_rules: { word: 7, width: 5 } },
	MacroDefinitionBracketTransport: { words: 12, name: { word: 2, width: 5 }, macro_rules: { word: 7, width: 5 } },
	MacroDefinitionBraceTransport: { words: 12, name: { word: 2, width: 5 }, macro_rules: { word: 7, width: 5 } },
	RangePatternPrefixTransport: { words: 12, content: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	RangePatternWithLeftWithRightTransport: { words: 12, content: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	RangePatternWithLeftTransport: { words: 12, left: { word: 2, width: 5 }, content: { word: 7, width: 5 } },
	StructItemBraceTransport: {
		words: 27,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		type_parameters: { word: 12, width: 5 },
		where_clause: { word: 17, width: 5 },
		body: { word: 22, width: 5 }
	},
	StructItemTupleTransport: {
		words: 27,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		type_parameters: { word: 12, width: 5 },
		body: { word: 17, width: 5 },
		where_clause: { word: 22, width: 5 }
	},
	StructItemUnitTransport: {
		words: 17,
		visibility_modifier: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		type_parameters: { word: 12, width: 5 }
	},
	AttributedFieldDeclarationTransport: {
		words: 9,
		attribute_item: { word: 2, width: 2, run: 5 },
		field_declaration: { word: 4, width: 5 }
	},
	AttributedEnumVariantTransport: {
		words: 9,
		attribute_item: { word: 2, width: 2, run: 5 },
		enum_variant: { word: 4, width: 5 }
	},
	AttributedParameterTransport: { words: 12, attribute_item: { word: 2, width: 5 }, content: { word: 7, width: 5 } },
	AttributedTypeParameterTransport: {
		words: 9,
		attribute_item: { word: 2, width: 2, run: 5 },
		content: { word: 4, width: 5 }
	},
	AttributedArgumentTransport: {
		words: 9,
		attribute_item: { word: 2, width: 2, run: 5 },
		expression: { word: 4, width: 5 }
	},
	AttributedOrderedFieldTransport: {
		words: 14,
		attribute_item: { word: 2, width: 2, run: 5 },
		visibility_modifier: { word: 4, width: 5 },
		type_: { word: 9, width: 5 }
	},
	TypeArgumentTransport: { words: 12, content: { word: 2, width: 5 }, trait_bounds: { word: 7, width: 5 } },
	MatchBlockArmsTransport: { words: 9, arms: { word: 2, width: 2, run: 5 }, last_arm: { word: 4, width: 5 } },
	FloatLiteralTransport: { words: 2 },
	StringContentTransport: { words: 2 },
	RawStringLiteralContentTransport: { words: 2 },
	RawStringLiteralStartTransport: { words: 2 },
	RawStringLiteralEndTransport: { words: 2 },
	DocCommentTransport: { words: 2 },
	BlockCommentContentTransport: { words: 2 },
	ReceiverParameterDeclarationTransport: { words: 8, mutable: { word: 2, bit: 0 }, type_: { word: 3, width: 5 } },
	AttributedParameterReceiverTransport: {
		words: 12,
		attribute_item: { word: 2, width: 5 },
		content: { word: 7, width: 5 }
	},
	ParametersElementsReceiverTransport: {
		words: 12,
		receiver: { word: 2, width: 5 },
		parameters_elements_receiver_group: { word: 7, width: 5 }
	},
	ParametersElementsReceiverGroupTransport: { words: 7, elements: { word: 2, width: 5 } },
	ErrorSentinelTransport: { words: 2 },
	TypeIdentifierTransport: { words: 7, content: { word: 2, width: 5 } },
	FieldIdentifierTransport: { words: 7, content: { word: 2, width: 5 } },
	ShorthandFieldIdentifierTransport: { words: 7, content: { word: 2, width: 5 } }
} as const;
