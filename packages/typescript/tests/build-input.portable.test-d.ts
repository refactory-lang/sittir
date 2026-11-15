import type * as V from '../../types/src/vocabulary/index.ts';
import type { TypeScriptMap } from '../src/portable/map.ts';

type Element = NonNullable<V.BuildInput<TypeScriptMap, 'expression.collection.list'>['elements']>[number];

export const byValue: Element = { $path: 'literal.number', $value: 1 };
export const byBigint: Element = { $path: 'literal.number', $value: 1n };
// @ts-expect-error literal.number builds from a number or a bigint, never text
export const byText: Element = { $path: 'literal.number', $value: '1' };

declare const qualifiedRead: V.Read<TypeScriptMap, 'identifier.qualified'>;
// @ts-expect-error a class's name reads only as an identifier, never a qualified name
export const qualifiedClassName: V.BuildInput<TypeScriptMap, 'declaration.class'>['name'] = qualifiedRead;

declare const callRead: V.Read<TypeScriptMap, 'expression.call'>;
// @ts-expect-error an import type's source reads only as a string literal
export const callImportSource: V.BuildInput<TypeScriptMap, 'type.import'>['source'] = callRead;
