// Auto-generated grammar type from tree-sitter-scm/src/node-types.json
// Structurally compatible with @codemod.com/jssg-types ScmTypes

export type ScmGrammar = {
	readonly definition: {
		type: 'definition';
		named: true;
		subtypes: [
			{ type: 'anonymous_node'; named: true },
			{ type: 'field_definition'; named: true },
			{ type: 'grouping'; named: true },
			{ type: 'list'; named: true },
			{ type: 'missing_node'; named: true },
			{ type: 'named_node'; named: true },
			{ type: 'predicate'; named: true }
		];
	};
	readonly named_node_group: {
		type: 'named_node_group';
		named: true;
		subtypes: [
			{ type: 'named_node_group_anchored_last'; named: true },
			{ type: 'named_node_group_children'; named: true }
		];
	};
	readonly anonymous_node: {
		type: 'anonymous_node';
		named: true;
		fields: {
			name: { multiple: false; required: true; types: [{ type: '_'; named: false }, { type: 'string'; named: true }] };
			quantifier: { multiple: true; required: false; types: [{ type: 'quantifier'; named: true }] };
		};
		children: { multiple: true; required: false; types: [{ type: 'capture'; named: true }] };
	};
	readonly capture: {
		type: 'capture';
		named: true;
		fields: { name: { multiple: false; required: true; types: [{ type: 'identifier'; named: true }] } };
	};
	readonly field_definition: {
		type: 'field_definition';
		named: true;
		fields: {
			definition: { multiple: false; required: true; types: [{ type: 'definition'; named: true }] };
			name: {
				multiple: true;
				required: true;
				types: [{ type: ':'; named: false }, { type: 'identifier'; named: true }];
			};
		};
	};
	readonly group_expression_arm: {
		type: 'group_expression_arm';
		named: true;
		fields: {
			left: {
				multiple: false;
				required: true;
				types: [{ type: 'definition'; named: true }, { type: 'group_expression_arm'; named: true }];
			};
			right: {
				multiple: false;
				required: true;
				types: [{ type: 'definition'; named: true }, { type: 'group_expression_arm'; named: true }];
			};
		};
	};
	readonly grouping: {
		type: 'grouping';
		named: true;
		fields: { quantifier: { multiple: true; required: false; types: [{ type: 'quantifier'; named: true }] } };
		children: {
			multiple: true;
			required: true;
			types: [{ type: 'capture'; named: true }, { type: 'grouping_group'; named: true }];
		};
	};
	readonly grouping_group: {
		type: 'grouping_group';
		named: true;
		fields: {};
		children: {
			multiple: false;
			required: true;
			types: [{ type: 'definition'; named: true }, { type: 'group_expression_arm'; named: true }];
		};
	};
	readonly immediate_string: {
		type: 'immediate_string';
		named: true;
		fields: {};
		children: { multiple: false; required: false; types: [{ type: 'string_content'; named: true }] };
	};
	readonly list: {
		type: 'list';
		named: true;
		fields: {
			definitions: { multiple: true; required: true; types: [{ type: 'definition'; named: true }] };
			quantifier: { multiple: true; required: false; types: [{ type: 'quantifier'; named: true }] };
		};
		children: { multiple: true; required: false; types: [{ type: 'capture'; named: true }] };
	};
	readonly missing_node: {
		type: 'missing_node';
		named: true;
		fields: {
			name: {
				multiple: false;
				required: false;
				types: [{ type: 'identifier'; named: true }, { type: 'string'; named: true }];
			};
			quantifier: { multiple: true; required: false; types: [{ type: 'quantifier'; named: true }] };
		};
		children: { multiple: true; required: false; types: [{ type: 'capture'; named: true }] };
	};
	readonly named_node: {
		type: 'named_node';
		named: true;
		fields: {
			name: {
				multiple: false;
				required: false;
				types: [{ type: '_'; named: false }, { type: 'identifier'; named: true }];
			};
			quantifier: { multiple: true; required: false; types: [{ type: 'quantifier'; named: true }] };
		};
		children: {
			multiple: true;
			required: false;
			types: [
				{ type: 'capture'; named: true },
				{ type: 'named_node_arm'; named: true },
				{ type: 'named_node_group'; named: true }
			];
		};
	};
	readonly named_node_arm: {
		type: 'named_node_arm';
		named: true;
		fields: {
			name: {
				multiple: false;
				required: true;
				types: [{ type: 'identifier'; named: true }, { type: 'immediate_string'; named: true }];
			};
			supertype: { multiple: false; required: true; types: [{ type: 'identifier'; named: true }] };
		};
	};
	readonly named_node_expression_arm: {
		type: 'named_node_expression_arm';
		named: true;
		fields: {
			left: {
				multiple: false;
				required: true;
				types: [
					{ type: 'definition'; named: true },
					{ type: 'named_node_expression_arm'; named: true },
					{ type: 'negated_field'; named: true }
				];
			};
			right: {
				multiple: false;
				required: true;
				types: [
					{ type: 'definition'; named: true },
					{ type: 'named_node_expression_arm'; named: true },
					{ type: 'negated_field'; named: true }
				];
			};
		};
	};
	readonly named_node_group_anchored_last: {
		type: 'named_node_group_anchored_last';
		named: true;
		fields: {
			last: {
				multiple: false;
				required: true;
				types: [
					{ type: 'definition'; named: true },
					{ type: 'named_node_expression_arm'; named: true },
					{ type: 'negated_field'; named: true }
				];
			};
			named_node_expressions: {
				multiple: true;
				required: false;
				types: [
					{ type: 'definition'; named: true },
					{ type: 'named_node_expression_arm'; named: true },
					{ type: 'negated_field'; named: true }
				];
			};
		};
	};
	readonly named_node_group_children: {
		type: 'named_node_group_children';
		named: true;
		fields: {
			named_node_expressions: {
				multiple: true;
				required: true;
				types: [
					{ type: 'definition'; named: true },
					{ type: 'named_node_expression_arm'; named: true },
					{ type: 'negated_field'; named: true }
				];
			};
		};
	};
	readonly negated_field: {
		type: 'negated_field';
		named: true;
		fields: { identifier: { multiple: false; required: true; types: [{ type: 'identifier'; named: true }] } };
	};
	readonly parameters: {
		type: 'parameters';
		named: true;
		fields: {
			elements: {
				multiple: true;
				required: true;
				types: [{ type: 'capture'; named: true }, { type: 'identifier'; named: true }, { type: 'string'; named: true }];
			};
		};
	};
	readonly predicate: {
		type: 'predicate';
		named: true;
		fields: {
			name: {
				multiple: true;
				required: true;
				types: [{ type: '#'; named: false }, { type: '.'; named: false }, { type: 'identifier'; named: true }];
			};
			parameters: { multiple: false; required: false; types: [{ type: 'parameters'; named: true }] };
			type: { multiple: false; required: true; types: [{ type: 'predicate_type'; named: true }] };
		};
	};
	readonly program: {
		type: 'program';
		named: true;
		root: true;
		fields: { definitions: { multiple: true; required: false; types: [{ type: 'definition'; named: true }] } };
	};
	readonly quantifier: { type: 'quantifier'; named: true; fields: {} };
	readonly string: {
		type: 'string';
		named: true;
		fields: { string_content: { multiple: false; required: false; types: [{ type: 'string_content'; named: true }] } };
	};
	readonly string_content: {
		type: 'string_content';
		named: true;
		fields: {};
		children: { multiple: true; required: false; types: [{ type: 'escape_sequence'; named: true }] };
	};
	readonly '_anonymous_!': { type: '!'; named: false };
	readonly '_anonymous_"': { type: '"'; named: false };
	readonly '_anonymous_#': { type: '#'; named: false };
	readonly '_anonymous_(': { type: '('; named: false };
	readonly '_anonymous_)': { type: ')'; named: false };
	readonly '_anonymous_*': { type: '*'; named: false };
	readonly '_anonymous_+': { type: '+'; named: false };
	readonly '_anonymous_.': { type: '.'; named: false };
	readonly '_anonymous_/': { type: '/'; named: false };
	readonly '_anonymous_:': { type: ':'; named: false };
	readonly '_anonymous_?': { type: '?'; named: false };
	readonly '_anonymous_@': { type: '@'; named: false };
	readonly _anonymous_MISSING: { type: 'MISSING'; named: false };
	readonly '_anonymous_[': { type: '['; named: false };
	readonly '_anonymous_]': { type: ']'; named: false };
	readonly _anonymous__: { type: '_'; named: false };
	readonly comment: { type: 'comment'; named: true; extra: true };
	readonly escape_sequence: { type: 'escape_sequence'; named: true };
	readonly identifier: { type: 'identifier'; named: true };
	readonly predicate_type: { type: 'predicate_type'; named: true };
};
