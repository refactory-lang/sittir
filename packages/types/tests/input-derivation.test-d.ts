import type * as V from '../src/vocabulary/index.ts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
type Admits<I, T> = [T] extends [I] ? true : false;

interface Fixture<I extends object = { readonly identifier: string }> extends V.GrammarMap {
	readonly features: V.PythonFeatures;
	readonly overrides: {
		readonly 'declaration.constant': {
			readonly name: V.Read<Fixture<I>, 'identifier'>;
			readonly $forms:
				| V.Form<'name' | 'value', 'type'>
				| V.Form<'name' | 'type', 'value'>
				| V.Form<'name' | 'type' | 'value'>;
		};
		readonly 'expression.binary': {
			readonly left: V.Read<Fixture<I>, 'literal.number.integer'> | V.Read<Fixture<I>, 'identifier'>;
			readonly operator: '+' | '-';
			readonly $forms:
				| V.Form<'left', never, { readonly left: V.Read<Fixture<I>, 'literal.number.integer'> }>
				| V.Form<never, 'left'>;
		};
		readonly 'literal.boolean': { readonly $forms: V.Form<never, never, { readonly $value: true }> };
	};
	readonly inputs: I;
}

type Textless = Fixture<{}>;

export type FixtureFits = V.Assert<V.Fits<Fixture>>;

type Constant = V.InputOf<V.Declaration.Constant<Fixture>, Fixture>;
type Binary = V.InputOf<V.Expression.Binary<Fixture>, Fixture>;

declare const name: V.Read<Fixture, 'identifier'>;
declare const integer: V.Read<Fixture, 'literal.number.integer'>;
declare const type: NonNullable<V.Declaration.Constant<Fixture>['type']>;

export const assigned: Constant = { $path: 'declaration.constant', name, value: integer };
export const annotated: Constant = { $path: 'declaration.constant', name, type };
export const both: Constant = { $path: 'declaration.constant', name, type, value: integer };
// @ts-expect-error a constant states its value, its type or both
export const neither: Constant = { $path: 'declaration.constant', name };
// @ts-expect-error a read constant states its value, its type or both
export const readNeither: V.Read<Fixture, 'declaration.constant'> = { $path: 'declaration.constant', name };

export const textBuilt: Constant = { $path: 'declaration.constant', name: 'x', value: integer };
// @ts-expect-error a member whose paths the grammar builds from no text refuses bare text
export const textless: V.InputOf<V.Declaration.Constant<Textless>, Textless> = { $path: 'declaration.constant', name: 'x', value: integer };

export const token: Binary = { $path: 'expression.binary', operator: '+' };
// @ts-expect-error a token member takes its text, never a kind id
export const kindId: Binary = { $path: 'expression.binary', operator: 7 };
// @ts-expect-error a token member takes only the texts the grammar reads at it
export const unread: Binary = { $path: 'expression.binary', operator: '*' };

export const narrowed: Binary = { $path: 'expression.binary', left: integer };
// @ts-expect-error a member a form narrows refuses a value outside the narrowed set
export const outsideNarrowed: Binary = { $path: 'expression.binary', left: name };

export type BooleanFormNarrowsTheValue = Expect<Equal<V.Read<Fixture, 'literal.boolean'>['$value'], true>>;

export type ReadFitsInput = Expect<Admits<Constant, V.Read<Fixture, 'declaration.constant'>>>;

export type NarrowedReadFitsInput = Expect<Admits<Binary, V.Read<Fixture, 'expression.binary'>>>;

export type ReadOfHoldsTheFormedRead = Expect<
	Equal<Extract<V.ReadOf<Fixture>, { readonly $path: 'declaration.constant' }>, V.Read<Fixture, 'declaration.constant'>>
>;

type Agnostic = V.Contract<V.PythonFeatures>;

export const contractText: V.InputOf<V.Declaration.Constant<Agnostic>, Agnostic> = { $path: 'declaration.constant', name: 'x' };

interface Misnarrowed extends V.GrammarMap {
	readonly features: V.PythonFeatures;
	readonly overrides: {
		readonly 'expression.binary': {
			readonly left: V.Read<Misnarrowed, 'literal.number.integer'>;
			readonly $forms: V.Form<'left', never, { readonly left: V.Read<Misnarrowed, 'identifier'> }>;
		};
	};
	readonly inputs: {};
}

// @ts-expect-error a form narrowing a member beyond the member's override does not fit
export type MisnarrowedFits = V.Assert<V.Fits<Misnarrowed>>;
