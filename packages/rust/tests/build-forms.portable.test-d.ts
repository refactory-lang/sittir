import type { Ctx } from '../.sittir/portable.typed.ts';

declare const name: Ctx['identifier'];
declare const value: Ctx['expression'];
declare const type: Ctx['type'];
declare const attribute: Ctx['attribute'];

export const attributed: Ctx['argument'] = { $kind: 'argument', attributes: [attribute], value };
// @ts-expect-error the portable argument is the attributed one, so it needs its attributes
export const bare: Ctx['argument'] = { $kind: 'argument', value };

export const closed: Ctx['expression'] = { $kind: 'expression.range.inclusive', start: value, end: value };
// @ts-expect-error an inclusive range needs its end
export const unclosed: Ctx['expression'] = { $kind: 'expression.range.inclusive', start: value };
export const open: Ctx['expression'] = { $kind: 'expression.range', start: value };

export const typed: Ctx['declaration'] = { $kind: 'declaration.constant', name, type, value };
// @ts-expect-error a rust constant states its type
export const untyped: Ctx['declaration'] = { $kind: 'declaration.constant', name, value };
