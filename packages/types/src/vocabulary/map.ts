export interface GrammarMap {
	readonly features: object;
	readonly overrides: { readonly [path: string]: { readonly [member: string]: unknown } };
	readonly inputs: object;
}

export interface Contract<F extends object> extends GrammarMap {
	readonly features: F;
	readonly overrides: {};
	readonly inputs: {};
}

export interface Paths<G extends GrammarMap> {}

export interface TextPaths {
	readonly texts: {
		readonly 'clause.import.wildcard': string;
		readonly 'element.macro.fragment': string;
		readonly 'expression.call.import': string;
		readonly 'expression.meta': string;
		readonly 'expression.unit': string;
		readonly identifier: string;
		readonly 'identifier.receiver': string;
		readonly 'identifier.super': string;
		readonly 'modifier.visibility': string;
		readonly 'modifier.visibility.private': string;
		readonly 'modifier.visibility.protected': string;
		readonly 'modifier.visibility.public': string;
		readonly 'modifier.visibility.public.internal': string;
		readonly 'pattern.struct.rest': string;
		readonly 'pattern.wildcard': string;
		readonly 'statement.break': string;
		readonly 'statement.continue': string;
		readonly 'statement.empty': string;
		readonly 'type.existential': string;
		readonly 'type.primitive': string;
		readonly 'type.primitive.boolean': string;
		readonly 'type.primitive.character': string;
		readonly 'type.primitive.floating': string;
		readonly 'type.primitive.floating.float32': string;
		readonly 'type.primitive.floating.float64': string;
		readonly 'type.primitive.integral': string;
		readonly 'type.primitive.integral.int128': string;
		readonly 'type.primitive.integral.int16': string;
		readonly 'type.primitive.integral.int32': string;
		readonly 'type.primitive.integral.int64': string;
		readonly 'type.primitive.integral.int8': string;
		readonly 'type.primitive.integral.size': string;
		readonly 'type.primitive.never': string;
		readonly 'type.primitive.object': string;
		readonly 'type.primitive.string': string;
		readonly 'type.primitive.symbol': string;
		readonly 'type.primitive.unchecked': string;
		readonly 'type.primitive.unknown': string;
		readonly 'type.primitive.void': string;
		readonly 'type.receiver': string;
		readonly 'type.unit': string;
	};
}

export interface UnmappedKinds {}

export type Unmapped<K extends string = string> = K extends keyof UnmappedKinds
	? UnmappedKinds[K]
	: { readonly $type: number };

export type NamespaceOf<P> = P extends `${infer Namespace}.${string}` ? Namespace : P;

type Override<G extends GrammarMap, P extends string, M extends string, D> = [P] extends [keyof G['overrides']]
	? [M] extends [keyof G['overrides'][P]]
		? G['overrides'][P][M]
		: D
	: D;

export type Slot<G extends GrammarMap, P extends string, M extends string, D> = Override<G, P, M, D | Unmapped>;

export type Text<G extends GrammarMap, P extends keyof TextPaths['texts']> = Override<G, P, '$text', string>;

type Defaults<G extends GrammarMap> = Paths<Contract<G['features']>>;

type Element<T> = T extends readonly (infer E)[] ? E : T;

type KindOf<T> = T extends { readonly $kind: infer K } ? K : never;

type Within<O, D> = unknown extends D
	? true
	: [KindOf<O>] extends [KindOf<D>]
		? [Exclude<O, { readonly $kind: string }>] extends [Exclude<D, { readonly $kind: string }>]
			? true
			: false
		: false;

interface Misfit<P, M> {
	readonly fitsNoDefault: `${P & string}.${M & string}`;
}

type MemberMisfit<
	G extends GrammarMap,
	P extends keyof G['overrides'],
	M extends keyof G['overrides'][P]
> = P extends keyof Defaults<G>
	? M extends '$text'
		? [G['overrides'][P][M]] extends [string]
			? never
			: Misfit<P, M>
		: M extends keyof Defaults<G>[P]
			? Within<G['overrides'][P][M], Element<Defaults<G>[P][M]>> extends true
				? never
				: Misfit<P, M>
			: Misfit<P, M>
	: Misfit<P, M>;

type Misfits<G extends GrammarMap> = {
	readonly [P in keyof G['overrides']]-?: {
		readonly [M in keyof G['overrides'][P]]-?: MemberMisfit<G, P, M>;
	}[keyof G['overrides'][P]];
}[keyof G['overrides']];

export type Fits<G extends GrammarMap> = [Misfits<G>] extends [never] ? true : Misfits<G>;

export type Assert<T extends true> = T;
