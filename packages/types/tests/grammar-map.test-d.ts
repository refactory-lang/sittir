import type * as V from '../src/vocabulary/index.ts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

interface Fixture extends V.GrammarMap {
	readonly features: V.PythonFeatures;
	readonly overrides: {
		readonly 'expression.call': { readonly function: V.Expression.Member<Fixture> };
	};
	readonly inputs: {};
}

export type FixtureFits = V.Assert<V.Fits<Fixture>>;

export type OverrideIsTheMember = Expect<
	Equal<V.Expression.Call<Fixture>['function'], V.Expression.Member<Fixture> | undefined>
>;

export type UnoverriddenMemberIsItsDefault = Expect<
	Equal<
		V.Expression.Member<Fixture>['object'],
		| V.Declaration.Module<Fixture>
		| V.Expression.Any<Fixture>
		| V.Identifier.Any<Fixture>
		| V.Literal.Any<Fixture>
		| V.Pattern.Rest<Fixture>
		| V.Statement.Any<Fixture>
		| V.Unmapped
	>
>;

interface Wider extends V.GrammarMap {
	readonly features: V.PythonFeatures;
	readonly overrides: {
		readonly 'expression.call': { readonly function: V.Expression.Member<Wider> | V.Clause.Else<Wider> };
	};
	readonly inputs: {};
}

// @ts-expect-error an override admitting a kind outside its default does not fit
export type WiderFits = V.Assert<V.Fits<Wider>>;

export type WiderNamesTheMember = Expect<Equal<V.Fits<Wider>, { readonly fitsNoDefault: 'expression.call.function' }>>;

interface Undeclared extends V.GrammarMap {
	readonly features: V.PythonFeatures;
	readonly overrides: {
		readonly 'expression.call': { readonly callee: V.Expression.Member<Undeclared> };
	};
	readonly inputs: {};
}

// @ts-expect-error an override keyed by a member the path does not declare does not fit
export type UndeclaredFits = V.Assert<V.Fits<Undeclared>>;

interface Unpathed extends V.GrammarMap {
	readonly features: V.PythonFeatures;
	readonly overrides: {
		readonly 'expression.callable': { readonly function: V.Expression.Member<Unpathed> };
	};
	readonly inputs: {};
}

// @ts-expect-error an override keyed by a path the vocabulary does not declare does not fit
export type UnpathedFits = V.Assert<V.Fits<Unpathed>>;

interface Texts extends V.GrammarMap {
	readonly features: V.TypeScriptFeatures;
	readonly overrides: {
		readonly 'type.primitive.unchecked': { readonly $text: 'any' };
	};
	readonly inputs: {};
}

export type TextsFit = V.Assert<V.Fits<Texts>>;

export type TextOverrideIsTheText = Expect<Equal<V.Type.Primitive.Unchecked<Texts>, 'any'>>;

export type UnoverriddenTextIsString = Expect<Equal<V.Type.Primitive.Unknown<Texts>, string>>;
