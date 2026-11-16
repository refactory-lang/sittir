import type * as V from '../../types/src/vocabulary/index.ts';
import type { TypeScriptMap } from '../src/portable/map.ts';

type Element = NonNullable<V.BuildInput<TypeScriptMap, 'expression.collection.list'>['elements']>[number];

export const byValue: Element = { $path: 'literal.number', $value: 1 };
export const byBigint: Element = { $path: 'literal.number', $value: 1n };
// @ts-expect-error literal.number builds from a number or a bigint, never text
export const byText: Element = { $path: 'literal.number', $value: '1' };

declare const callRead: V.Read<TypeScriptMap, 'expression.call'>;
// @ts-expect-error an import type's source reads only as a string literal
export const callImportSource: V.BuildInput<TypeScriptMap, 'type.import'>['source'] = callRead;

export const classDecorators: V.BuildInput<TypeScriptMap, 'declaration.class'>['decorators'] = ['x'];
// @ts-expect-error a decorator reads as its expression, so no path names the decorator
export const decoratorPath: V.Read<TypeScriptMap, 'attribute.decorator'> = { $path: 'attribute.decorator' };
// @ts-expect-error an import clause holds its specifiers as its names, never as content
export const clauseContent: V.BuildInput<TypeScriptMap, 'clause.import.names'>['content'] = [];
// @ts-expect-error an ambient declaration holds its declaration as its body, never as content
export const ambientContent: V.BuildInput<TypeScriptMap, 'declaration.ambient'>['content'] = 'x';
export const comment: V.BuildInput<TypeScriptMap, 'comment.line'> = { $path: 'comment.line', $value: ' x' };
export const escape: V.BuildInput<TypeScriptMap, 'literal.string.escape'> = { $path: 'literal.string.escape', $value: 'n' };
