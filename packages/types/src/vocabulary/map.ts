export interface GrammarMap {
	readonly features: object;
	readonly overrides: { readonly [path: string]: { readonly [member: string]: unknown } };
	readonly inputs: object;
}

export interface Contract<F extends object> extends GrammarMap {
	readonly features: F;
	readonly overrides: {};
	readonly inputs: { readonly [P in keyof TextPaths['texts']]: string };
}

export interface Paths<G extends GrammarMap> {}

export interface TextPaths {
	readonly texts: {
		readonly 'clause.import.wildcard': string;
		readonly 'expression.meta': string;
		readonly identifier: string;
		readonly 'modifier.visibility': string;
		readonly 'modifier.visibility.private': string;
		readonly 'modifier.visibility.protected': string;
		readonly 'modifier.visibility.public': string;
		readonly 'modifier.visibility.public.internal': string;
		readonly 'statement.break': string;
		readonly 'statement.continue': string;
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

export type Text<G extends GrammarMap, P extends string> = Override<G, P, '$text', string>;

export interface Form<R extends PropertyKey = never, A extends PropertyKey = never, M extends object = {}> {
	readonly required: R;
	readonly absent: A;
	readonly members: M;
}

type FormsAt<G extends GrammarMap, P> = [P] extends [keyof G['overrides']]
	? G['overrides'][P] extends { readonly $forms: infer F }
		? [F]
		: []
	: [];

type Applied<R, F> =
	F extends Form<infer Required, infer Absent, infer Members>
		? Omit<R, Required | Absent | keyof Members> & {
				readonly [M in Required & keyof R]-?: Exclude<R[M], undefined>;
			} & { readonly [M in Absent & keyof R]?: never } & Members
		: never;

export type Formed<G extends GrammarMap, R> = R extends { readonly $path: infer P }
	? FormsAt<G, P> extends [infer F]
		? Applied<R, F>
		: R
	: R;

export type Read<G extends GrammarMap, P extends keyof Paths<G>> = Formed<G, Paths<G>[P]>;

type Defaults<G extends GrammarMap> = Paths<Contract<G['features']>>;

type Element<T> = T extends readonly (infer E)[] ? E : T;

type PathOf<T> = T extends { readonly $path: infer K } ? K : never;

type Within<O, D> = unknown extends D
	? true
	: [PathOf<O>] extends [PathOf<D>]
		? [Exclude<O, { readonly $path: string }>] extends [Exclude<D, { readonly $path: string }>]
			? true
			: false
		: false;

interface Misfit<P, M> {
	readonly fitsNoDefault: `${P & string}.${M & string}`;
}

type FormMisfit<G extends GrammarMap, P extends keyof Defaults<G>, F> =
	F extends Form<PropertyKey, PropertyKey, infer Members>
		? {
				readonly [M in keyof Members]-?: M extends keyof Defaults<G>[P]
					? Within<
							Element<Exclude<Members[M], undefined>>,
							M extends keyof G['overrides'][P] ? G['overrides'][P][M] : Element<Defaults<G>[P][M]>
						> extends true
						? never
						: Misfit<P, M>
					: Misfit<P, M>;
			}[keyof Members]
		: Misfit<P, '$forms'>;

type MemberMisfit<
	G extends GrammarMap,
	P extends keyof G['overrides'],
	M extends keyof G['overrides'][P]
> = P extends keyof Defaults<G>
	? M extends '$forms'
		? FormMisfit<G, P, G['overrides'][P][M]>
		: M extends '$text'
			? [G['overrides'][P][M]] extends [string]
				? P extends keyof TextPaths['texts']
					? never
					: [Defaults<G>[P]] extends [string]
						? never
						: Misfit<P, M>
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
