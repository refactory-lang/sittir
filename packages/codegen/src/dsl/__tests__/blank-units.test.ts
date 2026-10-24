import { describe, expect, it } from 'vitest';
import { attributeBuilder, collapsedInto, structuralBuilder } from '../builders.ts';
import { optionalContentOf, withOptionalContent } from '../rule-patterns.ts';
import { simplifyRule } from '../../compiler/simplify.ts';

// The compile phases' blank is the empty choice; BLANK itself never reaches the attribute phase.
const BLANK = () => attributeBuilder.choice() as never;
const STRUCTURAL_BLANK = { type: 'BLANK' } as const;
const SYM = (name: string) => ({ type: 'SYMBOL', name }) as const;
const CHOICE = (...members: unknown[]) => ({ type: 'CHOICE', members }) as const;

describe('blank() builds BLANK (item 1)', () => {
	it('structuralBuilder.blank() is exactly {type: BLANK}', () => {
		expect(structuralBuilder.blank()).toStrictEqual({ type: 'BLANK' });
	});
});

describe('attributeBuilder.choice folds blank arms into an optional (item 2)', () => {
	it('no blank member gives a nonterminal CHOICE of all members', () => {
		expect(attributeBuilder.choice(attributeBuilder.symbol('a') as never, attributeBuilder.symbol('b') as never)).toMatchObject({
			type: 'CHOICE',
			nonterminal: true
		});
	});

	it('choice(STRING ",", blank) is the string with multiplicity optional, not SEQ[]', () => {
		expect(attributeBuilder.choice(attributeBuilder.string(',') as never, BLANK())).toMatchObject({ type: 'STRING', value: ',', multiplicity: 'optional' });
	});

	it('choice(a, b, blank) is CHOICE(a, b) with multiplicity optional', () => {
		expect(
			attributeBuilder.choice(attributeBuilder.symbol('a') as never, attributeBuilder.symbol('b') as never, BLANK())
		).toMatchObject({ type: 'CHOICE', multiplicity: 'optional', members: [{ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'b' }] });
	});

	it('only blanks give an empty CHOICE', () => {
		expect(attributeBuilder.choice(BLANK(), BLANK())).toMatchObject({ type: 'CHOICE', members: [] });
	});
});

describe('attributeBuilder.seq splices a bare blank away (item 3)', () => {
	it('seq(x, blank) is x', () => {
		const x = attributeBuilder.symbol('x') as never;
		expect(attributeBuilder.seq(x, BLANK())).toEqual(x);
	});

	it('a blank with a fieldName stays a member', () => {
		const x = attributeBuilder.symbol('x') as never;
		const fielded = { type: 'CHOICE', members: [], fieldName: 'f' } as never;
		expect(attributeBuilder.seq(x, fielded)).toMatchObject({ type: 'SEQ', members: [x, fielded] });
	});
});

describe('optionalContentOf and withOptionalContent (item 4)', () => {
	it('CHOICE(x, BLANK) and CHOICE(BLANK, x) both give x', () => {
		expect(optionalContentOf(CHOICE(SYM('x'), STRUCTURAL_BLANK) as never)).toEqual(SYM('x'));
		expect(optionalContentOf(CHOICE(STRUCTURAL_BLANK, SYM('x')) as never)).toEqual(SYM('x'));
	});

	it('CHOICE(a, b, BLANK) gives CHOICE(a, b), and drops every blank', () => {
		expect(optionalContentOf(CHOICE(SYM('a'), SYM('b'), STRUCTURAL_BLANK) as never)).toEqual(CHOICE(SYM('a'), SYM('b')));
		expect(optionalContentOf(CHOICE(SYM('a'), STRUCTURAL_BLANK, SYM('b'), STRUCTURAL_BLANK) as never)).toEqual(CHOICE(SYM('a'), SYM('b')));
	});

	it('CHOICE(BLANK, BLANK), CHOICE(a, b) and CHOICE[] give undefined', () => {
		expect(optionalContentOf(CHOICE(STRUCTURAL_BLANK, STRUCTURAL_BLANK) as never)).toBeUndefined();
		expect(optionalContentOf(CHOICE(SYM('a'), SYM('b')) as never)).toBeUndefined();
		expect(optionalContentOf(CHOICE() as never)).toBeUndefined();
	});

	it('withOptionalContent on CHOICE(a, BLANK, b) with content c gives CHOICE(c, BLANK)', () => {
		expect(withOptionalContent(CHOICE(SYM('a'), STRUCTURAL_BLANK, SYM('b')) as never, SYM('c') as never)).toEqual(CHOICE(SYM('c'), STRUCTURAL_BLANK));
	});
});

describe('collapsedInto keeps the survivor multiplicity unless the wrapper sets one (item 5)', () => {
	it('an array wrapper over an optional survivor gives array', () => {
		const survivor = { ...SYM('x'), multiplicity: 'optional' } as never;
		const wrapper = { type: 'SEQ', members: [survivor], multiplicity: 'array' } as never;
		expect(collapsedInto(wrapper, survivor)).toMatchObject({ multiplicity: 'array' });
	});

	it('a wrapper with no multiplicity keeps the survivor multiplicity', () => {
		const survivor = { ...SYM('x'), multiplicity: 'optional' } as never;
		const wrapper = { type: 'SEQ', members: [survivor] } as never;
		expect(collapsedInto(wrapper, survivor)).toMatchObject({ multiplicity: 'optional' });
	});
});

describe('simplifyRule folds an empty nested choice (item 6)', () => {
	it('CHOICE(x, CHOICE[]) simplifies to x with multiplicity optional', () => {
		const rule = attributeBuilder.choice(attributeBuilder.symbol('x') as never, BLANK());
		expect(simplifyRule(rule as never)).toMatchObject({ type: 'SYMBOL', name: 'x', multiplicity: 'optional' });
	});
});
