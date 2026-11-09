import { beforeAll, describe, expect, it } from 'vitest';
import { generate } from '../../../../compiler/generate.ts';
import { rawGroupOf, type ExactSlots } from '../exact.ts';

let exact: ExactSlots;

beforeAll(async () => {
	exact = await exactOf('rust');
}, 120_000);

const setIn = (slots: ExactSlots, path: string, member: string) => {
	const set = slots.get(path)?.get(member);
	if (set === undefined) throw new Error(`no exact set at ${path}.${member}`);
	return set;
};

const setAt = (path: string, member: string) => setIn(exact, path, member);

const reasonsAt = (slots: ExactSlots, path: string, member: string, kind: string): readonly string[] => {
	const arm = setIn(slots, path, member).raw.find((candidate) => candidate.kind === kind);
	if (arm === undefined) throw new Error(`no raw ${kind} at ${path}.${member}`);
	return arm.reasons;
};

const exactOf = async (grammar: string): Promise<ExactSlots> => {
	const generated = await generate({ grammar, outputDir: `/tmp/sittir-portable-exact-${grammar}/src` });
	if (generated.portableTyped === undefined) throw new Error(`${grammar} emitted no typed module`);
	return generated.portableTyped.exact;
};

describe('exactSlotsOf', () => {
	it('keeps the paths a slot holds uncollapsed, where the role they share would admit the whole namespace', () => {
		expect(setAt('clause.else', 'body').kinds).toEqual(['statement.block', 'statement.if']);
	});

	it('puts an unclaimed kind in unmapped and never in raw', () => {
		const set = setAt('declaration.extension', 'traitClause');
		expect(set.unmapped).toContain('rust:impl_item_negative_clause');
		expect(set.raw.map((arm) => arm.kind)).not.toContain('impl_item_negative_clause');
	});

	it('makes a kind with a flag no arm builds a raw arm with reason flags, in the per-kind group', () => {
		const arm = setAt('type.array', 'length').raw.find((candidate) => candidate.kind === 'char_literal_plain');
		expect(arm?.reasons).toContain('flags');
		expect(rawGroupOf(['flags'])).toBe('kind');
	});

	it('gives no preset reason to a preset its read entry pins: a visibility, an operator', () => {
		expect(setAt('file', 'statements').raw.map((arm) => arm.kind)).not.toContain('enum_item');
		expect(reasonsAt(exact, 'argument', 'value', 'binary_expression')).not.toContain('preset');
	});

	it("gives no preset reason to a string's delimiters, which its claim spells", () => {
		expect(reasonsAt(exact, 'argument', 'value', 'string_literal')).not.toContain('preset');
	});

	it("keeps the preset reason where the build picks a form the read doesn't record", () => {
		expect(reasonsAt(exact, 'clause.bounds', 'bounds', 'function_type')).toContain('preset');
	});

	it('puts a raw arm whose reasons are all decided per value in the per-value group', () => {
		expect(rawGroupOf(['preset', 'scalar'])).toBe('value');
		expect(rawGroupOf(['opaque', 'unread'])).toBe('kind');
	});
});

describe('exactSlotsOf, python', () => {
	let python: ExactSlots;

	beforeAll(async () => {
		python = await exactOf('python');
	}, 120_000);

	it("gives no preset reason to a name its read entry tests with eq: __init__ reads as a constructor", () => {
		expect(setIn(python, 'statement.block', 'statements').raw.map((arm) => arm.kind)).not.toContain('method_declaration');
	});

	it("gives no preset reason to a string's delimiters, which its claim spells", () => {
		expect(reasonsAt(python, 'argument.named', 'value', 'string')).not.toContain('preset');
	});
});

describe('exactSlotsOf, typescript', () => {
	let typescript: ExactSlots;

	beforeAll(async () => {
		typescript = await exactOf('typescript');
	}, 120_000);

	it('gives no preset reason to a keyword its read entry pins: let or const, export default', () => {
		const kinds = setIn(typescript, 'clause.case.switch', 'bodies').raw.map((arm) => arm.kind);
		expect(kinds).not.toContain('lexical_declaration');
		expect(kinds).not.toContain('export_statement_default_declaration');
	});

	it('reads an alias that only relaxes the identifier it holds as that identifier, while a kind with a slot no claim reads stays raw', () => {
		expect(setIn(typescript, 'identifier.qualified', 'name').raw).toEqual([]);
		expect(setIn(typescript, 'statement.labeled', 'label').raw).toEqual([]);
		expect(reasonsAt(typescript, 'identifier.qualified', 'qualifier', 'type_query_call_expression_in_type_annotation')).toEqual(['unread']);
	});
});
