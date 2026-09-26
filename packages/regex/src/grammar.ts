// Auto-generated grammar type from tree-sitter-regex/src/node-types.json
// Structurally compatible with @codemod.com/jssg-types RegexTypes

export type RegexGrammar = {
	readonly inline_flags_group: {
		type: 'inline_flags_group';
		named: true;
		subtypes: [
			{ type: 'inline_flags_group_disable'; named: true },
			{ type: 'inline_flags_group_enable'; named: true },
			{ type: 'inline_flags_group_toggle'; named: true }
		];
	};
	readonly alternation: {
		type: 'alternation';
		named: true;
		fields: {};
		children: { multiple: true; required: false; types: [{ type: 'term'; named: true }] };
	};
	readonly anonymous_capturing_group: {
		type: 'anonymous_capturing_group';
		named: true;
		fields: { pattern: { multiple: false; required: true; types: [{ type: 'pattern'; named: true }] } };
	};
	readonly backreference_escape: {
		type: 'backreference_escape';
		named: true;
		fields: { group_name: { multiple: false; required: true; types: [{ type: 'group_name'; named: true }] } };
	};
	readonly character_class: {
		type: 'character_class';
		named: true;
		fields: {
			class_atoms: {
				multiple: true;
				required: false;
				types: [
					{ type: 'character_class_escape'; named: true },
					{ type: 'class_character'; named: true },
					{ type: 'class_range'; named: true },
					{ type: 'control_escape'; named: true },
					{ type: 'control_letter_escape'; named: true },
					{ type: 'identity_escape'; named: true },
					{ type: 'posix_character_class'; named: true }
				];
			};
		};
		children: { multiple: true; required: false; types: [{ type: 'class_character'; named: true }] };
	};
	readonly character_class_escape: {
		type: 'character_class_escape';
		named: true;
		fields: {};
		children: {
			multiple: false;
			required: false;
			types: [{ type: 'character_class_escape_arm'; named: true }, { type: 'unicode_character_escape'; named: true }];
		};
	};
	readonly character_class_escape_arm: {
		type: 'character_class_escape_arm';
		named: true;
		fields: {
			unicode_property_value_expression: {
				multiple: false;
				required: true;
				types: [{ type: 'unicode_property_value_expression'; named: true }];
			};
		};
	};
	readonly class_range: {
		type: 'class_range';
		named: true;
		fields: {
			end: {
				multiple: false;
				required: true;
				types: [
					{ type: 'character_class_escape'; named: true },
					{ type: 'class_character'; named: true },
					{ type: 'control_escape'; named: true }
				];
			};
			start: {
				multiple: false;
				required: true;
				types: [
					{ type: 'character_class_escape'; named: true },
					{ type: 'class_character'; named: true },
					{ type: 'control_escape'; named: true }
				];
			};
		};
	};
	readonly control_escape: { type: 'control_escape'; named: true; fields: {} };
	readonly count_quantifier: {
		type: 'count_quantifier';
		named: true;
		fields: {};
		children: {
			multiple: true;
			required: true;
			types: [
				{ type: 'count_quantifier_arm'; named: true },
				{ type: 'decimal_digits'; named: true },
				{ type: 'lazy'; named: true }
			];
		};
	};
	readonly count_quantifier_arm: {
		type: 'count_quantifier_arm';
		named: true;
		fields: {};
		children: {
			multiple: true;
			required: true;
			types: [{ type: 'count_quantifier_group'; named: true }, { type: 'decimal_digits'; named: true }];
		};
	};
	readonly count_quantifier_group: {
		type: 'count_quantifier_group';
		named: true;
		fields: {};
		children: { multiple: false; required: false; types: [{ type: 'decimal_digits'; named: true }] };
	};
	readonly flags: { type: 'flags'; named: true; fields: {} };
	readonly inline_flags_group_disable: {
		type: 'inline_flags_group_disable';
		named: true;
		fields: {
			disabled: { multiple: false; required: true; types: [{ type: 'flags'; named: true }] };
			pattern: { multiple: false; required: false; types: [{ type: 'pattern'; named: true }] };
		};
	};
	readonly inline_flags_group_enable: {
		type: 'inline_flags_group_enable';
		named: true;
		fields: {
			enabled: { multiple: false; required: true; types: [{ type: 'flags'; named: true }] };
			pattern: { multiple: false; required: false; types: [{ type: 'pattern'; named: true }] };
		};
	};
	readonly inline_flags_group_toggle: {
		type: 'inline_flags_group_toggle';
		named: true;
		fields: {
			disabled: { multiple: false; required: true; types: [{ type: 'flags'; named: true }] };
			enabled: { multiple: false; required: true; types: [{ type: 'flags'; named: true }] };
			pattern: { multiple: false; required: false; types: [{ type: 'pattern'; named: true }] };
		};
	};
	readonly lookahead_assertion: {
		type: 'lookahead_assertion';
		named: true;
		fields: {};
		children: { multiple: false; required: true; types: [{ type: 'pattern'; named: true }] };
	};
	readonly lookaround_assertion: {
		type: 'lookaround_assertion';
		named: true;
		fields: {};
		children: {
			multiple: false;
			required: true;
			types: [{ type: 'lookahead_assertion'; named: true }, { type: 'lookbehind_assertion'; named: true }];
		};
	};
	readonly lookbehind_assertion: {
		type: 'lookbehind_assertion';
		named: true;
		fields: {};
		children: { multiple: false; required: true; types: [{ type: 'pattern'; named: true }] };
	};
	readonly named_capturing_group: {
		type: 'named_capturing_group';
		named: true;
		fields: {
			group_name: { multiple: false; required: true; types: [{ type: 'group_name'; named: true }] };
			pattern: { multiple: false; required: true; types: [{ type: 'pattern'; named: true }] };
		};
	};
	readonly named_group_backreference: {
		type: 'named_group_backreference';
		named: true;
		fields: { group_name: { multiple: false; required: true; types: [{ type: 'group_name'; named: true }] } };
	};
	readonly non_capturing_group: {
		type: 'non_capturing_group';
		named: true;
		fields: { pattern: { multiple: false; required: true; types: [{ type: 'pattern'; named: true }] } };
	};
	readonly one_or_more: {
		type: 'one_or_more';
		named: true;
		fields: {};
		children: { multiple: false; required: false; types: [{ type: 'lazy'; named: true }] };
	};
	readonly optional: {
		type: 'optional';
		named: true;
		fields: {};
		children: { multiple: false; required: false; types: [{ type: 'lazy'; named: true }] };
	};
	readonly pattern: {
		type: 'pattern';
		named: true;
		root: true;
		fields: {};
		children: {
			multiple: false;
			required: true;
			types: [{ type: 'alternation'; named: true }, { type: 'term'; named: true }];
		};
	};
	readonly posix_character_class: {
		type: 'posix_character_class';
		named: true;
		fields: {
			posix_class_name: { multiple: false; required: true; types: [{ type: 'posix_class_name'; named: true }] };
		};
	};
	readonly posix_class_name: { type: 'posix_class_name'; named: true; fields: {} };
	readonly start_assertion: { type: 'start_assertion'; named: true; fields: {} };
	readonly term: {
		type: 'term';
		named: true;
		fields: {};
		children: { multiple: true; required: true; types: [{ type: 'term_group'; named: true }] };
	};
	readonly term_group: {
		type: 'term_group';
		named: true;
		fields: {
			quantifier: {
				multiple: false;
				required: false;
				types: [
					{ type: 'count_quantifier'; named: true },
					{ type: 'one_or_more'; named: true },
					{ type: 'optional'; named: true },
					{ type: 'zero_or_more'; named: true }
				];
			};
		};
		children: {
			multiple: false;
			required: true;
			types: [
				{ type: 'anonymous_capturing_group'; named: true },
				{ type: 'any_character'; named: true },
				{ type: 'backreference_escape'; named: true },
				{ type: 'boundary_assertion'; named: true },
				{ type: 'character_class'; named: true },
				{ type: 'character_class_escape'; named: true },
				{ type: 'control_escape'; named: true },
				{ type: 'control_letter_escape'; named: true },
				{ type: 'decimal_escape'; named: true },
				{ type: 'end_assertion'; named: true },
				{ type: 'identity_escape'; named: true },
				{ type: 'inline_flags_group'; named: true },
				{ type: 'lookaround_assertion'; named: true },
				{ type: 'named_capturing_group'; named: true },
				{ type: 'named_group_backreference'; named: true },
				{ type: 'non_boundary_assertion'; named: true },
				{ type: 'non_capturing_group'; named: true },
				{ type: 'pattern_character'; named: true },
				{ type: 'posix_character_class'; named: true },
				{ type: 'start_assertion'; named: true }
			];
		};
	};
	readonly unicode_character_escape: { type: 'unicode_character_escape'; named: true; fields: {} };
	readonly unicode_property_value_expression: {
		type: 'unicode_property_value_expression';
		named: true;
		fields: {};
		children: {
			multiple: true;
			required: true;
			types: [
				{ type: 'unicode_property_value'; named: true },
				{ type: 'unicode_property_value_expression_group'; named: true }
			];
		};
	};
	readonly unicode_property_value_expression_group: {
		type: 'unicode_property_value_expression_group';
		named: true;
		fields: {};
		children: { multiple: false; required: true; types: [{ type: 'unicode_property_name'; named: true }] };
	};
	readonly zero_or_more: {
		type: 'zero_or_more';
		named: true;
		fields: {};
		children: { multiple: false; required: false; types: [{ type: 'lazy'; named: true }] };
	};
	readonly '_anonymous_!': { type: '!'; named: false };
	readonly '_anonymous_(': { type: '('; named: false };
	readonly '_anonymous_(?': { type: '(?'; named: false };
	readonly '_anonymous_(?:': { type: '(?:'; named: false };
	readonly '_anonymous_(?<': { type: '(?<'; named: false };
	readonly '_anonymous_(?P<': { type: '(?P<'; named: false };
	readonly '_anonymous_(?P=': { type: '(?P='; named: false };
	readonly '_anonymous_)': { type: ')'; named: false };
	readonly '_anonymous_*': { type: '*'; named: false };
	readonly '_anonymous_+': { type: '+'; named: false };
	readonly '_anonymous_,': { type: ','; named: false };
	readonly '_anonymous_-': { type: '-'; named: false };
	readonly '_anonymous_:': { type: ':'; named: false };
	readonly '_anonymous_:]': { type: ':]'; named: false };
	readonly '_anonymous_<': { type: '<'; named: false };
	readonly '_anonymous_=': { type: '='; named: false };
	readonly '_anonymous_>': { type: '>'; named: false };
	readonly '_anonymous_?': { type: '?'; named: false };
	readonly '_anonymous_[': { type: '['; named: false };
	readonly '_anonymous_[:': { type: '[:'; named: false };
	readonly '_anonymous_\\k': { type: '\\k'; named: false };
	readonly '_anonymous_]': { type: ']'; named: false };
	readonly '_anonymous_^': { type: '^'; named: false };
	readonly any_character: { type: 'any_character'; named: true };
	readonly boundary_assertion: { type: 'boundary_assertion'; named: true };
	readonly class_character: { type: 'class_character'; named: true };
	readonly control_letter_escape: { type: 'control_letter_escape'; named: true };
	readonly decimal_digits: { type: 'decimal_digits'; named: true };
	readonly decimal_escape: { type: 'decimal_escape'; named: true };
	readonly end_assertion: { type: 'end_assertion'; named: true };
	readonly group_name: { type: 'group_name'; named: true };
	readonly identity_escape: { type: 'identity_escape'; named: true };
	readonly lazy: { type: 'lazy'; named: true };
	readonly non_boundary_assertion: { type: 'non_boundary_assertion'; named: true };
	readonly pattern_character: { type: 'pattern_character'; named: true };
	readonly unicode_property_name: { type: 'unicode_property_name'; named: true };
	readonly unicode_property_value: { type: 'unicode_property_value'; named: true };
	readonly '_anonymous_{': { type: '{'; named: false };
	readonly '_anonymous_|': { type: '|'; named: false };
	readonly '_anonymous_}': { type: '}'; named: false };
};
