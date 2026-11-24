import type * as V from '../../types/src/vocabulary/index.ts';
import type { PythonMap } from '../src/portable/map.ts';

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

export const assigned: In<'declaration.constant'> = { $path: 'declaration.constant', name, value };
export const annotated: In<'declaration.constant'> = { $path: 'declaration.constant', name, type };
export const both: In<'declaration.constant'> = { $path: 'declaration.constant', name, type, value };
// @ts-expect-error a python constant states its value, its type or both
export const neither: In<'declaration.constant'> = { $path: 'declaration.constant', name };

export const variadic: In<'declaration.type_parameter.variadic'> = { $path: 'declaration.type_parameter.variadic', name: parameterName };
// @ts-expect-error a variadic type parameter takes no bounds
export const boundedVariadic: In<'declaration.type_parameter.variadic'> = { $path: 'declaration.type_parameter.variadic', name: parameterName, bounds: [bound] };
// @ts-expect-error a variadic type parameter is never const
export const constVariadic: In<'declaration.type_parameter.variadic'> = { $path: 'declaration.type_parameter.variadic', name: parameterName, $flags: ['const'] };
export const parameters: In<'declaration.type_parameter.parameters'> = { $path: 'declaration.type_parameter.parameters', name: parameterName };
// @ts-expect-error a parameter-list type parameter takes no bounds
export const boundedParameters: In<'declaration.type_parameter.parameters'> = { $path: 'declaration.type_parameter.parameters', name: parameterName, bounds: [bound] };
// @ts-expect-error a parameter-list type parameter is never const
export const constParameters: In<'declaration.type_parameter.parameters'> = { $path: 'declaration.type_parameter.parameters', name: parameterName, $flags: ['const'] };

export const textName: In<'declaration.constant'> = { $path: 'declaration.constant', name: 'x', value };

declare const caseStatements: NonNullable<At<'clause.case.match'>['statements']>;
export const wildcard: In<'clause.case.match'> = { $path: 'clause.case.match', pattern: '_', statements: caseStatements };
// a bare number in a pattern is a number pattern, never a kind id
export const numberPattern: In<'clause.case.match'> = { $path: 'clause.case.match', pattern: 1, statements: caseStatements };

declare const functionName: At<'declaration.function'>['name'];
declare const statement: At<'statement.empty'>;
export const functionStatements: In<'declaration.function'> = { $path: 'declaration.function', name: functionName, parameters: [], statements: [statement] };
// @ts-expect-error a function's statements are a list, never a bare statement
export const bareStatements: In<'declaration.function'> = { $path: 'declaration.function', name: functionName, parameters: [], statements: statement };
// @ts-expect-error a function holds its statements, never a body
export const functionBody: In<'declaration.function'> = { $path: 'declaration.function', name: functionName, parameters: [], body: [statement] };

export const catchStatements: In<'clause.catch'> = { $path: 'clause.catch', statements: [statement] };
// @ts-expect-error a catch's statements are a list, never a bare statement
export const bareCatchStatements: In<'clause.catch'> = { $path: 'clause.catch', statements: statement };
// @ts-expect-error a catch holds its statements, never a body
export const catchBody: In<'clause.catch'> = { $path: 'clause.catch', body: [statement] };

declare const globalName: At<'statement.global'>['names'][number];
export const oneGlobal: In<'statement.global'> = { $path: 'statement.global', names: [globalName] };
// @ts-expect-error a global statement names at least one name
export const noGlobals: In<'statement.global'> = { $path: 'statement.global', names: [] };
