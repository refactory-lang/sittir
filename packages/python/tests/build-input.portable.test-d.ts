import type * as V from '../../types/src/vocabulary/index.ts';
import type * as T from '../src/types.ts';
import type * as TS from '../../typescript/src/types.ts';
import type { PythonMap } from '../src/portable/map.ts';

type Expect<X extends true> = X;
type Getter = V.BuildInput<PythonMap, 'declaration.property.getter'>;

export type GetterFlagsAdmitAsync = Expect<'async' extends NonNullable<Getter['$flags']>[number] ? true : false>;
export type GetterFlagsAdmitOverride = Expect<'override' extends NonNullable<Getter['$flags']>[number] ? true : false>;

declare const block: T.Block.Bound;
declare const foreign: TS.StatementBlock.Bound;

export const blockBody: Getter['body'] = block;
// @ts-expect-error a typescript node is no python getter's body
export const foreignBody: Getter['body'] = foreign;

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
// @ts-expect-error a qualified identifier builds from its members, never from a text
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
// @ts-expect-error a from-import reads what it imports as its content, never as names
export const fromImportNames: V.BuildInput<PythonMap, 'statement.import.from'>['names'] = [aliasRead];

declare const decoratorRead: V.Read<PythonMap, 'attribute.decorator'>;
export const classDecorators: V.Read<PythonMap, 'declaration.class'>['decorators'] = [decoratorRead];

export const formatSpec: NonNullable<V.Read<PythonMap, 'expression.interpolation.format'>['elements']>[number] = '>10';
