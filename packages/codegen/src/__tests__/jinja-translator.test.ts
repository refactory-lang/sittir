import { describe, it, expect } from 'vitest';
import { translateToJinja, translateTemplateString } from '../emitters/jinja-translator.ts';
import { AssembledBranch } from '../compiler/node-map.ts';
import type { SeqRule, Rule } from '../compiler/rule.ts';

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
