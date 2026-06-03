import { describe, it, expect } from 'vitest';
import { ruleMatchesEmpty, isInlineSafe } from '../group-classify.ts';

const str = (v: string) => ({ type: 'string', value: v });
const sym = (n: string) => ({ type: 'symbol', name: n });
const field = (n: string, c: any) => ({ type: 'field', name: n, content: c });
const seq = (...m: any[]) => ({ type: 'seq', members: m });
const choice = (...m: any[]) => ({ type: 'choice', members: m });
const opt = (c: any) => ({ type: 'optional', content: c });

describe('ruleMatchesEmpty', () => {
  it('non-empty string seq is not empty', () => expect(ruleMatchesEmpty(seq(str('as'), sym('x')))).toBe(false));
  it('all-optional seq matches empty', () => expect(ruleMatchesEmpty(seq(opt(sym('a')), opt(sym('b'))))).toBe(true));
  it('symbol is conservatively non-empty', () => expect(ruleMatchesEmpty(sym('x'))).toBe(false));
});

describe('isInlineSafe — exactly 1 non-choice field/symbol slot after dropping literals', () => {
  it('clause seq(STRING, field) is inline-safe', () => expect(isInlineSafe(seq(str('as'), field('alias', sym('expr'))))).toBe(true));
  it('bare choice slot is NOT inline-safe', () => expect(isInlineSafe(seq(str('('), choice(sym('self'), sym('super')), str(')')))).toBe(false));
  it('two slots is NOT inline-safe', () => expect(isInlineSafe(seq(field('name', sym('id')), field('val', sym('expr'))))).toBe(false));
  it('repeat1(choice(...)) body is NOT inline-safe', () => expect(isInlineSafe(seq({ type: 'repeat1', content: choice(field('name', sym('id')), sym('enum_assignment')) }))).toBe(false));
});
