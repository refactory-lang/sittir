import type { Ctx } from '../.sittir/portable.typed.ts';

declare const name: Ctx['identifier'];
declare const value: Ctx['expression'];
declare const type: Ctx['slots']['declaration.constant']['type'];

export const assigned: Ctx['declaration'] = { $kind: 'declaration.constant', name, value };
export const annotated: Ctx['declaration'] = { $kind: 'declaration.constant', name, type };
export const both: Ctx['declaration'] = { $kind: 'declaration.constant', name, type, value };
// @ts-expect-error a python constant states its value, its type or both
export const neither: Ctx['declaration'] = { $kind: 'declaration.constant', name };
