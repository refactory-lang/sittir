import type * as V from '../../types/src/vocabulary/index.ts';
import type * as T from '../src/types.ts';
import type * as TS from '../../typescript/src/types.ts';
import type { PythonMap } from '../src/portable/map.ts';

type Expect<X extends true> = X;
type Getter = V.BuildInput<PythonMap, 'declaration.member.property.getter'>;

export type GetterFlagsAdmitAsync = Expect<'async' extends NonNullable<Getter['$flags']>[number] ? true : false>;
export type GetterFlagsAdmitOverride = Expect<'override' extends NonNullable<Getter['$flags']>[number] ? true : false>;
export type GetterTakesNoParameters = Expect<'parameters' extends keyof Getter ? false : true>;

declare const statement: T.ImportStatement.Bound;
declare const foreign: TS.StatementBlock.Bound;

export const ownStatement: NonNullable<Getter['statements']>[number] = statement;
// @ts-expect-error a typescript node is no python getter's statement
export const foreignStatement: NonNullable<Getter['statements']>[number] = foreign;

type Constant = V.BuildInput<PythonMap, 'declaration.constant'>;

declare const identifier: T.Identifier.Bound;
declare const dotted: T.DottedName.Bound;

export const identifierName: Constant['name'] = identifier;
// @ts-expect-error a dotted name reads as identifier.qualified, which a constant's name never holds
export const dottedName: Constant['name'] = dotted;

type ConstantRead = V.Read<PythonMap, 'declaration.constant'>;

export const readName: ConstantRead['name'] = 'X';
export const readValuedName: ConstantRead['name'] = { $path: 'identifier', $value: 'X' };
export const valuedName: Constant['name'] = { $path: 'identifier', $value: 'x' };
// @ts-expect-error an identifier builds from its text, so a path without a $value builds nothing
export const pathOnlyName: Constant['name'] = { $path: 'identifier' };

export const valuedIdentifier: V.BuildInput<PythonMap, 'identifier'> = { $path: 'identifier', $value: 'x' };
// @ts-expect-error an identifier builds from its text, so a path without a $value builds nothing
export const pathOnlyIdentifier: V.BuildInput<PythonMap, 'identifier'> = { $path: 'identifier' };

export const qualified: V.BuildInput<PythonMap, 'identifier.qualified'> = { $path: 'identifier.qualified', name: 'y' };
// @ts-expect-error a qualified identifier builds from its slots, never from a text
export const valuedQualified: V.BuildInput<PythonMap, 'identifier.qualified'> = { $path: 'identifier.qualified', name: 'y', $value: 'x.y' };

type StringRead = V.Read<PythonMap, 'literal.string'>;

export const readText: NonNullable<StringRead['elements']>[number] = { $path: 'literal.string.text', $value: 'ab' };
// @ts-expect-error a string's text builds from its text, so a path without a $value builds nothing
export const pathOnlyText: V.BuildInput<PythonMap, 'literal.string.text'> = { $path: 'literal.string.text' };

export const breakStatement: V.BuildInput<PythonMap, 'statement.break'> = { $path: 'statement.break' };

type Function = V.BuildInput<PythonMap, 'declaration.function'>;
declare const dottedRead: V.Read<PythonMap, 'identifier.qualified'>;

export const functionName: Function['name'] = 'f';
// @ts-expect-error a function's name reads only as an identifier, never a dotted name
export const dottedFunctionName: Function['name'] = dottedRead;

declare const aliasRead: V.Read<PythonMap, 'clause.import.alias'>;
export const fromImportNames: V.BuildInput<PythonMap, 'statement.import.from'>['names'] = [aliasRead, '*'];
// @ts-expect-error a from-import holds what it imports as its names, never as content
export const fromImportContent: V.BuildInput<PythonMap, 'statement.import.from'>['content'] = [aliasRead];

declare const memberRead: V.Read<PythonMap, 'expression.member'>;
export const classDecorators: V.Read<PythonMap, 'declaration.type.class'>['decorators'] = ['cache', memberRead];
// @ts-expect-error a decorator reads as its expression, so no path names the decorator
export const decoratorPath: V.Read<PythonMap, 'attribute.decorator'> = { $path: 'attribute.decorator' };

export const annotation: V.BuildInput<PythonMap, 'declaration.variable'>['type'] = 'int';
export const annotationMember: V.BuildInput<PythonMap, 'declaration.function'>['returnType'] = memberRead;

export const comment: V.BuildInput<PythonMap, 'comment.line'> = { $path: 'comment.line', $value: ' x' };
// @ts-expect-error a comment builds from its text, never from a content slot
export const commentContent: V.BuildInput<PythonMap, 'comment.line'> = { $path: 'comment.line', content: ' x' };
export const escape: V.BuildInput<PythonMap, 'literal.string.escape'> = { $path: 'literal.string.escape', $value: 'n' };
// @ts-expect-error a yield holds its operand as its expression, never as content
export const yieldContent: V.BuildInput<PythonMap, 'expression.yield'>['content'] = 'x';

export const formatSpec: NonNullable<V.Read<PythonMap, 'expression.interpolation.format'>['elements']>[number] = '>10';

type Hex = V.BuildInput<PythonMap, 'literal.number.integer.hex'>;
type Float = V.BuildInput<PythonMap, 'literal.number.float'>;

export const hexRead: V.Read<PythonMap, 'literal.number.integer.hex'> = { $path: 'literal.number.integer.hex', $value: 31 };
export const hexValue: Hex = { $path: 'literal.number.integer.hex', $value: 31 };
// @ts-expect-error a radix prefix is an option, set on the built node, never in the structure
export const hexPrefix: Hex = { $path: 'literal.number.integer.hex', $value: 31, radixPrefix: '0X' };
export const floatValue: Float = { $path: 'literal.number.float', $value: 1.5 };
// @ts-expect-error a number's digits are written from its $value, never given beside it
export const floatDigits: Float = { $path: 'literal.number.float', $value: 1.5, integer: '1' };
export const longValue: V.BuildInput<PythonMap, 'literal.number.integer.big'> = { $path: 'literal.number.integer.big', $value: 10n };
// @ts-expect-error a long integer's marker is an option, set on the built node, never in the structure
export const longMarker: V.BuildInput<PythonMap, 'literal.number.integer.big'> = { $path: 'literal.number.integer.big', $value: 10n, marker: 'L' };

type Returned = V.BuildInput<PythonMap, 'statement.return'>['expression'];

export const integerReturned: Returned = 1;
export const floatReturned: Returned = 1.5;
export const bigintReturned: Returned = 10n;
export const orReturned: Returned = { $path: 'expression.binary.bitwise.or', left: 'a', right: 'b' };
// @ts-expect-error expression.binary has no arm in python's build table, so no build takes it
export const familyReturned: Returned = { $path: 'expression.binary', left: 'a', right: 'b' };
