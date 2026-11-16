import type * as V from '../../types/src/vocabulary/index.ts';
import type { TypeScriptMap } from '../src/portable/map.ts';
import type { At, In } from './build-forms.portable.test-d.ts';

declare const qualifiedRead: At<'identifier.qualified'>;
// @ts-expect-error a class's name reads only as an identifier, never a qualified name
export const qualifiedClassName: V.BuildInput<TypeScriptMap, 'declaration.class'>['name'] = qualifiedRead;

declare const sequence: At<'expression.sequence'>;
declare const type: NonNullable<At<'expression.parenthesized'>['type']>;

declare const typed: { readonly $path: 'expression.parenthesized'; readonly expression: typeof sequence; readonly type: typeof type };

// @ts-expect-error a parenthesized sequence takes no type: the literal mixes the sequence form's expression with the typed form's type
export const typedSequence: In<'expression.parenthesized'> = { $path: 'expression.parenthesized', expression: sequence, type };
// @ts-expect-error a parenthesized sequence takes no type, from a declared value as from a literal
export const declaredTypedSequence: In<'expression.parenthesized'> = typed;
