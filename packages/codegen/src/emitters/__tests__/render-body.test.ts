import { describe, expect, it } from 'vitest';
import {
	ADJACENT,
	ADJACENT_MARK,
	EMPTY,
	SPACE,
	branches,
	concat,
	edgeChar,
	gate,
	indented,
	isExpression,
	mentions,
	printJinja,
	printRustBody,
	refersTo,
	references,
	rustStringLiteral,
	slot,
	text,
	weight,
	whitespace
} from '../render-body.ts';

describe('printJinja', () => {
	it('prints text verbatim and a slot as an expression', () => {
		expect(printJinja(concat(text('fn '), slot('name')))).toBe('fn {{ name }}');
	});

	it('separates a literal brace from a following expression and trims it back out', () => {
		expect(printJinja(concat(text('{'), slot('body'), text('}')))).toBe('{ {{- body }}}');
	});

	it('prints a gate as if/endif around its body', () => {
		expect(printJinja(gate('type', concat(text(': '), slot('type'))))).toBe(
			'{% if type | isPresent %}: {{ type }}{% endif %}'
		);
	});

	it('prints an arm chain with a fallback as if/elif/else', () => {
		const body = branches(
			[
				{ test: 'a', body: slot('a') },
				{ test: 'b', body: slot('b') }
			],
			text('none')
		);
		expect(printJinja(body)).toBe(
			'{% if a | isPresent %}{{ a }}{% elif b | isPresent %}{{ b }}{% else %}none{% endif %}'
		);
	});

	it('nests gates', () => {
		const body = gate('outer', concat(slot('outer'), gate('inner', slot('inner'))));
		expect(printJinja(body)).toBe(
			'{% if outer | isPresent %}{{ outer }}{% if inner | isPresent %}{{ inner }}{% endif %}{% endif %}'
		);
	});

	it('quotes structural whitespace so a template trim never eats it, and leaves a literal blank raw', () => {
		expect(printJinja(whitespace('\n'))).toBe('{{ "\\n" }}');
		expect(printJinja(concat(text('fn'), text(' '), text('main')))).toBe('fn main');
	});

	it('prints a spaced seam as a space and a glued seam before an expression as the adjacency mark', () => {
		expect(printJinja(concat(text('a'), SPACE, slot('b')))).toBe('a {{ b }}');
		expect(printJinja(concat(text('a'), ADJACENT, slot('b')))).toBe(`a${ADJACENT_MARK}{{ b }}`);
	});

	it('prints an indented block as the indent filter', () => {
		expect(printJinja(concat(whitespace('\n'), indented(slot('block'))))).toBe(
			'{{ "\\n" }}{% filter indent(2, true) %}{{ block }}{% endfilter %}'
		);
	});
});

describe('concat', () => {
	it('merges adjacent literal text but never structural whitespace', () => {
		expect(concat(text('a'), text('b'))).toEqual([{ kind: 'text', text: 'ab' }]);
		expect(concat(text(':'), whitespace('\n'))).toEqual([
			{ kind: 'text', text: ':' },
			{ kind: 'whitespace', text: '\n' }
		]);
	});

	it('drops empty text', () => {
		expect(text('')).toBe(EMPTY);
		expect(concat(EMPTY, slot('x'), EMPTY)).toEqual(slot('x'));
	});
});

describe('edgeChar and isExpression', () => {
	it('reads literal edges from the text and slot or gate edges as braces', () => {
		expect(edgeChar(text('fn'), 'starts')).toBe('f');
		expect(edgeChar(text('fn'), 'ends')).toBe('n');
		expect(edgeChar(slot('x'), 'starts')).toBe('{');
		expect(edgeChar(gate('x', slot('x')), 'ends')).toBe('}');
		expect(edgeChar(whitespace('\n'), 'starts')).toBe('{');
		expect(edgeChar(text(' '), 'starts')).toBe(' ');
		expect(edgeChar(EMPTY, 'ends')).toBe('');
	});

	it('treats a body that opens and closes on expressions as an expression', () => {
		expect(isExpression(slot('x'))).toBe(true);
		expect(isExpression(concat(slot('x'), text(','), slot('y')))).toBe(true);
		expect(isExpression(concat(text('a'), slot('x')))).toBe(false);
		expect(isExpression(gate('x', slot('x')))).toBe(false);
	});
});

describe('refersTo and mentions', () => {
	it('finds slot references at any depth', () => {
		const body = concat(text('x'), gate('a', concat(text('y'), slot('b'))));
		expect(refersTo(body, 'b')).toBe(true);
		expect(refersTo(body, 'a')).toBe(false);
		expect(mentions(body, 'a')).toBe(true);
		expect(mentions(body, 'x')).toBe(true);
		expect(mentions(body, 'z')).toBe(false);
	});
});

describe('weight', () => {
	it('equals the printed length', () => {
		const body = concat(
			text('let '),
			slot('name'),
			SPACE,
			gate('type', concat(text(': '), slot('type'))),
			ADJACENT,
			branches([{ test: 'a', body: slot('a') }], text('none')),
			whitespace('\n'),
			indented(slot('block'))
		);
		expect(weight(body)).toBe(printJinja(body).length);
	});
});

describe('rustStringLiteral', () => {
	it('escapes quotes, backslashes, line breaks and the writer marks', () => {
		expect(rustStringLiteral('say "hi"\\\n')).toBe('"say \\"hi\\"\\\\\\n"');
		expect(rustStringLiteral(`a${ADJACENT_MARK}b`)).toBe('"a\\u{FFFE}b"');
		expect(rustStringLiteral('\u{FDD0}\n')).toBe('"\\u{FDD0}\\n"');
	});
});

describe('references', () => {
	it('lists gate tests and slot references in document order at any depth', () => {
		const body = concat(slot('a'), gate('b', concat(slot('b'), indented(gate('c', slot('d'))))));
		expect(references(body)).toEqual({ tests: ['b', 'c'], slots: ['a', 'b', 'd'] });
	});
});

describe('printRustBody', () => {
	const field = (name: string): string => (name === 'type' ? 'type_' : name);
	const printer = {
		write: (name: string): string => `template.${field(name)}.render_into(dest)?;`,
		test: (name: string): string => `template.${field(name)}.is_present_check()`,
		indentUnit: '  '
	};

	it('coalesces every literal run into one write and renders slots through their view', () => {
		const body = concat(text('fn '), slot('name'), text('('), ADJACENT, slot('parameters'), SPACE, whitespace('\n'));
		expect(printRustBody(body, printer)).toEqual([
			'    dest.write_str("fn ")?;',
			'    template.name.render_into(dest)?;',
			'    dest.write_str("(\\u{FFFE}")?;',
			'    template.parameters.render_into(dest)?;',
			'    dest.write_str(" \\n")?;'
		]);
	});

	it('prints a gate chain as presence checks with the fallback as the else branch', () => {
		const body = branches(
			[
				{ test: 'type', body: concat(text(': '), slot('type')) },
				{ test: 'value', body: slot('value') }
			],
			text('_')
		);
		expect(printRustBody(body, printer)).toEqual([
			'    if template.type_.is_present_check() {',
			'        dest.write_str(": ")?;',
			'        template.type_.render_into(dest)?;',
			'    } else if template.value.is_present_check() {',
			'        template.value.render_into(dest)?;',
			'    } else {',
			'        dest.write_str("_")?;',
			'    }'
		]);
	});

	it('prints an indent block by shadowing the destination with an indent writer', () => {
		expect(printRustBody(concat(whitespace('\n'), indented(slot('block'))), printer)).toEqual([
			'    dest.write_str("\\n")?;',
			'    {',
			'        let mut indented = ::sittir_core::spacing::IndentWriter::new(dest, "  ");',
			'        let dest: &mut dyn ::std::fmt::Write = &mut indented;',
			'        template.block.render_into(dest)?;',
			'    }'
		]);
	});
});
