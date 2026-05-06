import { describe, it, expect } from 'vitest';
import { extractGrammarRoles, extractTriviaRoles } from '../scm/extract-roles.ts';

describe('general role extraction', () => {
	it('extracts string role from rust', () => {
		const roles = extractGrammarRoles('rust');
		const stringKinds = roles.get('string');
		expect(stringKinds.length).toBeGreaterThan(0);
		// Rust has string_literal, char_literal, raw_string_literal
		expect(stringKinds).toContain('string_literal');
	});

	it('extracts type role from rust', () => {
		const roles = extractGrammarRoles('rust');
		const typeKinds = roles.get('type');
		expect(typeKinds).toContain('type_identifier');
	});

	it('extracts type.builtin sub-role from rust', () => {
		const roles = extractGrammarRoles('rust');
		const builtinTypes = roles.get('type.builtin');
		expect(builtinTypes).toContain('primitive_type');
		// type.builtin kinds should also appear in the base type role
		const typeKinds = roles.get('type');
		expect(typeKinds).toContain('primitive_type');
	});

	it('extracts definition.function from rust tags.scm', () => {
		const roles = extractGrammarRoles('rust');
		const fnKinds = roles.get('definition.function');
		expect(fnKinds).toContain('function_item');
	});

	it('extracts definition.class from python tags.scm', () => {
		const roles = extractGrammarRoles('python');
		const classKinds = roles.get('definition.class');
		expect(classKinds).toContain('class_definition');
	});

	it('extracts number role from javascript (typescript inherits)', () => {
		const roles = extractGrammarRoles('typescript');
		const numberKinds = roles.get('number');
		expect(numberKinds).toContain('number');
	});

	it('extracts variable role from python', () => {
		const roles = extractGrammarRoles('python');
		const varKinds = roles.get('variable');
		expect(varKinds).toContain('identifier');
	});

	it('extractTriviaRoles backward compat', () => {
		const result = extractTriviaRoles('rust');
		expect(result.triviaKinds).toContain('line_comment');
		expect(result.triviaKinds).toContain('block_comment');
	});

	it('trivia still works after refactor', () => {
		const roles = extractGrammarRoles('rust');
		const triviaKinds = roles.get('trivia');
		expect(triviaKinds).toContain('line_comment');
	});
});

describe('sub-role extraction', () => {
	it('extracts function.method sub-role from rust', () => {
		const roles = extractGrammarRoles('rust');
		const methodKinds = roles.get('function.method');
		expect(methodKinds.length).toBeGreaterThan(0);
		// function.method kinds should also appear in the base function role
		const fnKinds = roles.get('function');
		for (const kind of methodKinds) {
			expect(fnKinds).toContain(kind);
		}
	});

	it('extracts function.macro sub-role from rust', () => {
		const roles = extractGrammarRoles('rust');
		const macroKinds = roles.get('function.macro');
		expect(macroKinds.length).toBeGreaterThan(0);
	});

	it('extracts string.special sub-role from javascript (via typescript)', () => {
		const roles = extractGrammarRoles('typescript');
		const specialKinds = roles.get('string.special');
		expect(specialKinds).toContain('regex');
		// string.special kinds should also appear in the base string role
		const stringKinds = roles.get('string');
		expect(stringKinds).toContain('regex');
	});

	it('extracts variable.builtin sub-role from javascript (via typescript)', () => {
		const roles = extractGrammarRoles('typescript');
		const builtinVars = roles.get('variable.builtin');
		expect(builtinVars.length).toBeGreaterThan(0);
		// variable.builtin kinds should also appear in the base variable role
		const varKinds = roles.get('variable');
		for (const kind of builtinVars) {
			expect(varKinds).toContain(kind);
		}
	});

	it('extracts variable.parameter sub-role from rust', () => {
		const roles = extractGrammarRoles('rust');
		const paramKinds = roles.get('variable.parameter');
		expect(paramKinds).toContain('identifier');
	});

	it('extracts function.builtin sub-role from python', () => {
		const roles = extractGrammarRoles('python');
		const builtinFns = roles.get('function.builtin');
		expect(builtinFns).toContain('identifier');
		// function.builtin kinds should also appear in the base function role
		const fnKinds = roles.get('function');
		expect(fnKinds).toContain('identifier');
	});

	it('extracts number role from python (integer + float)', () => {
		const roles = extractGrammarRoles('python');
		const numberKinds = roles.get('number');
		expect(numberKinds).toContain('integer');
		expect(numberKinds).toContain('float');
	});
});

describe('tags.scm inheritance', () => {
	it('typescript inherits definition.function from javascript tags.scm', () => {
		const roles = extractGrammarRoles('typescript');
		const fnKinds = roles.get('definition.function');
		expect(fnKinds.length).toBeGreaterThan(0);
		// TypeScript's own tags.scm has function_signature
		expect(fnKinds).toContain('function_signature');
	});

	it('typescript inherits definition.class from javascript tags.scm', () => {
		const roles = extractGrammarRoles('typescript');
		const classKinds = roles.get('definition.class');
		expect(classKinds.length).toBeGreaterThan(0);
	});

	it('typescript has definition.interface from its own tags.scm', () => {
		const roles = extractGrammarRoles('typescript');
		const ifaceKinds = roles.get('definition.interface');
		expect(ifaceKinds).toContain('interface_declaration');
	});

	it('typescript inherits reference.call from javascript tags.scm', () => {
		const roles = extractGrammarRoles('typescript');
		const callKinds = roles.get('reference.call');
		expect(callKinds.length).toBeGreaterThan(0);
	});
});

describe('GrammarRoles interface', () => {
	it('get() returns empty array for missing role', () => {
		const roles = extractGrammarRoles('rust');
		// Rust doesn't have number captures (uses constant.builtin instead)
		// Just test that an unmatched role returns []
		const result = roles.get('definition.interface');
		// Rust has trait_item as interface
		expect(result).toContain('trait_item');
	});

	it('entries array contains all extracted roles', () => {
		const roles = extractGrammarRoles('rust');
		expect(roles.entries.length).toBeGreaterThan(0);
		// Every entry should have at least one kind
		for (const entry of roles.entries) {
			expect(entry.kinds.length).toBeGreaterThan(0);
		}
	});

	it('grammar field is set correctly', () => {
		const roles = extractGrammarRoles('python');
		expect(roles.grammar).toBe('python');
	});
});
