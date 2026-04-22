import { describe, it } from 'vitest';

// T012: skeleton. Each `it.todo` maps to one mapping rule from
// `specs/011-jinja-template-migration/contracts/translator-mapping.md`.
// Each will be replaced with a concrete failing test + implementation in
// a dedicated task (T013–T020) following the TDD protocol.

describe('jinja-translator — mapping rules', () => {
	describe('Rule 1: single-template branch / container', () => {
		it.todo('translates a branch with $VAR placeholders to {{ var }} interpolations');
	});

	describe('Rule 2: clause-bearing template', () => {
		it.todo('translates $NAME_CLAUSE + name_clause body to {% if name %}body{% endif %}');
	});

	describe('Rule 3: variant-branching polymorph', () => {
		it.todo('translates variants to {% if variant == "form" %} chains covering every form');
	});

	describe('Rule 4: leaf (text-only)', () => {
		it.todo('emits no file for a leaf rule (returns null)');
	});

	describe('Rule 5: keyword / token', () => {
		it.todo('emits no file for a keyword/token rule (returns null)');
	});

	describe('Rule 6: supertype / enum / group / multi', () => {
		it.todo('emits no file at the supertype level (returns null)');
	});

	describe('Loud failure', () => {
		it.todo('throws naming rule kind + unsupported construct when an unsupported shape is encountered');
	});
});
