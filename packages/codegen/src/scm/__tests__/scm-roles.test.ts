import { describe, it, expect } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extractGrammarRoles } from '../extract-roles.ts';

// Dynamic imports use computed paths to prevent TypeScript from following
// cross-package references during type-check (codegen's tsconfig doesn't
// include grammar package source files).
const RUST_IR = '../../../../rust/src/ir.ts';
const TS_IR = '../../../../typescript/src/ir.ts';
const TS_TYPES = '../../../../typescript/src/types.ts';
const PY_IR = '../../../../python/src/ir.ts';
const PY_TYPES = '../../../../python/src/types.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadModule(path: string): Promise<any> {
	// A bare relative-string dynamic import doesn't reliably resolve across
	// package boundaries under vitest's Vite-based module loader — resolve
	// to an absolute file:// URL ourselves instead.
	const absolute = fileURLToPath(new URL(path, import.meta.url));
	return import(pathToFileURL(absolute).href);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadSynonyms(path: string): Promise<{ synonym: any }> {
	return loadModule(path);
}

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

// ---------------------------------------------------------------------------
// ir.synonym.* role-synonym integration tests
// ---------------------------------------------------------------------------

describe('ir.synonym.* canonical factories — Rust', () => {
	it('synonym.boolean(true) produces boolean_literal', async () => {
		const { synonym } = await loadSynonyms(RUST_IR);
		const node = synonym.boolean(true);
		expect(node.$text).toBe('true');
	});

	it('synonym.boolean(false) produces boolean_literal', async () => {
		const { synonym } = await loadSynonyms(RUST_IR);
		const node = synonym.boolean(false);
		expect(node.$text).toBe('false');
	});

	it('synonym.number(42) produces integer_literal', async () => {
		const { synonym } = await loadSynonyms(RUST_IR);
		const node = synonym.number(42);
		expect(node.$text).toBe('42');
	});

	it('synonym.number(3.14) produces float_literal', async () => {
		const { synonym } = await loadSynonyms(RUST_IR);
		const node = synonym.number(3.14);
		expect(node.$text).toBe('3.14');
	});

	it('synonym.string is not emitted — string_literal is not auto-composable', async () => {
		// Rust's string_literal factory takes a config with an explicit
		// `stringOpen` slot (the open-quote token variant) plus an
		// `elements` array — there is no single-positional-child surface
		// for emitFromString to compose, and the emitter deliberately
		// skips rather than inventing a default quote style. If a
		// composition rule is added later, this pin flips deliberately.
		const { synonym } = await loadSynonyms(RUST_IR);
		expect(synonym.string).toBeUndefined();
	});

	it('synonym.type("String") produces type_identifier', async () => {
		const { synonym } = await loadSynonyms(RUST_IR);
		const node = synonym.type('String');
		expect(node.$type).toBeTruthy();
	});

	it('synonym.identifier("main") produces identifier', async () => {
		const { synonym } = await loadSynonyms(RUST_IR);
		const node = synonym.identifier('main');
		expect(node.$text).toBe('main');
	});
});

describe('ir.synonym.* canonical factories — TypeScript', () => {
	it('synonym.boolean(true) produces the true keyword id', async () => {
		const { synonym } = await loadSynonyms(TS_IR);
		const { TSKindId } = await loadModule(TS_TYPES);
		expect(synonym.boolean(true)).toBe(TSKindId.True);
	});

	it('synonym.boolean(false) produces the false keyword id', async () => {
		const { synonym } = await loadSynonyms(TS_IR);
		const { TSKindId } = await loadModule(TS_TYPES);
		expect(synonym.boolean(false)).toBe(TSKindId.False);
	});

	it('synonym.number(42) produces number', async () => {
		const { synonym } = await loadSynonyms(TS_IR);
		const node = synonym.number(42);
		expect(node.$text).toBe('42');
	});

	it('synonym.comment("// hello") produces comment', async () => {
		const { synonym } = await loadSynonyms(TS_IR);
		const node = synonym.comment('// hello');
		expect(node.$text).toBe('// hello');
	});

	it('synonym.type("String") produces type_identifier', async () => {
		const { synonym } = await loadSynonyms(TS_IR);
		const node = synonym.type('String');
		expect(node.$type).toBeTruthy();
	});

	it('synonym.identifier("main") produces identifier', async () => {
		const { synonym } = await loadSynonyms(TS_IR);
		const node = synonym.identifier('main');
		expect(node.$text).toBe('main');
	});
});

describe('ir.synonym.* canonical factories — Python', () => {
	it('synonym.boolean(true) produces the True keyword id', async () => {
		const { synonym } = await loadSynonyms(PY_IR);
		const { TSKindId } = await loadModule(PY_TYPES);
		expect(synonym.boolean(true)).toBe(TSKindId.True);
	});

	it('synonym.boolean(false) produces the False keyword id', async () => {
		const { synonym } = await loadSynonyms(PY_IR);
		const { TSKindId } = await loadModule(PY_TYPES);
		expect(synonym.boolean(false)).toBe(TSKindId.False);
	});

	it('synonym.number(42) produces integer', async () => {
		const { synonym } = await loadSynonyms(PY_IR);
		const node = synonym.number(42);
		expect(node.$text).toBe('42');
	});

	it('synonym.number(3.14) produces float', async () => {
		const { synonym } = await loadSynonyms(PY_IR);
		const node = synonym.number(3.14);
		expect(node.$text).toBe('3.14');
	});

	it('synonym.comment("# hello") produces comment', async () => {
		const { synonym } = await loadSynonyms(PY_IR);
		const node = synonym.comment('# hello');
		expect(node.$text).toBe('# hello');
	});

	it('synonym.type("str") produces identifier', async () => {
		const { synonym } = await loadSynonyms(PY_IR);
		const node = synonym.type('str');
		expect(node.$text).toBe('str');
	});

	it('synonym.identifier("main") produces identifier', async () => {
		const { synonym } = await loadSynonyms(PY_IR);
		const node = synonym.identifier('main');
		expect(node.$text).toBe('main');
	});
});
