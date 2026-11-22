import { describe, expect, it } from 'vitest';
import { boundKindName } from '../names.ts';
import { boundNameCollisions, readVocabulary, vocabularyNamespaces, vocabularyShortened } from '../vocabulary.ts';
import { VOCABULARY_DIR } from '../facts.ts';

const MEMBER = ['declaration', 'declaration.member.method', 'declaration.member.method.signature', 'statement', 'statement.loop', 'statement.loop.counted'];

describe('a bound name leaves out a segment that is no kind', () => {
	const namespaces = vocabularyNamespaces(MEMBER);
	const shortened = vocabularyShortened(MEMBER);

	it('finds the namespaces: the prefixes of kind paths that are no kind', () => {
		expect([...namespaces]).toEqual(['declaration.member']);
	});

	it('binds declaration.member.method as method_declaration', () => {
		expect(boundKindName('declaration.member.method', false, shortened)).toBe('method_declaration');
		expect(boundKindName('declaration.member.method', true, shortened)).toBe('_method_declaration');
		expect(boundKindName('declaration.member.method.signature', false, shortened)).toBe('signature_method_declaration');
	});

	it('keeps a segment whose path is a kind, since what lies beneath refines it', () => {
		expect(boundKindName('statement.loop.counted', false, shortened)).toBe('counted_loop_statement');
	});

	it('keeps a path with no namespace as its segments reversed', () => {
		expect(boundKindName('declaration.function.signature', false, new Set())).toBe('signature_function_declaration');
	});
});

describe('a namespace is left out only when every name beneath it is unique within the parent', () => {
	it('keeps the segment for every child when one name beneath it is a member of the parent', () => {
		const kinds = ['expression', 'expression.binary', 'expression.binary.shift.left', 'expression.binary.shift.right_unsigned', 'expression.binary.arithmetic.add'];
		const shortened = vocabularyShortened(kinds, (path) => (path === 'expression.binary' ? ['left', 'right', 'operator'] : []));
		expect(boundKindName('expression.binary.shift.left', false, shortened)).toBe('left_shift_binary_expression');
		expect(boundKindName('expression.binary.shift.right_unsigned', false, shortened)).toBe('right_unsigned_shift_binary_expression');
		expect(boundKindName('expression.binary.arithmetic.add', false, shortened)).toBe('add_binary_expression');
	});

	it('keeps the segment for every child when one name beneath it is a kind beneath the parent', () => {
		const kinds = ['declaration', 'declaration.method', 'declaration.member.method', 'declaration.member.field'];
		const shortened = vocabularyShortened(kinds);
		expect(boundKindName('declaration.member.method', false, shortened)).toBe('method_member_declaration');
		expect(boundKindName('declaration.member.field', false, shortened)).toBe('field_member_declaration');
	});

	it('compares a member in snake case', () => {
		const kinds = ['declaration', 'declaration.group.type_parameters'];
		expect(boundKindName('declaration.group.type_parameters', false, vocabularyShortened(kinds, () => ['typeParameters']))).toBe('type_parameters_group_declaration');
	});

	it("binds the vocabulary's shift family with its segment, since left and right are slots of expression.binary", async () => {
		const vocabulary = await readVocabulary(VOCABULARY_DIR);
		expect(boundKindName('expression.binary.shift.left', false, vocabulary.shortened)).toBe('left_shift_binary_expression');
		expect(boundKindName('expression.binary.shift.right', false, vocabulary.shortened)).toBe('right_shift_binary_expression');
		expect(boundKindName('expression.binary.shift.right_unsigned', false, vocabulary.shortened)).toBe('right_unsigned_shift_binary_expression');
		expect(boundKindName('expression.binary.arithmetic.add', false, vocabulary.shortened)).toBe('add_binary_expression');
		expect(boundKindName('declaration.member.method', false, vocabulary.shortened)).toBe('method_declaration');
	});
});

describe('a shortened name another kind already has', () => {
	it('is a collision naming both kinds, on each kind whose name was shortened', () => {
		const kinds = ['declaration', 'declaration.member.method', 'declaration.type.method', 'declaration.member.field'];
		expect(boundNameCollisions(kinds, vocabularyShortened(kinds))).toEqual([
			{ name: 'method_declaration', kind: 'declaration.member.method', other: 'declaration.type.method' },
			{ name: 'method_declaration', kind: 'declaration.type.method', other: 'declaration.member.method' }
		]);
	});

	it('names neither when no two kinds share a name', () => {
		expect(boundNameCollisions(MEMBER, vocabularyShortened(MEMBER))).toEqual([]);
	});

	it('never happens across the vocabulary', async () => {
		const vocabulary = await readVocabulary(VOCABULARY_DIR);
		expect(boundNameCollisions(vocabulary.kinds.keys(), vocabulary.shortened)).toEqual([]);
	});
});
