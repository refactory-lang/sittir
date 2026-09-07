import { describe, expect, it } from 'vitest';
import {
	ADJACENT,
	ADJACENT_MARK,
	DEDENT_MARK,
	EMPTY,
	SEAM_MARK,
	INDENT_NEWLINE,
	SPACE,
	branches,
	concat,
	duplicateSlots,
	edgeChar,
	equalBodies,
	gate,
	isExpression,
	liftGates,
	mentions,
	printRustBody,
	refersTo,
	references,
	rustStringLiteral,
	seam,
	slot,
	templateOf,
	text,
	weight,
	whitespace
} from '../render-body.ts';

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
	it('weighs text by length and every construct by a fixed overhead, so the arm ordering is stable', () => {
		const body = concat(
			text('let '),
			slot('name'),
			SPACE,
			gate('type', concat(text(': '), slot('type'))),
			ADJACENT,
			branches([{ test: 'a', body: slot('a') }], text('none')),
			whitespace(INDENT_NEWLINE),
			slot('block'),
			whitespace(DEDENT_MARK)
		);
		expect(weight(body)).toBe(149);
		expect(weight(gate('a', slot('a')))).toBeGreaterThan(weight(slot('a')));
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
		const body = concat(slot('a'), gate('b', concat(slot('b'), gate('c', slot('d')))));
		expect(references(body)).toEqual({ tests: ['b', 'c'], slots: ['a', 'b', 'd'], seams: [] });
	});
});

describe('liftGates', () => {
	const kinds: Record<string, 'single' | 'optional' | 'list' | 'text'> = { name: 'single', type: 'optional', items: 'list', text: 'text' };
	const viewOf = (name: string) => kinds[name] ?? 'optional';

	it('drops a gate that only guards its own slot', () => {
		const lifted = liftGates(concat(text('('), gate('items', slot('items')), text(')')), viewOf);
		expect(lifted.body).toEqual(concat(text('('), slot('items'), text(')')));
		expect(lifted.flanks.size).toBe(0);
	});

	it('moves literal flanks of an optional or list slot onto the view, through a doubled gate', () => {
		const body = concat(slot('name'), gate('type', concat(text('->'), ADJACENT, gate('type', slot('type')))));
		const lifted = liftGates(body, viewOf);
		expect(lifted.body).toEqual(concat(slot('name'), slot('type')));
		expect(lifted.flanks.get('type')).toEqual({ prefix: `->${ADJACENT_MARK}`, suffix: '' });
	});

	it('inlines the flanks of a required slot as text', () => {
		const lifted = liftGates(gate('name', concat(text('fn '), slot('name'))), viewOf);
		expect(lifted.body).toEqual(concat(text('fn '), slot('name')));
	});

	it('keeps a gate whose arm holds another slot, and a chain', () => {
		const multi = gate('type', concat(slot('type'), text('='), slot('value')));
		expect(liftGates(multi, viewOf).body).toEqual(multi);
		const chain = branches([{ test: 'type', body: slot('type') }, { test: 'value', body: slot('value') }], text('_'));
		expect(liftGates(chain, viewOf).body).toEqual(chain);
	});

	it('refuses two different flank sets for one slot', () => {
		const body = concat(gate('type', concat(text(':'), slot('type'))), gate('type', concat(text('='), slot('type'))));
		expect(() => liftGates(body, viewOf)).toThrow(/two different flanks/);
	});
});

describe('printRustBody', () => {
	const printer = { field: (name: string) => (name === 'type' ? 'type_' : name) };

	it('writes each run of text and slots as one format call over the sink f', () => {
		const body = concat(text('fn '), slot('name'), text('('), ADJACENT, slot('parameters'), SPACE, whitespace('\n'), text('{}'));
		expect(printRustBody(body, printer)).toEqual(['    write!(f, "fn {name}(\\u{FFFE}{parameters} \\n{{}}")?;', '    Ok(())']);
	});

	it('escapes braces in literals and maps slot names through the printer', () => {
		expect(printRustBody(concat(text('{'), slot('type'), text('}')), printer)).toEqual(['    write!(f, "{{{type_}}}")?;', '    Ok(())']);
	});

	it('writes literal-only runs without formatting and keeps a residual chain as if / else if / else on is_present', () => {
		const body = concat(text('('), branches([{ test: 'type', body: slot('type') }, { test: 'value', body: slot('value') }], text('_')), text(')'));
		expect(printRustBody(body, printer)).toEqual([
			'    f.write_str("(")?;',
			'    if type_.is_present() {',
			'        write!(f, "{type_}")?;',
			'    } else if value.is_present() {',
			'        write!(f, "{value}")?;',
			'    } else {',
			'        f.write_str("_")?;',
			'    }',
			'    f.write_str(")")?;',
			'    Ok(())'
		]);
	});

	it('prints the indentation marks as escaped structural whitespace', () => {
		expect(printRustBody(concat(text(':'), whitespace(INDENT_NEWLINE), slot('block'), whitespace(DEDENT_MARK)), printer)).toEqual([
			'    write!(f, ":\\u{FDD0}\\n{block}\\u{FDD1}")?;',
			'    Ok(())'
		]);
	});
});

describe('templateOf', () => {
	it('spells flanks in the write! vocabulary with {} standing for the slot', () => {
		expect(templateOf(undefined)).toBe('{}');
		expect(templateOf({ prefix: '->', suffix: '' })).toBe('->{}');
		expect(templateOf({ prefix: '{', suffix: '}' })).toBe('{{{}}}');
	});
});

describe('seam nodes', () => {
	it('print as an interpolated field, compare by field, and are listed by references', () => {
		expect(SEAM_MARK).toBe('\u{FDD2}');
		expect(printRustBody(concat(text('fn'), seam('lparen_before'), text('('), slot('x')), { field: (n) => n })).toEqual([
			'    write!(f, "fn{lparen_before}({x}")?;',
			'    Ok(())'
		]);
		expect(equalBodies(seam('a'), seam('a'))).toBe(true);
		expect(equalBodies(seam('a'), seam('b'))).toBe(false);
		expect(references(concat(seam('a'), gate('x', concat(seam('b'), slot('x'))))).seams).toEqual(['a', 'b']);
		expect(refersTo(seam('x'), 'x')).toBe(false);
		expect(mentions(seam('x'), 'x')).toBe(false);
		expect(edgeChar(seam('x'), 'starts')).toBe('{');
		expect(isExpression(seam('x'))).toBe(true);
	});

	it('keeps a gate whose arm holds a seam as a gate', () => {
		const lifted = liftGates(gate('x', concat(text('->'), seam('arrow_after'), slot('x'))), () => 'optional');
		expect(lifted.flanks.size).toBe(0);
		expect(lifted.body[0]!.kind).toBe('if');
	});
});

describe('duplicateSlots', () => {
	it('reports a slot referenced twice on one path and accepts one referenced in alternative arms', () => {
		expect(duplicateSlots(concat(slot('a'), gate('b', slot('b')), slot('c')))).toEqual([]);
		expect(duplicateSlots(branches([{ test: 'a', body: slot('x') }, { test: 'b', body: slot('x') }], slot('x')))).toEqual([]);
		expect(duplicateSlots(concat(gate('readonly_marker', slot('readonly_marker')), slot('abstract_marker'), gate('readonly_marker', slot('readonly_marker'))))).toEqual(['readonly_marker']);
		expect(duplicateSlots(concat(slot('x'), gate('y', concat(slot('y'), slot('x')))))).toEqual(['x']);
	});
});
