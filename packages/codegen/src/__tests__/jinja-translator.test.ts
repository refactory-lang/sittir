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

	it('translates $$$CHILDREN to {{ children }}', () => {
		expect(translateTemplateString('{ $$$CHILDREN }')).toBe('{ {{ children }} }');
	});

	it('translates $$$NAME (multi-valued field) to {{ name }} (pre-joined by prepare())', () => {
		expect(translateTemplateString('[$$$ITEMS]')).toBe('[{{ items }}]');
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
		expect(translateTemplateString('struct $NAME { $$$CHILDREN }')).toBe('struct {{ name }} { {{ children }} }');
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
		expect(result).toBe('match {{ subject }}:\n{{ children }}');
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

describe('Whitespace control — absent clauses leave no orphan whitespace', () => {
	const emptyRules = {} as Record<string, Rule>;
	const wordMatcher = /\w/;

	// We don't run Nunjucks in these tests (Phase A wires it up later);
	// we just verify the emitted Jinja body has `{%-` and `-%}` markers
	// around clause wrappers. That's the structural contract T020 is
	// checking: the translator's output is whitespace-control-aware.

	it('clause wrapper opens with {% if x %} and closes with {% endif %}', () => {
		// No strip markers: YAML-era renderer preserved surrounding
		// whitespace when clauses were absent and relied on FR-017
		// space absorption to collapse. Jinja output mirrors that
		// behavior so corpus round-trip stays byte-identical.
		const fake = {
			modelType: 'branch' as const,
			kind: 'rule',
			renderTemplate: () => ({
				template: 'fn $NAME $BODY_CLAUSE{',
				body_clause: '{ $BODY }',
			}),
		};
		const result = translateToJinja(fake as any, emptyRules, wordMatcher)!;
		expect(result).toContain('{% if body ');
		expect(result).toContain('{% endif %}');
		// No strip markers on clause boundaries.
		expect(result).not.toContain('{%- if');
		expect(result).not.toContain('endif -%}');
	});

	it('multiple clauses: each gets its own {% if / endif %} wrapper', () => {
		const fake = {
			modelType: 'branch' as const,
			kind: 'rule_two_clauses',
			renderTemplate: () => ({
				template: '$PREFIX_CLAUSE $NAME $SUFFIX_CLAUSE',
				prefix_clause: '[$PREFIX]',
				suffix_clause: '{$SUFFIX}',
			}),
		};
		const result = translateToJinja(fake as any, emptyRules, wordMatcher)!;
		expect(result.match(/\{% if /g)?.length).toBe(2);
		expect(result.match(/\{% endif %\}/g)?.length).toBe(2);
	});
});

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

	it('$NEWLINE inside a clause body still maps to literal \\n', () => {
		const fake = {
			modelType: 'branch' as const,
			kind: 'with_block_clause',
			renderTemplate: () => ({
				template: '$NAME$BODY_CLAUSE',
				body_clause: ':$NEWLINE$BODY',
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

	it('polymorph with no variants and no template: throws naming kind', () => {
		const fake = {
			modelType: 'polymorph' as const,
			kind: 'weird_poly',
			renderTemplate: () => ({}),
		};
		expect(() => translateToJinja(fake as any, emptyRules, wordMatcher))
			.toThrow(/weird_poly.*neither template nor variants/i);
	});

	it('unknown modelType: throws naming modelType + kind', () => {
		const fake = {
			modelType: 'nonexistent-type' as const,
			kind: 'synthetic_unknown',
			renderTemplate: () => ({ template: '' }),
		};
		expect(() => translateToJinja(fake as any, emptyRules, wordMatcher))
			.toThrow(/not yet implemented.*nonexistent-type.*synthetic_unknown/i);
	});
});

describe('Rule 2: clause-bearing template', () => {
	const emptyRules = {} as Record<string, Rule>;
	const wordMatcher = /\w/;

	it('inlines a clause body into {% if x %} ... {% endif %} at its $X_CLAUSE reference site', () => {
		// Fixture: a rule whose renderTemplate() returns
		// `{ template: "fn $NAME $RETURN_TYPE_CLAUSE", return_type_clause: "-> $RETURN_TYPE" }`.
		// Expected Jinja body:
		//   `fn {{ name }} {%- if return_type %} -> {{ return_type }}{% endif -%}`
		//
		// Easiest way to assemble this fixture deterministically is to
		// stub the node with its renderTemplate() return value (mirrors
		// the T016 approach).
		const fake = {
			modelType: 'branch' as const,
			kind: 'fn_rule',
			renderTemplate: () => ({
				template: 'fn $NAME $RETURN_TYPE_CLAUSE',
				return_type_clause: '-> $RETURN_TYPE',
			}),
		};
		const result = translateToJinja(fake as any, emptyRules, wordMatcher);
		expect(result).toBe('fn {{ name }} {% if return_type %}-> {{ return_type }}{% endif %}');
	});

	it('handles multiple clauses in a single template', () => {
		const fake = {
			modelType: 'branch' as const,
			kind: 'fn_rule_many_clauses',
			renderTemplate: () => ({
				template: 'fn $NAME $PARAMS $RETURN_TYPE_CLAUSE$BODY_CLAUSE',
				return_type_clause: '-> $RETURN_TYPE',
				body_clause: '{ $BODY }',
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
		expect(result).toBe('{{ children }}');
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
		expect(result).toBe('{{ children }}');
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
		expect(result).toBe('{ {{ children }} }');
	});
});
