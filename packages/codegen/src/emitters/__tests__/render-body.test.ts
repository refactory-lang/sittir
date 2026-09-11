import { describe, expect, it } from 'vitest';
import {
	ADJACENT,
	DEDENT,
	EMPTY,
	INDENT,
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
	tokenSeam,
	weight
} from '../render-body.ts';

describe('concat', () => {
	it('merges adjacent literal text but never a depth node', () => {
		expect(concat(text('a'), text('b'))).toEqual([{ kind: 'text', text: 'ab' }]);
		expect(concat(text(':'), INDENT)).toEqual([
			{ kind: 'text', text: ':' },
			{ kind: 'indent' }
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
		expect(edgeChar(INDENT, 'starts')).toBe('{');
		expect(edgeChar(tokenSeam('\n'), 'starts')).toBe('{');
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
			INDENT,
			slot('block'),
			DEDENT
		);
		expect(weight(body)).toBe(132);
		expect(weight(gate('a', slot('a')))).toBeGreaterThan(weight(slot('a')));
	});
});

describe('rustStringLiteral', () => {
	it('escapes quotes, backslashes, line breaks and any noncharacter code point', () => {
		expect(rustStringLiteral('say "hi"\\\n')).toBe('"say \\"hi\\"\\\\\\n"');
		expect(rustStringLiteral('a\u{FFFE}b')).toBe('"a\\u{FFFE}b"');
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

	it('does not lift a gate whose only-arm literal edge carries an adjacency call: a flank is a plain string, with no sink call of its own', () => {
		const body = concat(slot('name'), gate('type', concat(text('->'), ADJACENT, gate('type', slot('type')))));
		const lifted = liftGates(body, viewOf);
		expect(lifted.flanks.size).toBe(0);
		expect(lifted.body[1]!.kind).toBe('if');
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

	it('writes each run of text as one w.text call and each slot as its own render call over the sink w', () => {
		const body = concat(text('fn '), slot('name'), text('('), ADJACENT, slot('parameters'), SPACE, tokenSeam('\n'), text('{}'));
		expect(printRustBody(body, printer)).toEqual([
			'    w.text("fn ")?;',
			'    name.render(w)?;',
			'    w.text("(")?;',
			'    w.adjacent();',
			'    parameters.render(w)?;',
			'    w.text(" ")?;',
			'    w.token_seam("\\n");',
			'    w.text("{}")?;',
			'    Ok(())'
		]);
	});

	it('writes a literal brace as-is (no escaping) and maps slot names through the printer', () => {
		expect(printRustBody(concat(text('{'), slot('type'), text('}')), printer)).toEqual([
			'    w.text("{")?;',
			'    type_.render(w)?;',
			'    w.text("}")?;',
			'    Ok(())'
		]);
	});

	it('writes literal-only runs without formatting and keeps a residual chain as if / else if / else on is_present', () => {
		const body = concat(text('('), branches([{ test: 'type', body: slot('type') }, { test: 'value', body: slot('value') }], text('_')), text(')'));
		expect(printRustBody(body, printer)).toEqual([
			'    w.text("(")?;',
			'    if type_.is_present() {',
			'        type_.render(w)?;',
			'    } else if value.is_present() {',
			'        value.render(w)?;',
			'    } else {',
			'        w.text("_")?;',
			'    }',
			'    w.text(")")?;',
			'    Ok(())'
		]);
	});

	it('prints an indent/dedent pair as depth calls, defaulting the indent seam to a bare newline', () => {
		expect(printRustBody(concat(text(':'), INDENT, slot('block'), DEDENT), printer)).toEqual([
			'    w.text(":")?;',
			'    w.indent();',
			'    w.seam("\\n");',
			'    block.render(w)?;',
			'    w.dedent();',
			'    Ok(())'
		]);
	});

	it('folds a whitespace run that follows a depth node in the same literal into its payload', () => {
		expect(printRustBody(concat(text(':'), INDENT, text('  \na'), DEDENT), printer)).toEqual([
			'    w.text(":")?;',
			'    w.indent();',
			'    w.seam("  \\n");',
			'    w.text("a")?;',
			'    w.dedent();',
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
	it('print as a site call resolved from the field at runtime, compare by field, and are listed by references', () => {
		expect(printRustBody(concat(text('fn'), seam('lparen_before'), text('('), slot('x')), { field: (n) => n })).toEqual([
			'    w.text("fn")?;',
			'    w.site(node.lparen_before.unwrap_or(0));',
			'    w.text("(")?;',
			'    x.render(w)?;',
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
