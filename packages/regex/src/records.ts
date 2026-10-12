// @generated from packages/regex/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar regex --all --output packages/regex/src
//
// Each transport's record layout, as rust/crates/sittir-regex/src/render/transport.rs stamps it.

export const RECORD_HEADER_WORDS = 2;

export const records = {
	PatternTransport: { words: 7, content: { word: 2, width: 5 } },
	AlternationTransport: { words: 4, terms: { word: 2, width: 2, run: 5 } },
	TermTransport: { words: 4, term_group: { word: 2, width: 2, run: 5 } },
	LookaroundAssertionTransport: { words: 7, content: { word: 2, width: 5 } },
	LookaheadAssertionTransport: { words: 12, content: { word: 2, width: 5 }, pattern: { word: 7, width: 5 } },
	LookbehindAssertionTransport: { words: 12, content: { word: 2, width: 5 }, pattern: { word: 7, width: 5 } },
	PatternCharacterTransport: { words: 6, text: { word: 2, width: 4 } },
	CharacterClassTransport: {
		words: 5,
		negation: { word: 2, bit: 0 },
		leading: { word: 2, bit: 1 },
		class_atoms: { word: 3, width: 2, run: 5 },
		trailing: { word: 2, bit: 2 }
	},
	PosixCharacterClassTransport: { words: 7, posix_class_name: { word: 2, width: 5 } },
	PosixClassNameTransport: { words: 6, text: { word: 2, width: 4 } },
	ClassRangeTransport: { words: 12, start: { word: 2, width: 5 }, end: { word: 7, width: 5 } },
	ClassCharacterTransport: { words: 6, text: { word: 2, width: 4 } },
	AnonymousCapturingGroupTransport: { words: 7, pattern: { word: 2, width: 5 } },
	NamedCapturingGroupTransport: {
		words: 17,
		content: { word: 2, width: 5 },
		group_name: { word: 7, width: 5 },
		pattern: { word: 12, width: 5 }
	},
	NonCapturingGroupTransport: { words: 7, pattern: { word: 2, width: 5 } },
	FlagsTransport: { words: 6, text: { word: 2, width: 4 } },
	ZeroOrMoreTransport: { words: 3, lazy: { word: 2, bit: 0 } },
	OneOrMoreTransport: { words: 3, lazy: { word: 2, bit: 0 } },
	OptionalTransport: { words: 3, lazy: { word: 2, bit: 0 } },
	CountQuantifierTransport: { words: 8, content: { word: 3, width: 5 }, lazy: { word: 2, bit: 0 } },
	BackreferenceEscapeTransport: { words: 7, group_name: { word: 2, width: 5 } },
	NamedGroupBackreferenceTransport: { words: 7, group_name: { word: 2, width: 5 } },
	DecimalEscapeTransport: { words: 6, text: { word: 2, width: 4 } },
	CharacterClassEscapeTransport: { words: 7, content: { word: 2, width: 5 } },
	UnicodeCharacterEscapeTransport: { words: 6, text: { word: 2, width: 4 } },
	UnicodePropertyValueExpressionTransport: {
		words: 12,
		unicode_property_value_expression_group: { word: 2, width: 5 },
		unicode_property_value: { word: 7, width: 5 }
	},
	UnicodePropertyValueTransport: { words: 6, text: { word: 2, width: 4 } },
	ControlEscapeTransport: { words: 6, text: { word: 2, width: 4 } },
	ControlLetterEscapeTransport: { words: 6, text: { word: 2, width: 4 } },
	IdentityEscapeTransport: { words: 6, content: { word: 2, width: 4 } },
	GroupNameTransport: { words: 6, text: { word: 2, width: 4 } },
	DecimalDigitsTransport: { words: 6, text: { word: 2, width: 4 } },
	TermGroupTransport: { words: 12, content: { word: 2, width: 5 }, quantifier: { word: 7, width: 5 } },
	CountQuantifierGroupTransport: { words: 7, decimal_digits: { word: 2, width: 5 } },
	CountQuantifierArmTransport: {
		words: 12,
		decimal_digits: { word: 2, width: 5 },
		count_quantifier_group: { word: 7, width: 5 }
	},
	CharacterClassEscapeArmTransport: {
		words: 12,
		character_class_escape_text2: { word: 2, width: 5 },
		unicode_property_value_expression: { word: 7, width: 5 }
	},
	UnicodePropertyValueExpressionGroupTransport: { words: 7, unicode_property_name: { word: 2, width: 5 } },
	CharacterClassEscapeText1Transport: { words: 6, text: { word: 2, width: 4 } },
	CharacterClassEscapeText2Transport: { words: 6, text: { word: 2, width: 4 } },
	InlineFlagsGroupEnableTransport: { words: 12, enabled: { word: 2, width: 5 }, pattern: { word: 7, width: 5 } },
	InlineFlagsGroupToggleTransport: {
		words: 17,
		enabled: { word: 2, width: 5 },
		disabled: { word: 7, width: 5 },
		pattern: { word: 12, width: 5 }
	},
	InlineFlagsGroupDisableTransport: { words: 12, disabled: { word: 2, width: 5 }, pattern: { word: 7, width: 5 } },
	LazyTransport: { words: 7, content: { word: 2, width: 5 } },
	UnicodePropertyNameTransport: { words: 7, content: { word: 2, width: 5 } }
} as const;
