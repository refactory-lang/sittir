import type * as V from '../../types/src/vocabulary/index.ts';
import type { PythonMap } from '../src/portable/map.ts';

type Equal<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
type Expect<X extends true> = X;
type At<P extends keyof V.Paths<PythonMap>> = V.BuildInput<PythonMap, P> extends { readonly $at?: infer A } ? NonNullable<A> : never;

export type MethodFacts = Expect<Equal<keyof At<'declaration.member.method'>, 'override' | 'static'>>;
export type OverrideSpellings = Expect<Equal<NonNullable<NonNullable<At<'declaration.member.method'>['override']>['spelling']>, 'override' | 'typing.override'>>;
export type SetterSpelling = Expect<Equal<NonNullable<NonNullable<At<'declaration.member.property.setter'>['setter']>['spelling']>, `${string}.setter`>>;
export type ReadsTypeTheSameFacts = Expect<Equal<NonNullable<V.Read<PythonMap, 'declaration.member.method'>['$at']>, At<'declaration.member.method'>>>;
export type NoFactsNoAt = Expect<'$at' extends keyof V.BuildInput<PythonMap, 'statement.return'> ? false : true>;

export const spelled: At<'declaration.member.method'> = { override: { index: 0, spelling: 'typing.override' }, static: { index: 1 } };
// @ts-expect-error a spelling the grammar stamps for no override is no override's spelling
export const misspelled: At<'declaration.member.method'> = { override: { index: 0, spelling: 'overrides' } };
// @ts-expect-error a method's container spells no getter
export const foreign: At<'declaration.member.method'> = { getter: { index: 0 } };
// @ts-expect-error a fact's place among the container's items is its index
export const unindexed: At<'declaration.member.method'> = { override: { spelling: 'override' } };
export const setter: At<'declaration.member.property.setter'> = { setter: { index: 0, spelling: 'x.setter' } };
// @ts-expect-error a setter's spelling ends in .setter
export const setterMisspelled: At<'declaration.member.property.setter'> = { setter: { index: 0, spelling: 'x.getter' } };

type Statement = NonNullable<V.BuildInput<PythonMap, 'statement.block'>['statements']>[number];
type NestedMethod = Extract<Statement, { readonly $path?: 'declaration.member.method' }>;

export type NestedMethodFacts = Expect<Equal<keyof NonNullable<NestedMethod['$at']>, 'override' | 'static'>>;
