import type * as V from '../../types/src/vocabulary/index.ts';
import type { Flag } from '../../types/src/vocabulary/utils.ts';
import type { PythonMap } from '../src/portable-map.ts';

type Path = keyof V.Paths<PythonMap>;
type At<P extends Path> = V.Read<PythonMap, P>;
type In<P extends Path> = V.InputOf<V.Paths<PythonMap>[P], PythonMap>;
type Unfit = { [P in Path]: [At<P>] extends [In<P>] ? never : P }[Path];

export const readsFitInputs: [Unfit] extends [never] ? true : Unfit = true;

declare const name: At<'declaration.constant'>['name'];
declare const value: NonNullable<At<'declaration.constant'>['value']>;
declare const type: NonNullable<At<'declaration.constant'>['type']>;
declare const bound: NonNullable<At<'declaration.type_parameter'>['bounds']>[number];
declare const parameterName: At<'declaration.type_parameter.variadic'>['name'];
declare const flag: Flag;

export const assigned: In<'declaration.constant'> = { $path: 'declaration.constant', name, value };
export const annotated: In<'declaration.constant'> = { $path: 'declaration.constant', name, type };
export const both: In<'declaration.constant'> = { $path: 'declaration.constant', name, type, value };
// @ts-expect-error a python constant states its value, its type or both
export const neither: In<'declaration.constant'> = { $path: 'declaration.constant', name };

export const variadic: In<'declaration.type_parameter.variadic'> = { $path: 'declaration.type_parameter.variadic', name: parameterName };
// @ts-expect-error a variadic type parameter takes no bounds
export const boundedVariadic: In<'declaration.type_parameter.variadic'> = { $path: 'declaration.type_parameter.variadic', name: parameterName, bounds: [bound] };
// @ts-expect-error a variadic type parameter is never const
export const constVariadic: In<'declaration.type_parameter.variadic'> = { $path: 'declaration.type_parameter.variadic', name: parameterName, const: flag };
export const parameters: In<'declaration.type_parameter.parameters'> = { $path: 'declaration.type_parameter.parameters', name: parameterName };
// @ts-expect-error a parameter-list type parameter takes no bounds
export const boundedParameters: In<'declaration.type_parameter.parameters'> = { $path: 'declaration.type_parameter.parameters', name: parameterName, bounds: [bound] };
// @ts-expect-error a parameter-list type parameter is never const
export const constParameters: In<'declaration.type_parameter.parameters'> = { $path: 'declaration.type_parameter.parameters', name: parameterName, const: flag };

export const textName: In<'declaration.constant'> = { $path: 'declaration.constant', name: 'x', value };

declare const body: At<'clause.case.match'>['body'];
export const wildcard: In<'clause.case.match'> = { $path: 'clause.case.match', pattern: '_', body };
// @ts-expect-error a token member takes its text, never a kind id
export const wildcardId: In<'clause.case.match'> = { $path: 'clause.case.match', pattern: 1, body };

declare const functionName: At<'declaration.function'>['name'];
declare const block: At<'declaration.function'>['body'];
declare const statement: At<'statement.empty'>;
export const blockBody: In<'declaration.function'> = { $path: 'declaration.function', name: functionName, parameters: [], body: block };
// @ts-expect-error a body is the block of its statements, never a bare statement
export const bareBody: In<'declaration.function'> = { $path: 'declaration.function', name: functionName, parameters: [], body: statement };
// @ts-expect-error a body is one block, never a list of statements
export const listBody: In<'declaration.function'> = { $path: 'declaration.function', name: functionName, parameters: [], body: [statement] };
