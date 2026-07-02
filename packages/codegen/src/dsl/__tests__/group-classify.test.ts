import { describe, it, expect } from 'vitest';
import { ruleMatchesEmpty, isInlineSafe } from '../group-classify.ts';

const str = (v: string) => ({ type: 'STRING', value: v });
const sym = (n: string) => ({ type: 'SYMBOL', name: n });
const field = (n: string, c: any) => ({ type: 'FIELD', name: n, content: c });
const seq = (...m: any[]) => ({ type: 'SEQ', members: m });
const choice = (...m: any[]) => ({ type: 'CHOICE', members: m });
const opt = (c: any) => ({ type: 'OPTIONAL', content: c });

describe('ruleMatchesEmpty', () => {
  it('non-empty string seq is not empty', () => expect(ruleMatchesEmpty(seq(str('as'), sym('x')))).toBe(false));
  it('all-optional seq matches empty', () => expect(ruleMatchesEmpty(seq(opt(sym('a')), opt(sym('b'))))).toBe(true));
  it('symbol is conservatively non-empty', () => expect(ruleMatchesEmpty(sym('x'))).toBe(false));
});

describe('isInlineSafe — exactly 1 non-choice field/symbol slot after dropping literals', () => {
  it('clause seq(STRING, field) is inline-safe', () => expect(isInlineSafe(seq(str('as'), field('alias', sym('expr'))))).toBe(true));
  it('field wrapping a choice is inline-safe (field is the slot, not the choice inside)', () => expect(isInlineSafe(seq(field('sign', choice(str('-'), str('+'))), str('readonly')))).toBe(true));
  it('bare choice slot is NOT inline-safe', () => expect(isInlineSafe(seq(str('('), choice(sym('self'), sym('super')), str(')')))).toBe(false));
  it('two slots is NOT inline-safe', () => expect(isInlineSafe(seq(field('name', sym('id')), field('val', sym('expr'))))).toBe(false));
  // A seq whose (only) slot-bearing member is a top-level repeat/repeat1 is a
  // LIST (e.g. enum_body's `{ repeat1(choice(member, enum_assignment)) }`) → it
  // stays inline-flat, NOT a co-optional visible group. seqHasTopLevelRepeat
  // routes it inline-safe so tree-sitter never distributes an alias across the
  // list elements.
  it('seq(repeat1(choice(...))) is a LIST → inline-safe (stays flat, off alias path)', () => expect(isInlineSafe(seq({ type: 'REPEAT1', content: choice(field('name', sym('id')), sym('enum_assignment')) }))).toBe(true));

  // Bare repeat/repeat1 body = a LIST = one flat slot → inline-safe (stays
  // inline-flat off the alias path; e.g. formal_parameters, class_body, enum_body).
  it('bare repeat1 body is inline-safe (a list is one flat slot)', () => expect(isInlineSafe({ type: 'REPEAT1', content: field('parameter', sym('parameter')) })).toBe(true));
  it('bare repeat body is inline-safe', () => expect(isInlineSafe({ type: 'REPEAT', content: sym('statement') })).toBe(true));
  // Flat separated-list `commaSep1(E)` = `seq(E, repeat(seq(SEP, E)), optional(SEP))`
  // is ONE logical repeated slot → inline-flat. The top-level `repeat` member is
  // caught by seqHasTopLevelRepeat (formerly a dedicated isSeparatedList probe).
  it('flat separated-list seq(E, repeat(seq(SEP,E)), opt(SEP)) is inline-safe', () => expect(isInlineSafe(seq(sym('expr'), { type: 'REPEAT', content: seq(str(','), sym('expr')) }, opt(str(','))))).toBe(true));
});
