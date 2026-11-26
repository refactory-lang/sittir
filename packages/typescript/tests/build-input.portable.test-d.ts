import type * as V from '../../types/src/vocabulary/index.ts';
import type { TypeScriptMap } from '../src/portable/map.ts';
import { TSKindId } from '../src/kinds.ts';

type Element = NonNullable<V.BuildInput<TypeScriptMap, 'expression.collection.list'>['elements']>[number];

export const byValue: Element = { $path: 'literal.number', $value: 1 };
export const byBigint: Element = { $path: 'literal.number', $value: 1n };
// @ts-expect-error literal.number builds from a number or a bigint, never text
export const byText: Element = { $path: 'literal.number', $value: '1' };

declare const callRead: V.Read<TypeScriptMap, 'expression.call'>;
// @ts-expect-error an import type's source reads only as a string literal
export const callImportSource: V.BuildInput<TypeScriptMap, 'type.import'>['source'] = callRead;

type Getter = V.BuildInput<TypeScriptMap, 'declaration.member.property.getter'>;
type Expect<X extends true> = X;
export type GetterTakesNoParameters = Expect<'parameters' extends keyof Getter ? false : true>;

export const classDecorators: V.BuildInput<TypeScriptMap, 'declaration.type.class'>['decorators'] = ['x'];
// @ts-expect-error a decorator reads as its expression, so no path names the decorator
export const decoratorPath: V.Read<TypeScriptMap, 'attribute.decorator'> = { $path: 'attribute.decorator' };
// @ts-expect-error an import clause holds its specifiers as its names, never as content
export const clauseContent: V.BuildInput<TypeScriptMap, 'clause.import.names'>['content'] = [];
// @ts-expect-error an ambient declaration holds its declaration as its body, never as content
export const ambientContent: V.BuildInput<TypeScriptMap, 'declaration.ambient'>['content'] = 'x';
export const comment: V.BuildInput<TypeScriptMap, 'comment.line'> = { $path: 'comment.line', $value: ' x' };
export const escape: V.BuildInput<TypeScriptMap, 'literal.string.escape'> = { $path: 'literal.string.escape', $value: 'n' };

type Scientific = V.BuildInput<TypeScriptMap, 'literal.number.float.scientific'>;

export const scientificRead: V.Read<TypeScriptMap, 'literal.number.float.scientific'> = { $path: 'literal.number.float.scientific', $value: 100000 };
export const scientificValue: Scientific = { $path: 'literal.number.float.scientific', $value: 100000 };
// @ts-expect-error an exponent marker is an option, set on the built node, never in the structure
export const scientificMarker: Scientific = { $path: 'literal.number.float.scientific', $value: 100000, marker: 'E' };
// @ts-expect-error a radix prefix is an option, set on the built node, never in the structure
export const binaryPrefix: V.BuildInput<TypeScriptMap, 'literal.number.integer.binary'> = { $path: 'literal.number.integer.binary', $value: 5, radixPrefix: '0B' };

type Returned = V.BuildInput<TypeScriptMap, 'statement.return'>['expression'];

export const integerReturned: Returned = 1;
export const floatReturned: Returned = 1.5;
export const bigintReturned: Returned = 10n;

type CaseStatements = V.BuildInput<TypeScriptMap, 'clause.case.switch'>['statements'];
type CaseStatementRead = NonNullable<V.Read<TypeScriptMap, 'clause.case.switch'>['statements']>[number];

declare const variableRead: V.Read<TypeScriptMap, 'declaration.variable'>;
declare const constantRead: V.Read<TypeScriptMap, 'declaration.variable.constant'>;
export const variablePath: [Extract<V.Read<TypeScriptMap, 'declaration.variable'>, { readonly $path: 'declaration.variable' }>] extends [never] ? false : true = true;
export const caseConstant: CaseStatements = [constantRead];
// @ts-expect-error a lexical declaration always reads as a constant or a reassignable declaration, so no statement slot holds a bare variable declaration
export const caseVariable: CaseStatements = [variableRead];
export const caseReadsNoVariable: [Extract<CaseStatementRead, { readonly $path: 'declaration.variable' }>] extends [never] ? true : false = true;

export const bodilessModule: V.Read<TypeScriptMap, 'declaration.module.external'> = { $path: 'declaration.module.external', name: 'm' };
export const emptyModule: V.BuildInput<TypeScriptMap, 'declaration.module'> = { $path: 'declaration.module', name: 'M', statements: [] };

type ArgumentValue = V.BuildInput<TypeScriptMap, 'argument'>['value'];

export const nullStructure: ArgumentValue = { $path: 'literal.null' };
export const nullRead: V.Read<TypeScriptMap, 'argument'>['value'] = { $path: 'literal.null' };
// @ts-expect-error a fixed word reads as its structure, never as a bare kind id
export const nullKindId: V.Read<TypeScriptMap, 'argument'>['value'] = TSKindId.Null;
