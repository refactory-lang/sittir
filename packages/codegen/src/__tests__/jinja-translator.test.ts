import { describe, it, expect } from 'vitest';
import { translateToJinja, translateTemplateString } from '../emitters/jinja-translator.ts';
import {
	AssembledBranch, AssembledContainer, AssembledLeaf,
	AssembledKeyword, AssembledToken, AssembledSupertype,
	AssembledEnum, AssembledMulti, AssembledGroup,
	AssembledPolymorph,
} from '../compiler/node-map.ts';
import type { SeqRule, RepeatRule, Rule, PolymorphRule } from '../compiler/rule.ts';

// T013 harness — covers Rule 1 (single-template branch) from
// contracts/translator-mapping.md. Subsequent tasks (T014–T020)
// extend this file with cases for containers, clauses, variants,
// the no-file paths, and loud failures.

describe('translateTemplateString — pure string transform', () => {
	it('translates $VAR to {{ var }}', () => {
		expect(translateTemplateString('fn $NAME()')).toBe('fn {{ name }}()');
	});

	it('translates multiple $VAR placeholders', () => {
		expect(translateTemplateString('$A $B $C')).toBe('{{ a }} {{ b }} {{ c }}');
	});

	it('translates $$$CHILDREN to {{ children | joinby(sep) }} — separator inline', () => {
		expect(translateTemplateString('{ $$$CHILDREN }')).toBe('{ {{ children | joinby(" ") }} }');
	});

	it('translates $$$NAME with the rule-level joinBy as the joinby arg', () => {
		expect(translateTemplateString('[$$$ITEMS]', { joinBy: ',' }))
			.toBe('[{{ items | joinby(",") }}]');
	});

	it('translates $$$NAME with joinByField override winning over joinBy', () => {
		expect(translateTemplateString('[$$$ITEMS]', { joinBy: ',', joinByField: { items: '\n' } }))
			.toBe('[{{ items | joinby("\\n") }}]');
	});

	it('emits has_flank_sep guards around $$$CHILDREN when joinByTrailing is set', () => {
		expect(translateTemplateString('($$$CHILDREN)', { joinBy: ',', joinByTrailing: true }))
			.toBe('({{ children | joinby(",") }}{% if has_flank_sep(_children, ",", "trailing") %},{% endif %})');
	});

	it('translates $TEXT to {{ text }}', () => {
		expect(translateTemplateString('$TEXT')).toBe('{{ text }}');
	});

	it('lowercases multi-word snake_case field names', () => {
		expect(translateTemplateString('$RETURN_TYPE_CLAUSE')).toBe('{{ return_type_clause }}');
	});

	it('translates $NEWLINE to a literal newline', () => {
		expect(translateTemplateString('class:$NEWLINE')).toBe('class:\n');
	});

	it('strips $INDENT and $DEDENT (render-time column tracking handles them)', () => {
		expect(translateTemplateString('$INDENT$BODY$DEDENT')).toBe('{{ body }}');
	});

	it('leaves literal text between placeholders untouched', () => {
		expect(translateTemplateString('struct $NAME { $$$CHILDREN }')).toBe('struct {{ name }} { {{ children | joinby(" ") }} }');
	});
});

describe('Rule 1: single-template branch', () => {
	it('translates a SeqRule branch with a $NAME field to a Jinja body', () => {
		// Minimal fixture: a seq rule with one field(name, string).
		// renderTemplate will produce `$NAME` (a bare identifier reference);
		// the translator wraps it as the Jinja body.
		const rule: SeqRule = {
			type: 'seq',
			members: [
				{ type: 'field', name: 'name', content: { type: 'symbol', name: '_identifier' } },
			],
		};
		const node = new AssembledBranch('simple_item', rule, rule);
		const result = translateToJinja(node, {} as Record<string, Rule>, /\w/);
		expect(result).toBe('{{ name }}');
	});
});

// Whitespace-control around clauses is now AssembledNode.renderTemplate's
// concern (clauses are inlined inside that method) — translator only
// handles $VAR → {{ var }}. The obsolete whitespace-control tests were
// deleted in the T1 walker refactor.

describe('YAML block-scalar whitespace fidelity (T020a / spec R41)', () => {
	// Edge case #1: when the source template was authored as a YAML
	// `|`-literal with embedded newlines (e.g., python's `_match_block`,
	// rust's `match_block`), translation must preserve byte-exact
	// whitespace — including terminal newlines and mid-line indent
	// structure. A single whitespace drift here breaks byte-identical
	// round-trip on the corpus.

	const emptyRules = {} as Record<string, Rule>;
	const wordMatcher = /\w/;

	it('template with embedded newline preserves the newline verbatim', () => {
		const fake = {
			modelType: 'branch' as const,
			kind: 'block_scalar_rule',
			renderTemplate: () => ({
				template: 'match $SUBJECT:\n$$$CHILDREN',
			}),
		};
		const result = translateToJinja(fake as any, emptyRules, wordMatcher);
		expect(result).toBe('match {{ subject }}:\n{{ children | joinby(" ") }}');
	});

	it('template with terminal newline preserves it (python indented block convention)', () => {
		const fake = {
			modelType: 'branch' as const,
			kind: 'terminal_newline_rule',
			renderTemplate: () => ({
				template: '$DECORATOR\n',
			}),
		};
		const result = translateToJinja(fake as any, emptyRules, wordMatcher);
		expect(result).toBe('{{ decorator }}\n');
	});

	it('template with mid-line indent structure preserves column positions exactly', () => {
		const fake = {
			modelType: 'branch' as const,
			kind: 'indented_rule',
			renderTemplate: () => ({
				template: 'try:\n  $BODY\nexcept:\n  $HANDLER\n',
			}),
		};
		const result = translateToJinja(fake as any, emptyRules, wordMatcher);
		expect(result).toBe('try:\n  {{ body }}\nexcept:\n  {{ handler }}\n');
	});
});

// The Whitespace control describe block (T020 artifacts) was deleted
// in the T1 walker refactor. Clause wrapping is now
// AssembledNode.renderTemplate's responsibility — the translator just
// translates `$VAR` → `{{ var }}`. End-to-end whitespace behavior is
// covered by the corpus-validation and nunjucks-render test suites.

describe('Structural placeholders ($NEWLINE / $INDENT / $DEDENT)', () => {
	const emptyRules = {} as Record<string, Rule>;
	const wordMatcher = /\w/;

	it('python-style block: $NEWLINE becomes literal \\n, $INDENT/$DEDENT strip', () => {
		// Canonical python block shape:
		//   class_def: "class $NAME:$NEWLINE$INDENT$BODY$DEDENT"
		// Expected Jinja:
		//   "class {{ name }}:\n{{ body }}"
		const fake = {
			modelType: 'branch' as const,
			kind: 'class_def',
			renderTemplate: () => ({
				template: 'class $NAME:$NEWLINE$INDENT$BODY$DEDENT',
			}),
		};
		const result = translateToJinja(fake as any, emptyRules, wordMatcher);
		expect(result).toBe('class {{ name }}:\n{{ body }}');
	});

	it('$NEWLINE inside a pre-inlined clause body still maps to literal \\n', () => {
		// Post T1: clauses are pre-inlined by renderTemplate;
		// translator only converts $NAME → {{ name }}.
		const fake = {
			modelType: 'branch' as const,
			kind: 'with_block_clause',
			renderTemplate: () => ({
				template: '$NAME{% if body %}:$NEWLINE$BODY{% endif %}',
			}),
		};
		const result = translateToJinja(fake as any, emptyRules, wordMatcher);
		expect(result).toBe('{{ name }}{% if body %}:\n{{ body }}{% endif %}');
	});
});

describe('Loud failure on unsupported constructs', () => {
	const emptyRules = {} as Record<string, Rule>;
	const wordMatcher = /\w/;

	it('branch with no template string: throws naming kind + modelType', () => {
		const fake = {
			modelType: 'branch' as const,
			kind: 'weird_branch',
			renderTemplate: () => ({ variants: {} }),
		};
		expect(() => translateToJinja(fake as any, emptyRules, wordMatcher))
			.toThrow(/weird_branch.*branch.*template string/i);
	});

	it('renderTemplate returning no template string: throws with kind + modelType context', () => {
		// Post T1: polymorph variant handling is in renderTemplate
		// itself. If renderTemplate returns an entry without a
		// template string (truly broken), the translator's wrapper
		// surfaces the rule kind and modelType.
		const fake = {
			modelType: 'branch' as const,
			kind: 'weird_branch',
			renderTemplate: () => ({}),
		};
		expect(() => translateToJinja(fake as any, emptyRules, wordMatcher))
			.toThrow(/weird_branch.*branch.*no template string/i);
	});
});

describe('Rule 2: clause-bearing template (post T1 walker refactor)', () => {
	// Post-T1: clause inlining happens in AssembledNode.renderTemplate,
	// NOT in the translator. These tests verify the translator's
	// behavior when it receives an already-inlined Jinja template:
	// `$VAR` placeholders get converted to `{{ var }}`; clause wrappers
	// (`{% if x %}...{% endif %}`) pass through unchanged.
	const emptyRules = {} as Record<string, Rule>;
	const wordMatcher = /\w/;

	it('translates $VAR inside a pre-inlined {% if %} clause', () => {
		const fake = {
			modelType: 'branch' as const,
			kind: 'fn_rule',
			renderTemplate: () => ({
				template: 'fn $NAME {% if return_type %}-> $RETURN_TYPE{% endif %}',
			}),
		};
		const result = translateToJinja(fake as any, emptyRules, wordMatcher);
		expect(result).toBe('fn {{ name }} {% if return_type %}-> {{ return_type }}{% endif %}');
	});

	it('translates $VAR inside multiple pre-inlined clauses', () => {
		const fake = {
			modelType: 'branch' as const,
			kind: 'fn_rule_many_clauses',
			renderTemplate: () => ({
				template: 'fn $NAME $PARAMS {% if return_type %}-> $RETURN_TYPE{% endif %}{% if body %}{ $BODY }{% endif %}',
			}),
		};
		const result = translateToJinja(fake as any, emptyRules, wordMatcher);
		expect(result).toBe(
			'fn {{ name }} {{ params }} {% if return_type %}-> {{ return_type }}{% endif %}{% if body %}{ {{ body }} }{% endif %}',
		);
	});
});

describe('Rule 3: polymorph variant branching', () => {
	const emptyRules = {} as Record<string, Rule>;
	const wordMatcher = /\w/;

	function makeFormGroup(name: string, body: Rule): AssembledGroup {
		// Polymorph forms are AssembledGroup instances with parentKind set.
		const g = new AssembledGroup(`_${name}`, body, body, {
			// Expose the authoring-visible form name so renderTemplate's
			// variants key matches what's stamped on the rendered node.
		} as any);
		// The form's name is its short label; set it directly since the
		// constructor's opts shape varies across commits. Prefer the
		// documented public surface.
		(g as any).name = name;
		(g as any).parentKind = 'parent_kind';
		(g as any).renderParts = () => ({
			template: `[${name.toUpperCase()}]`,
			clauses: {},
			joinByField: {},
		});
		return g;
	}

	it('collapsed-single-template polymorph: treat like branch (no variant wrapper)', () => {
		// All forms render the same template → collapse path in
		// AssembledPolymorph.renderTemplate (ADR-0013 Task 2).
		// Translator should emit the bare Jinja body without {% if %}.
		const formA = new AssembledGroup('_form_a', { type: 'symbol', name: 'x' }, { type: 'symbol', name: 'x' });
		const formB = new AssembledGroup('_form_b', { type: 'symbol', name: 'x' }, { type: 'symbol', name: 'x' });
		(formA as any).name = 'a';
		(formB as any).name = 'b';
		(formA as any).renderParts = () => ({ template: '$$$CHILDREN', clauses: {}, joinByField: {} });
		(formB as any).renderParts = () => ({ template: '$$$CHILDREN', clauses: {}, joinByField: {} });
		const rule: PolymorphRule = {
			type: 'polymorph',
			source: 'promoted',
			members: [],
		} as any;
		const poly = new AssembledPolymorph('simple_poly', rule, [formA, formB]);
		const result = translateToJinja(poly, emptyRules, wordMatcher);
		expect(result).toBe('{{ children | joinby(" ") }}');
	});

	it('genuinely branching polymorph: emit {% if variant == "form" %} chain over all forms', () => {
		// Forms differ → variants block retained. Translator wraps each
		// form body in a {% if/elif variant == "<form>" %} clause chain.
		const formA = new AssembledGroup('_form_a', { type: 'symbol', name: 'x' }, { type: 'symbol', name: 'x' });
		const formB = new AssembledGroup('_form_b', { type: 'symbol', name: 'x' }, { type: 'symbol', name: 'x' });
		(formA as any).name = 'alpha';
		(formB as any).name = 'beta';
		(formA as any).renderParts = () => ({ template: 'A:$NAME', clauses: {}, joinByField: {} });
		(formB as any).renderParts = () => ({ template: 'B:$NAME', clauses: {}, joinByField: {} });
		const rule: PolymorphRule = {
			type: 'polymorph',
			source: 'promoted',
			members: [],
		} as any;
		const poly = new AssembledPolymorph('branching_poly', rule, [formA, formB]);
		const result = translateToJinja(poly, emptyRules, wordMatcher);
		// Whitespace-controls (`{%- ... -%}`) strip newlines so the
		// rendered output has no extra blank lines between branches.
		expect(result).toBe(
			'{%- if variant == "alpha" -%}\n' +
			'A:{{ name }}\n' +
			'{%- elif variant == "beta" -%}\n' +
			'B:{{ name }}\n' +
			'{%- endif -%}',
		);
	});
});

describe('Rules 4, 5, 6: no-file cases (return null)', () => {
	const emptyRules = {} as Record<string, Rule>;
	const wordMatcher = /\w/;

	it('leaf (PatternRule) returns null — renderer emits $text fallback', () => {
		const node = new AssembledLeaf('identifier', { type: 'pattern', value: '[a-z]+' });
		expect(translateToJinja(node, emptyRules, wordMatcher)).toBeNull();
	});

	it('keyword returns null — parent template inlines the literal', () => {
		const node = new AssembledKeyword('kw_if', { type: 'string', value: 'if' });
		expect(translateToJinja(node, emptyRules, wordMatcher)).toBeNull();
	});

	it('token returns null — parent template inlines the literal', () => {
		const node = new AssembledToken('semicolon', { type: 'string', value: ';' });
		expect(translateToJinja(node, emptyRules, wordMatcher)).toBeNull();
	});

	it('supertype returns null — dispatch via recursive render on the subtype', () => {
		const rule: Rule = { type: 'supertype', subtypes: ['expression_a', 'expression_b'] };
		const node = new AssembledSupertype('_expression', rule, ['expression_a', 'expression_b']);
		expect(translateToJinja(node, emptyRules, wordMatcher)).toBeNull();
	});

	it('enum returns null — renderer emits $text (the enum value)', () => {
		const node = new AssembledEnum('integer_suffix', {
			type: 'enum',
			members: [
				{ type: 'string', value: 'u8' },
				{ type: 'string', value: 'u16' },
			],
		});
		expect(translateToJinja(node, emptyRules, wordMatcher)).toBeNull();
	});

	it('multi (hidden repeat helper) returns null — inlined at referrer site', () => {
		const node = new AssembledMulti('_items', {
			type: 'repeat',
			content: { type: 'symbol', name: '_item' },
		});
		expect(translateToJinja(node, emptyRules, wordMatcher)).toBeNull();
	});

	it('group (non-polymorph-form) returns null — inlined at referrer', () => {
		const rule: Rule = { type: 'group', name: '_helper', members: [{ type: 'symbol', name: 'x' }] };
		const node = new AssembledGroup('_helper', rule, rule);
		expect(translateToJinja(node, emptyRules, wordMatcher)).toBeNull();
	});
});

describe('Rule 1 (container flavor): single-template container', () => {
	it('translates a RepeatRule container to a Jinja body with {{ children }}', () => {
		// Minimal container: repeat(symbol). renderTemplate produces
		// `$$$CHILDREN` — the translator maps it to `{{ children }}`.
		// joinBy metadata is preserved for the emitter (not in the body).
		const rule: RepeatRule = {
			type: 'repeat',
			content: { type: 'symbol', name: '_statement' },
		};
		const node = new AssembledContainer('statement_list', rule, rule);
		const result = translateToJinja(node, {} as Record<string, Rule>, /\w/);
		expect(result).toBe('{{ children | joinby(" ") }}');
	});

	it('translates a SeqRule container with delimiters and $$$CHILDREN', () => {
		// Classic shape: `seq('{', repeat(_stmt), '}')`. renderTemplate
		// produces `{$$$CHILDREN}`; Jinja body mirrors that with
		// `{{ children }}`.
		const rule: SeqRule = {
			type: 'seq',
			members: [
				{ type: 'string', value: '{' },
				{ type: 'repeat', content: { type: 'symbol', name: '_stmt' } },
				{ type: 'string', value: '}' },
			],
		};
		const node = new AssembledContainer('block', rule, rule);
		const result = translateToJinja(node, {} as Record<string, Rule>, /\w/);
		// Walker emits spaces around $$$CHILDREN for readability:
		// source template is `{ $$$CHILDREN }` → Jinja `{ {{ children }} }`.
		expect(result).toBe('{ {{ children | joinby(" ") }} }');
	});
});
