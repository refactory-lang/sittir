// @generated from packages/regex/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar regex --all --output packages/regex/src
//
// Each node's record layout, as rust/crates/sittir-regex/src/render/node.rs stamps it.

export const RECORD_HEADER_WORDS = 2;

export const records = {
	PatternNode: { words: 7, content: { word: 2, width: 5 } },
	AlternationNode: { words: 4, terms: { word: 2, width: 2, run: 5 } },
	TermNode: { words: 4, term_group: { word: 2, width: 2, run: 5 } },
	LookaroundAssertionNode: { words: 7, content: { word: 2, width: 5 } },
	LookaheadAssertionNode: { words: 12, content: { word: 2, width: 5 }, pattern: { word: 7, width: 5 } },
	LookbehindAssertionNode: { words: 12, content: { word: 2, width: 5 }, pattern: { word: 7, width: 5 } },
	PatternCharacterNode: { words: 2 },
	CharacterClassNode: {
		words: 5,
		negation: { word: 2, bit: 0 },
		leading: { word: 2, bit: 1 },
		class_atoms: { word: 3, width: 2, run: 5 },
		trailing: { word: 2, bit: 2 }
	},
	PosixCharacterClassNode: { words: 7, posix_class_name: { word: 2, width: 5 } },
	PosixClassNameNode: { words: 2 },
	ClassRangeNode: { words: 12, start: { word: 2, width: 5 }, end: { word: 7, width: 5 } },
	ClassCharacterNode: { words: 2 },
	AnonymousCapturingGroupNode: { words: 7, pattern: { word: 2, width: 5 } },
	NamedCapturingGroupNode: {
		words: 17,
		content: { word: 2, width: 5 },
		group_name: { word: 7, width: 5 },
		pattern: { word: 12, width: 5 }
	},
	NonCapturingGroupNode: { words: 7, pattern: { word: 2, width: 5 } },
	FlagsNode: { words: 2 },
	ZeroOrMoreNode: { words: 3, lazy: { word: 2, bit: 0 } },
	OneOrMoreNode: { words: 3, lazy: { word: 2, bit: 0 } },
	OptionalNode: { words: 3, lazy: { word: 2, bit: 0 } },
	CountQuantifierNode: { words: 8, content: { word: 3, width: 5 }, lazy: { word: 2, bit: 0 } },
	BackreferenceEscapeNode: { words: 7, group_name: { word: 2, width: 5 } },
	NamedGroupBackreferenceNode: { words: 7, group_name: { word: 2, width: 5 } },
	DecimalEscapeNode: { words: 2 },
	CharacterClassEscapeNode: { words: 7, content: { word: 2, width: 5 } },
	UnicodeCharacterEscapeNode: { words: 2 },
	UnicodePropertyValueExpressionNode: {
		words: 12,
		unicode_property_value_expression_group: { word: 2, width: 5 },
		unicode_property_value: { word: 7, width: 5 }
	},
	UnicodePropertyValueNode: { words: 2 },
	ControlEscapeNode: { words: 2 },
	ControlLetterEscapeNode: { words: 2 },
	IdentityEscapeNode: { words: 6, content: { word: 2, width: 4 } },
	GroupNameNode: { words: 2 },
	DecimalDigitsNode: { words: 2 },
	TermGroupNode: { words: 12, content: { word: 2, width: 5 }, quantifier: { word: 7, width: 5 } },
	CountQuantifierGroupNode: { words: 7, decimal_digits: { word: 2, width: 5 } },
	CountQuantifierArmNode: {
		words: 12,
		decimal_digits: { word: 2, width: 5 },
		count_quantifier_group: { word: 7, width: 5 }
	},
	CharacterClassEscapeArmNode: {
		words: 12,
		character_class_escape_text2: { word: 2, width: 5 },
		unicode_property_value_expression: { word: 7, width: 5 }
	},
	UnicodePropertyValueExpressionGroupNode: { words: 7, unicode_property_name: { word: 2, width: 5 } },
	CharacterClassEscapeText1Node: { words: 2 },
	CharacterClassEscapeText2Node: { words: 2 },
	InlineFlagsGroupEnableNode: { words: 12, enabled: { word: 2, width: 5 }, pattern: { word: 7, width: 5 } },
	InlineFlagsGroupToggleNode: {
		words: 17,
		enabled: { word: 2, width: 5 },
		disabled: { word: 7, width: 5 },
		pattern: { word: 12, width: 5 }
	},
	InlineFlagsGroupDisableNode: { words: 12, disabled: { word: 2, width: 5 }, pattern: { word: 7, width: 5 } },
	LazyNode: { words: 7, content: { word: 2, width: 5 } },
	UnicodePropertyNameNode: { words: 7, content: { word: 2, width: 5 } }
} as const;
