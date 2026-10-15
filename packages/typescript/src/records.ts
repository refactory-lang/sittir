// @generated from packages/typescript/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
//
// Each transport's record layout, as rust/crates/sittir-typescript/src/render/transport.rs stamps it.

export const RECORD_HEADER_WORDS = 2;

export const records = {
	ProgramTransport: { words: 9, hash_bang_line: { word: 2, width: 5 }, statements: { word: 7, width: 2, run: 5 } },
	HashBangLineTransport: { words: 6, content: { word: 2, width: 4 } },
	NamespaceExportTransport: { words: 7, module_export_name: { word: 2, width: 5 } },
	ExportClauseTransport: { words: 7, export_specifiers: { word: 2, width: 5 } },
	ExportSpecifierTransport: {
		words: 17,
		export_kind: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		alias: { word: 12, width: 5 }
	},
	ImportStatementTransport: {
		words: 22,
		import_clause: { word: 2, width: 5 },
		from_clause: { word: 7, width: 5 },
		import_attribute: { word: 12, width: 5 },
		terminator: { word: 17, width: 5 }
	},
	ImportClauseTransport: { words: 7, content: { word: 2, width: 5 } },
	NamespaceImportTransport: { words: 7, name: { word: 2, width: 5 } },
	NamedImportsTransport: { words: 7, import_specifiers: { word: 2, width: 5 } },
	ImportAttributeTransport: { words: 12, attribute_kind: { word: 2, width: 5 }, object: { word: 7, width: 5 } },
	ExpressionStatementTransport: { words: 12, expression: { word: 2, width: 5 }, terminator: { word: 7, width: 5 } },
	VariableDeclarationTransport: {
		words: 9,
		declarators: { word: 2, width: 2, run: 5 },
		terminator: { word: 4, width: 5 }
	},
	LexicalDeclarationTransport: {
		words: 14,
		kind: { word: 2, width: 5 },
		declarators: { word: 7, width: 2, run: 5 },
		terminator: { word: 9, width: 5 }
	},
	UsingDeclarationTransport: {
		words: 14,
		kind: { word: 2, width: 5 },
		variable_declarator: { word: 7, width: 2, run: 5 },
		automatic_semicolon: { word: 9, width: 5 }
	},
	StatementBlockTransport: { words: 9, statements: { word: 2, width: 2, run: 5 }, terminator: { word: 4, width: 5 } },
	ElseClauseTransport: { words: 7, body: { word: 2, width: 5 } },
	IfStatementTransport: {
		words: 17,
		condition: { word: 2, width: 5 },
		consequence: { word: 7, width: 5 },
		alternative: { word: 12, width: 5 }
	},
	SwitchStatementTransport: { words: 12, value: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	ForStatementTransport: {
		words: 22,
		initializer: { word: 2, width: 5 },
		condition: { word: 7, width: 5 },
		increment: { word: 12, width: 5 },
		body: { word: 17, width: 5 }
	},
	ForInStatementTransport: {
		words: 13,
		await_: { word: 2, bit: 0 },
		for_header: { word: 3, width: 5 },
		body: { word: 8, width: 5 }
	},
	WhileStatementTransport: { words: 12, condition: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	DoStatementTransport: {
		words: 17,
		body: { word: 2, width: 5 },
		condition: { word: 7, width: 5 },
		terminator: { word: 12, width: 5 }
	},
	TryStatementTransport: {
		words: 17,
		body: { word: 2, width: 5 },
		handler: { word: 7, width: 5 },
		finalizer: { word: 12, width: 5 }
	},
	WithStatementTransport: { words: 12, object: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	BreakStatementTransport: { words: 12, label: { word: 2, width: 5 }, terminator: { word: 7, width: 5 } },
	ContinueStatementTransport: { words: 12, label: { word: 2, width: 5 }, terminator: { word: 7, width: 5 } },
	DebuggerStatementTransport: { words: 7, terminator: { word: 2, width: 5 } },
	ReturnStatementTransport: { words: 12, expression: { word: 2, width: 5 }, terminator: { word: 7, width: 5 } },
	ThrowStatementTransport: { words: 12, expression: { word: 2, width: 5 }, terminator: { word: 7, width: 5 } },
	LabeledStatementTransport: { words: 12, label: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	SwitchBodyTransport: { words: 4, cases: { word: 2, width: 2, run: 5 } },
	SwitchCaseTransport: { words: 9, value: { word: 2, width: 5 }, body: { word: 7, width: 2, run: 5 } },
	SwitchDefaultTransport: { words: 4, body: { word: 2, width: 2, run: 5 } },
	CatchClauseTransport: { words: 12, catch_clause_group: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	FinallyClauseTransport: { words: 7, body: { word: 2, width: 5 } },
	YieldExpressionTransport: { words: 7, expression: { word: 2, width: 5 } },
	ObjectTransport: { words: 4, properties: { word: 2, width: 2, run: 5 } },
	ObjectPatternTransport: { words: 4, properties: { word: 2, width: 2, run: 5 } },
	AssignmentPatternTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	ObjectAssignmentPatternTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	ArrayTransport: { words: 4, elements: { word: 2, width: 2, run: 5 } },
	ArrayPatternTransport: { words: 4, elements: { word: 2, width: 2, run: 5 } },
	NestedIdentifierTransport: { words: 12, object: { word: 2, width: 5 }, property: { word: 7, width: 5 } },
	ClassTransport: {
		words: 24,
		decorator: { word: 2, width: 2, run: 5 },
		name: { word: 4, width: 5 },
		type_parameters: { word: 9, width: 5 },
		heritage: { word: 14, width: 5 },
		body: { word: 19, width: 5 }
	},
	ClassDeclarationTransport: {
		words: 29,
		decorator: { word: 2, width: 2, run: 5 },
		name: { word: 4, width: 5 },
		type_parameters: { word: 9, width: 5 },
		heritage: { word: 14, width: 5 },
		body: { word: 19, width: 5 },
		terminator: { word: 24, width: 5 }
	},
	ClassHeritageTransport: { words: 7, content: { word: 2, width: 5 } },
	FunctionExpressionTransport: {
		words: 28,
		async_: { word: 2, bit: 0 },
		name: { word: 3, width: 5 },
		type_parameters: { word: 8, width: 5 },
		parameters: { word: 13, width: 5 },
		return_type: { word: 18, width: 5 },
		body: { word: 23, width: 5 }
	},
	FunctionDeclarationTransport: {
		words: 33,
		async_: { word: 2, bit: 0 },
		name: { word: 3, width: 5 },
		type_parameters: { word: 8, width: 5 },
		parameters: { word: 13, width: 5 },
		return_type: { word: 18, width: 5 },
		body: { word: 23, width: 5 },
		terminator: { word: 28, width: 5 }
	},
	GeneratorFunctionTransport: {
		words: 28,
		async_: { word: 2, bit: 0 },
		name: { word: 3, width: 5 },
		type_parameters: { word: 8, width: 5 },
		parameters: { word: 13, width: 5 },
		return_type: { word: 18, width: 5 },
		body: { word: 23, width: 5 }
	},
	GeneratorFunctionDeclarationTransport: {
		words: 33,
		async_: { word: 2, bit: 0 },
		name: { word: 3, width: 5 },
		type_parameters: { word: 8, width: 5 },
		parameters: { word: 13, width: 5 },
		return_type: { word: 18, width: 5 },
		body: { word: 23, width: 5 },
		terminator: { word: 28, width: 5 }
	},
	ArrowFunctionTransport: {
		words: 13,
		async_: { word: 2, bit: 0 },
		content: { word: 3, width: 5 },
		body: { word: 8, width: 5 }
	},
	NewExpressionTransport: {
		words: 17,
		constructor: { word: 2, width: 5 },
		type_arguments: { word: 7, width: 5 },
		arguments: { word: 12, width: 5 }
	},
	AwaitExpressionTransport: { words: 7, expression: { word: 2, width: 5 } },
	MemberExpressionTransport: {
		words: 17,
		object: { word: 2, width: 5 },
		separator: { word: 7, width: 5 },
		property: { word: 12, width: 5 }
	},
	SubscriptExpressionTransport: {
		words: 13,
		object: { word: 3, width: 5 },
		optional_chain: { word: 2, bit: 0 },
		index: { word: 8, width: 5 }
	},
	LhsExpressionTransport: { words: 7, content: { word: 2, width: 5 } },
	AssignmentExpressionTransport: {
		words: 13,
		using: { word: 2, bit: 0 },
		left: { word: 3, width: 5 },
		right: { word: 8, width: 5 }
	},
	AugmentedAssignmentExpressionTransport: {
		words: 17,
		left: { word: 2, width: 5 },
		operator: { word: 7, width: 5 },
		right: { word: 12, width: 5 }
	},
	SpreadElementTransport: { words: 7, expression: { word: 2, width: 5 } },
	TernaryExpressionTransport: {
		words: 17,
		condition: { word: 2, width: 5 },
		consequence: { word: 7, width: 5 },
		alternative: { word: 12, width: 5 }
	},
	BinaryExpressionTransport: {
		words: 22,
		left: { word: 2, width: 5 },
		operator: { word: 7, width: 5 },
		right: { word: 12, width: 5 },
		binary_expression_in: { word: 17, width: 5 }
	},
	UnaryExpressionTransport: { words: 12, operator: { word: 2, width: 5 }, argument: { word: 7, width: 5 } },
	SequenceExpressionTransport: { words: 4, expression: { word: 2, width: 2, run: 5 } },
	UnescapedDoubleStringFragmentTransport: { words: 2 },
	UnescapedSingleStringFragmentTransport: { words: 2 },
	EscapeSequenceTransport: { words: 6, content: { word: 2, width: 4 } },
	TemplateStringTransport: { words: 4, elements: { word: 2, width: 2, run: 5 } },
	TemplateSubstitutionTransport: { words: 7, expression: { word: 2, width: 5 } },
	RegexTransport: { words: 12, pattern: { word: 2, width: 5 }, flags: { word: 7, width: 5 } },
	RegexPatternTransport: { words: 2 },
	RegexFlagsTransport: { words: 2 },
	IdentifierTransport: { words: 2 },
	PrivatePropertyIdentifierTransport: { words: 6, content: { word: 2, width: 4 } },
	ArgumentsTransport: { words: 4, elements: { word: 2, width: 2, run: 5 } },
	DecoratorTransport: { words: 7, expression: { word: 2, width: 5 } },
	DecoratorMemberExpressionTransport: { words: 12, object: { word: 2, width: 5 }, property: { word: 7, width: 5 } },
	DecoratorCallExpressionTransport: {
		words: 17,
		function: { word: 2, width: 5 },
		type_arguments: { word: 7, width: 5 },
		arguments: { word: 12, width: 5 }
	},
	ClassBodyTransport: { words: 4, members: { word: 2, width: 2, run: 5 } },
	FormalParametersTransport: { words: 7, elements: { word: 2, width: 5 } },
	ClassStaticBlockTransport: { words: 12, terminator: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	RestPatternTransport: { words: 7, lhs_expression: { word: 2, width: 5 } },
	MethodDefinitionTransport: {
		words: 38,
		accessibility_modifier: { word: 3, width: 5 },
		static_: { word: 2, bit: 0 },
		override_: { word: 2, bit: 1 },
		readonly: { word: 2, bit: 2 },
		async_: { word: 2, bit: 3 },
		accessor_kind: { word: 8, width: 5 },
		name: { word: 13, width: 5 },
		optional: { word: 2, bit: 4 },
		type_parameters: { word: 18, width: 5 },
		parameters: { word: 23, width: 5 },
		return_type: { word: 28, width: 5 },
		body: { word: 33, width: 5 }
	},
	PairTransport: { words: 12, key: { word: 2, width: 5 }, value: { word: 7, width: 5 } },
	PairPatternTransport: { words: 12, key: { word: 2, width: 5 }, value: { word: 7, width: 5 } },
	ComputedPropertyNameTransport: { words: 7, expression: { word: 2, width: 5 } },
	PublicFieldDefinitionTransport: {
		words: 30,
		decorator: { word: 3, width: 2, run: 5 },
		declare: { word: 2, bit: 0 },
		accessibility_modifier: { word: 5, width: 5 },
		static_: { word: 2, bit: 1 },
		override_: { word: 2, bit: 2 },
		readonly: { word: 2, bit: 3 },
		abstract_: { word: 2, bit: 4 },
		accessor: { word: 2, bit: 5 },
		name: { word: 10, width: 5 },
		optionality: { word: 15, width: 5 },
		type_: { word: 20, width: 5 },
		value: { word: 25, width: 5 }
	},
	NonNullExpressionTransport: { words: 7, expression: { word: 2, width: 5 } },
	MethodSignatureTransport: {
		words: 33,
		accessibility_modifier: { word: 3, width: 5 },
		static_: { word: 2, bit: 0 },
		override_: { word: 2, bit: 1 },
		readonly: { word: 2, bit: 2 },
		async_: { word: 2, bit: 3 },
		accessor_kind: { word: 8, width: 5 },
		name: { word: 13, width: 5 },
		optional: { word: 2, bit: 4 },
		type_parameters: { word: 18, width: 5 },
		parameters: { word: 23, width: 5 },
		return_type: { word: 28, width: 5 }
	},
	AbstractMethodSignatureTransport: {
		words: 33,
		accessibility_modifier: { word: 3, width: 5 },
		override_: { word: 2, bit: 0 },
		accessor_kind: { word: 8, width: 5 },
		name: { word: 13, width: 5 },
		optional: { word: 2, bit: 1 },
		type_parameters: { word: 18, width: 5 },
		parameters: { word: 23, width: 5 },
		return_type: { word: 28, width: 5 }
	},
	FunctionSignatureTransport: {
		words: 28,
		async_: { word: 2, bit: 0 },
		name: { word: 3, width: 5 },
		type_parameters: { word: 8, width: 5 },
		parameters: { word: 13, width: 5 },
		return_type: { word: 18, width: 5 },
		terminator: { word: 23, width: 5 }
	},
	DecoratorParenthesizedExpressionTransport: { words: 7, expression: { word: 2, width: 5 } },
	TypeAssertionTransport: { words: 12, type_arguments: { word: 2, width: 5 }, expression: { word: 7, width: 5 } },
	AsExpressionTransport: { words: 12, expression: { word: 2, width: 5 }, type_annotation: { word: 7, width: 5 } },
	SatisfiesExpressionTransport: {
		words: 12,
		expression: { word: 2, width: 5 },
		type_annotation: { word: 7, width: 5 }
	},
	InstantiationExpressionTransport: {
		words: 12,
		expression: { word: 2, width: 5 },
		type_arguments: { word: 7, width: 5 }
	},
	ImportRequireClauseTransport: { words: 12, name: { word: 2, width: 5 }, source: { word: 7, width: 5 } },
	ExtendsClauseTransport: { words: 4, types: { word: 2, width: 2, run: 5 } },
	ExtendsClauseSingleTransport: { words: 12, value: { word: 2, width: 5 }, type_arguments: { word: 7, width: 5 } },
	ImplementsClauseTransport: { words: 4, type_: { word: 2, width: 2, run: 5 } },
	AmbientDeclarationTransport: { words: 7, content: { word: 2, width: 5 } },
	AbstractClassDeclarationTransport: {
		words: 24,
		decorator: { word: 2, width: 2, run: 5 },
		name: { word: 4, width: 5 },
		type_parameters: { word: 9, width: 5 },
		heritage: { word: 14, width: 5 },
		body: { word: 19, width: 5 }
	},
	ModuleTransport: { words: 12, name: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	InternalModuleTransport: { words: 12, name: { word: 2, width: 5 }, body: { word: 7, width: 5 } },
	ImportAliasTransport: {
		words: 17,
		name: { word: 2, width: 5 },
		value: { word: 7, width: 5 },
		terminator: { word: 12, width: 5 }
	},
	NestedTypeIdentifierTransport: { words: 12, module: { word: 2, width: 5 }, name: { word: 7, width: 5 } },
	InterfaceDeclarationTransport: {
		words: 22,
		name: { word: 2, width: 5 },
		type_parameters: { word: 7, width: 5 },
		extends_type_clause: { word: 12, width: 5 },
		body: { word: 17, width: 5 }
	},
	ExtendsTypeClauseTransport: { words: 4, type_: { word: 2, width: 2, run: 5 } },
	EnumDeclarationTransport: {
		words: 13,
		const_: { word: 2, bit: 0 },
		name: { word: 3, width: 5 },
		body: { word: 8, width: 5 }
	},
	EnumBodyTransport: { words: 7, elements: { word: 2, width: 5 } },
	EnumAssignmentTransport: { words: 12, name: { word: 2, width: 5 }, value: { word: 7, width: 5 } },
	TypeAliasDeclarationTransport: {
		words: 22,
		name: { word: 2, width: 5 },
		type_parameters: { word: 7, width: 5 },
		value: { word: 12, width: 5 },
		terminator: { word: 17, width: 5 }
	},
	RequiredParameterTransport: {
		words: 25,
		decorator: { word: 3, width: 2, run: 5 },
		accessibility_modifier: { word: 5, width: 5 },
		override_: { word: 2, bit: 0 },
		readonly: { word: 2, bit: 1 },
		pattern: { word: 10, width: 5 },
		type_: { word: 15, width: 5 },
		value: { word: 20, width: 5 }
	},
	OptionalParameterTransport: {
		words: 25,
		decorator: { word: 3, width: 2, run: 5 },
		accessibility_modifier: { word: 5, width: 5 },
		override_: { word: 2, bit: 0 },
		readonly: { word: 2, bit: 1 },
		pattern: { word: 10, width: 5 },
		type_: { word: 15, width: 5 },
		value: { word: 20, width: 5 }
	},
	OmittingTypeAnnotationTransport: { words: 7, type_: { word: 2, width: 5 } },
	AddingTypeAnnotationTransport: { words: 7, type_: { word: 2, width: 5 } },
	OptingTypeAnnotationTransport: { words: 7, type_: { word: 2, width: 5 } },
	TypeAnnotationTransport: { words: 7, type_: { word: 2, width: 5 } },
	TypeQueryMemberExpressionInTypeAnnotationTransport: {
		words: 12,
		object: { word: 2, width: 5 },
		property: { word: 7, width: 5 }
	},
	TypeQueryCallExpressionInTypeAnnotationTransport: {
		words: 12,
		function: { word: 2, width: 5 },
		arguments: { word: 7, width: 5 }
	},
	AssertsTransport: { words: 7, value: { word: 2, width: 5 } },
	AssertsAnnotationTransport: { words: 7, asserts: { word: 2, width: 5 } },
	TupleParameterTransport: { words: 12, name: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	OptionalTupleParameterTransport: { words: 12, name: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	OptionalTypeTransport: { words: 7, type_: { word: 2, width: 5 } },
	RestTypeTransport: { words: 7, type_: { word: 2, width: 5 } },
	ConstructorTypeTransport: {
		words: 18,
		abstract_: { word: 2, bit: 0 },
		type_parameters: { word: 3, width: 5 },
		parameters: { word: 8, width: 5 },
		type_: { word: 13, width: 5 }
	},
	TemplateTypeTransport: { words: 7, type_: { word: 2, width: 5 } },
	TemplateLiteralTypeTransport: { words: 4, elements: { word: 2, width: 2, run: 5 } },
	InferTypeTransport: { words: 12, name: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	ConditionalTypeTransport: {
		words: 22,
		left: { word: 2, width: 5 },
		right: { word: 7, width: 5 },
		consequence: { word: 12, width: 5 },
		alternative: { word: 17, width: 5 }
	},
	GenericTypeTransport: { words: 12, name: { word: 2, width: 5 }, type_arguments: { word: 7, width: 5 } },
	TypePredicateTransport: { words: 12, name: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	TypePredicateAnnotationTransport: { words: 7, type_predicate: { word: 2, width: 5 } },
	TypeQueryMemberExpressionTransport: {
		words: 17,
		object: { word: 2, width: 5 },
		content: { word: 7, width: 5 },
		property: { word: 12, width: 5 }
	},
	TypeQuerySubscriptExpressionTransport: {
		words: 13,
		object: { word: 3, width: 5 },
		optional_chain: { word: 2, bit: 0 },
		index: { word: 8, width: 5 }
	},
	TypeQueryCallExpressionTransport: { words: 12, function: { word: 2, width: 5 }, arguments: { word: 7, width: 5 } },
	TypeQueryInstantiationExpressionTransport: {
		words: 12,
		function: { word: 2, width: 5 },
		type_arguments: { word: 7, width: 5 }
	},
	TypeQueryTransport: { words: 7, expression: { word: 2, width: 5 } },
	IndexTypeQueryTransport: { words: 7, type_: { word: 2, width: 5 } },
	LookupTypeTransport: { words: 12, type_: { word: 2, width: 5 }, index_type: { word: 7, width: 5 } },
	MappedTypeClauseTransport: {
		words: 17,
		name: { word: 2, width: 5 },
		type_: { word: 7, width: 5 },
		alias: { word: 12, width: 5 }
	},
	LiteralTypeTransport: { words: 7, content: { word: 2, width: 5 } },
	FlowMaybeTypeTransport: { words: 7, type_: { word: 2, width: 5 } },
	ParenthesizedTypeTransport: { words: 7, type_: { word: 2, width: 5 } },
	TypeArgumentsTransport: { words: 7, types: { word: 2, width: 5 } },
	ObjectTypeTransport: {
		words: 17,
		opening: { word: 2, width: 5 },
		members: { word: 7, width: 5 },
		closing: { word: 12, width: 5 }
	},
	CallSignatureTransport: {
		words: 17,
		type_parameters: { word: 2, width: 5 },
		parameters: { word: 7, width: 5 },
		return_type: { word: 12, width: 5 }
	},
	PropertySignatureTransport: {
		words: 18,
		accessibility_modifier: { word: 3, width: 5 },
		static_: { word: 2, bit: 0 },
		override_: { word: 2, bit: 1 },
		readonly: { word: 2, bit: 2 },
		name: { word: 8, width: 5 },
		optional: { word: 2, bit: 3 },
		type_: { word: 13, width: 5 }
	},
	TypeParametersTransport: { words: 7, elements: { word: 2, width: 5 } },
	TypeParameterTransport: {
		words: 18,
		const_: { word: 2, bit: 0 },
		name: { word: 3, width: 5 },
		constraint: { word: 8, width: 5 },
		value: { word: 13, width: 5 }
	},
	DefaultTypeTransport: { words: 7, type_: { word: 2, width: 5 } },
	ConstraintTransport: { words: 12, content: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	ConstructSignatureTransport: {
		words: 18,
		abstract_: { word: 2, bit: 0 },
		type_parameters: { word: 3, width: 5 },
		parameters: { word: 8, width: 5 },
		type_: { word: 13, width: 5 }
	},
	ArrayTypeTransport: { words: 7, type_: { word: 2, width: 5 } },
	TupleTypeTransport: { words: 7, tuple_type_members: { word: 2, width: 5 } },
	ReadonlyTypeTransport: { words: 7, type_: { word: 2, width: 5 } },
	UnionTypeTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	IntersectionTypeTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	FunctionTypeTransport: {
		words: 17,
		type_parameters: { word: 2, width: 5 },
		parameters: { word: 7, width: 5 },
		return_type: { word: 12, width: 5 }
	},
	ExportSpecifiersTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	ImportSpecifiersTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	ForHeaderArm3Transport: {
		words: 23,
		kind: { word: 3, width: 5 },
		left: { word: 8, width: 5 },
		automatic_semicolon: { word: 2, bit: 0 },
		operator: { word: 13, width: 5 },
		right: { word: 18, width: 5 }
	},
	FormalParametersElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	EnumBodyElementNameTransport: { words: 7, name: { word: 2, width: 5 } },
	EnumBodyElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	TypesTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	TypeParametersElementsTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	TupleTypeMembersTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	ImportClauseGroupTransport: { words: 7, content: { word: 2, width: 5 } },
	CatchClauseGroupTransport: { words: 12, parameter: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	AmbientDeclarationGlobalTransport: { words: 7, body: { word: 2, width: 5 } },
	AmbientDeclarationModuleTransport: {
		words: 17,
		name: { word: 2, width: 5 },
		type_: { word: 7, width: 5 },
		terminator: { word: 12, width: 5 }
	},
	ObjectTypeContentTransport: { words: 4, item: { word: 2, width: 2, run: 5 } },
	ExportStatementNamespaceExportTransport: {
		words: 12,
		name: { word: 2, width: 5 },
		terminator: { word: 7, width: 5 }
	},
	ExportStatementEqualsExportTransport: {
		words: 12,
		expression: { word: 2, width: 5 },
		terminator: { word: 7, width: 5 }
	},
	CommentLineTransport: { words: 6, content: { word: 2, width: 4 } },
	CommentBlockTransport: { words: 6, content: { word: 2, width: 4 } },
	LiteralTypeNegativeNumberTransport: { words: 12, operator: { word: 2, width: 5 }, argument: { word: 7, width: 5 } },
	NumberHexTransport: { words: 10, prefix: { word: 2, width: 4 }, content: { word: 6, width: 4 } },
	NumberFloatPointTransport: {
		words: 22,
		integer: { word: 2, width: 4 },
		fraction: { word: 6, width: 4 },
		marker: { word: 10, width: 4 },
		sign: { word: 14, width: 4 },
		exponent: { word: 18, width: 4 }
	},
	NumberFloatLeadingPointTransport: {
		words: 18,
		fraction: { word: 2, width: 4 },
		marker: { word: 6, width: 4 },
		sign: { word: 10, width: 4 },
		exponent: { word: 14, width: 4 }
	},
	NumberFloatScientificTransport: {
		words: 18,
		integer: { word: 2, width: 4 },
		marker: { word: 6, width: 4 },
		sign: { word: 10, width: 4 },
		exponent: { word: 14, width: 4 }
	},
	NumberDecimalTransport: { words: 2 },
	NumberBinaryTransport: { words: 10, prefix: { word: 2, width: 4 }, content: { word: 6, width: 4 } },
	NumberOctalTransport: { words: 10, prefix: { word: 2, width: 4 }, content: { word: 6, width: 4 } },
	NumberBigintHexTransport: { words: 6, content: { word: 2, width: 4 } },
	NumberBigintBinaryTransport: { words: 6, content: { word: 2, width: 4 } },
	NumberBigintOctalTransport: { words: 6, content: { word: 2, width: 4 } },
	NumberBigintDecimalTransport: { words: 6, content: { word: 2, width: 4 } },
	BinaryExpressionInTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	ClassBodyMemberMethodTransport: {
		words: 14,
		decorator: { word: 2, width: 2, run: 5 },
		method_definition: { word: 4, width: 5 },
		terminator: { word: 9, width: 5 }
	},
	ClassBodyMemberMethodSigTransport: {
		words: 12,
		method_signature: { word: 2, width: 5 },
		terminator: { word: 7, width: 5 }
	},
	ClassBodyMemberDeclarationTransport: { words: 12, member: { word: 2, width: 5 }, terminator: { word: 7, width: 5 } },
	IndexSignatureColonTransport: {
		words: 23,
		sign: { word: 3, width: 5 },
		readonly: { word: 2, bit: 0 },
		name: { word: 8, width: 5 },
		index_type: { word: 13, width: 5 },
		type_: { word: 18, width: 5 }
	},
	IndexSignatureMappedTypeClauseTransport: {
		words: 18,
		sign: { word: 3, width: 5 },
		readonly: { word: 2, bit: 0 },
		mapped_type_clause: { word: 8, width: 5 },
		type_: { word: 13, width: 5 }
	},
	ImportStatementClauseFromTransport: {
		words: 12,
		import_clause: { word: 2, width: 5 },
		source: { word: 7, width: 5 }
	},
	YieldExpressionDelegateTransport: { words: 7, expression: { word: 2, width: 5 } },
	ImportSpecifierNameTransport: { words: 12, import_kind: { word: 2, width: 5 }, name: { word: 7, width: 5 } },
	ImportSpecifierAsTransport: {
		words: 17,
		import_kind: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		alias: { word: 12, width: 5 }
	},
	ParenthesizedExpressionTypedTransport: { words: 12, expression: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	ParenthesizedExpressionSequenceTransport: { words: 7, sequence_expression: { word: 2, width: 5 } },
	CallExpressionCallTransport: {
		words: 17,
		function: { word: 2, width: 5 },
		type_arguments: { word: 7, width: 5 },
		arguments: { word: 12, width: 5 }
	},
	CallExpressionTemplateCallTransport: { words: 12, function: { word: 2, width: 5 }, arguments: { word: 7, width: 5 } },
	CallExpressionMemberTransport: {
		words: 17,
		function: { word: 2, width: 5 },
		type_arguments: { word: 7, width: 5 },
		arguments: { word: 12, width: 5 }
	},
	StringDoubleTransport: { words: 4, elements: { word: 2, width: 2, run: 5 } },
	StringSingleTransport: { words: 4, elements: { word: 2, width: 2, run: 5 } },
	UpdateExpressionPostfixTransport: { words: 12, argument: { word: 2, width: 5 }, operator: { word: 7, width: 5 } },
	UpdateExpressionPrefixTransport: { words: 12, operator: { word: 2, width: 5 }, argument: { word: 7, width: 5 } },
	ArrowFunctionParameterTransport: { words: 7, parameter: { word: 2, width: 5 } },
	ClassHeritageExtendsClauseTransport: {
		words: 12,
		extends_clause: { word: 2, width: 5 },
		implements_clause: { word: 7, width: 5 }
	},
	ImportClauseDefaultImportTransport: {
		words: 12,
		identifier: { word: 2, width: 5 },
		import_clause_group: { word: 7, width: 5 }
	},
	ExportStatementDefaultFromTransport: {
		words: 13,
		type_: { word: 2, bit: 0 },
		content: { word: 3, width: 5 },
		terminator: { word: 8, width: 5 }
	},
	ExportStatementDefaultDeclarationTransport: {
		words: 9,
		decorator: { word: 2, width: 2, run: 5 },
		content: { word: 4, width: 5 }
	},
	ExportStatementDefaultFromStarFromTransport: { words: 7, source: { word: 2, width: 5 } },
	ExportStatementDefaultFromNsFromTransport: {
		words: 12,
		namespace_export: { word: 2, width: 5 },
		source: { word: 7, width: 5 }
	},
	ExportStatementDefaultFromClauseFromTransport: {
		words: 12,
		export_clause: { word: 2, width: 5 },
		source: { word: 7, width: 5 }
	},
	ExportStatementDefaultDeclarationDefaultKwTransport: { words: 7, content: { word: 2, width: 5 } },
	ExportStatementDefaultDeclarationDefaultKwValueTransport: {
		words: 12,
		value: { word: 2, width: 5 },
		automatic_semicolon: { word: 7, width: 5 }
	},
	VariableDeclaratorPlainTransport: {
		words: 17,
		name: { word: 2, width: 5 },
		type_: { word: 7, width: 5 },
		value: { word: 12, width: 5 }
	},
	VariableDeclaratorDefiniteTransport: { words: 12, name: { word: 2, width: 5 }, type_: { word: 7, width: 5 } },
	ForHeaderLhsTransport: {
		words: 17,
		left: { word: 2, width: 5 },
		operator: { word: 7, width: 5 },
		right: { word: 12, width: 5 }
	},
	ForHeaderVarKindTransport: {
		words: 22,
		left: { word: 2, width: 5 },
		value: { word: 7, width: 5 },
		operator: { word: 12, width: 5 },
		right: { word: 17, width: 5 }
	},
	ForHeaderLetConstKindTransport: {
		words: 27,
		kind: { word: 2, width: 5 },
		left: { word: 7, width: 5 },
		terminator: { word: 12, width: 5 },
		operator: { word: 17, width: 5 },
		right: { word: 22, width: 5 }
	},
	HtmlCommentTransport: { words: 2 },
	JsxTextTransport: { words: 2 },
	TemplateCharsTransport: { words: 2 },
	TernaryQmarkTransport: { words: 2 },
	ErrorRecoveryTransport: { words: 2 },
	StatementIdentifierTransport: { words: 7, content: { word: 2, width: 5 } },
	ShorthandPropertyIdentifierTransport: { words: 7, content: { word: 2, width: 5 } },
	ShorthandPropertyIdentifierPatternTransport: { words: 7, content: { word: 2, width: 5 } },
	PropertyIdentifierTransport: { words: 7, content: { word: 2, width: 5 } },
	TypeIdentifierTransport: { words: 7, content: { word: 2, width: 5 } },
	InterfaceBodyTransport: { words: 7, content: { word: 2, width: 5 } }
} as const;
