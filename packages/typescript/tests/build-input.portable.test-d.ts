import type * as V from '../../types/src/vocabulary/index.ts';
import type { TypeScriptMap } from '../src/portable/map.ts';

type Element = NonNullable<V.BuildInput<TypeScriptMap, 'expression.collection.list'>['elements']>[number];

export const byValue: Element = { $path: 'literal.number', $value: 1 };
export const byBigint: Element = { $path: 'literal.number', $value: 1n };
// @ts-expect-error literal.number builds from a number or a bigint, never text
export const byText: Element = { $path: 'literal.number', $value: '1' };
