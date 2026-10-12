// @generated from packages/scm/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar scm --all --output packages/scm/src
//
// Each transport's record layout, as rust/crates/sittir-scm/src/render/transport.rs stamps it.

export const RECORD_HEADER_WORDS = 2;

export const records = {
	ProgramTransport: { words: 4, definitions: { word: 2, width: 2, run: 5 } },
	EscapeSequenceTransport: { words: 6, content: { word: 2, width: 4 } },
	IdentifierTransport: { words: 6, text: { word: 2, width: 4 } },
	ImmediateIdentifierTransport: { words: 6, text: { word: 2, width: 4 } },
	CaptureTransport: { words: 7, name: { word: 2, width: 5 } },
	StringTransport: { words: 7, string_content: { word: 2, width: 5 } },
	ImmediateStringTransport: { words: 7, string_content: { word: 2, width: 5 } },
	StringContentTransport: { words: 4, content: { word: 2, width: 2, run: 5 } },
	ParametersTransport: { words: 4, elements: { word: 2, width: 2, run: 5 } },
	CommentTransport: { words: 6, content: { word: 2, width: 4 } },
	ListTransport: { words: 6, definitions: { word: 2, width: 2, run: 5 }, elements: { word: 4, width: 2, run: 5 } },
	GroupingTransport: {
		words: 6,
		grouping_group: { word: 2, width: 2, run: 5 },
		elements: { word: 4, width: 2, run: 5 }
	},
	MissingNodeTransport: { words: 9, name: { word: 2, width: 5 }, elements: { word: 7, width: 2, run: 5 } },
	AnonymousNodeTransport: { words: 9, name: { word: 2, width: 5 }, elements: { word: 7, width: 2, run: 5 } },
	FieldDefinitionTransport: { words: 12, name: { word: 2, width: 5 }, definition: { word: 7, width: 5 } },
	NegatedFieldTransport: { words: 7, identifier: { word: 2, width: 5 } },
	PredicateTransport: {
		words: 22,
		prefix: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		type_: { word: 12, width: 5 },
		parameters: { word: 17, width: 5 }
	},
	ListElementQuantifierTransport: { words: 7, quantifier: { word: 2, width: 5 } },
	GroupExpressionArmTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	NamedNodeExpressionArmTransport: { words: 12, left: { word: 2, width: 5 }, right: { word: 7, width: 5 } },
	GroupingGroupTransport: { words: 8, group_expression: { word: 3, width: 5 }, anchor: { word: 2, bit: 0 } },
	StringContentTextTransport: { words: 6, text: { word: 2, width: 4 } },
	NamedNodePlainTransport: {
		words: 14,
		name: { word: 2, width: 5 },
		named_node_group: { word: 7, width: 5 },
		elements: { word: 12, width: 2, run: 5 }
	},
	NamedNodeSupertypedTransport: {
		words: 19,
		supertype: { word: 2, width: 5 },
		name: { word: 7, width: 5 },
		named_node_group: { word: 12, width: 5 },
		elements: { word: 17, width: 2, run: 5 }
	},
	NamedNodeGroupChildrenTransport: {
		words: 5,
		anchor: { word: 2, bit: 0 },
		named_node_expressions: { word: 3, width: 2, run: 5 }
	},
	NamedNodeGroupAnchoredLastTransport: {
		words: 10,
		anchor: { word: 2, bit: 0 },
		named_node_expressions: { word: 3, width: 2, run: 5 },
		last: { word: 5, width: 5 }
	}
} as const;
