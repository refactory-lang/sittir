import type {
	GrammarRule,
	SeqRule,
	ChoiceRule,
	SymbolRule,
	BlankRule,
	FieldRule,
	RepeatRule,
	Repeat1Rule,
	PrecRuleUnion
} from './grammar-json.ts';

export type RustSupertypes =
	| '_expression'
	| '_type'
	| '_literal'
	| '_literal_pattern'
	| '_declaration_statement'
	| '_pattern';

type IsPrec<N> = N extends PrecRuleUnion ? true : false;

type RewrapPrec<P extends PrecRuleUnion, Inner extends GrammarRule> = Omit<P, 'content'> & { content: Inner };

type IsBlank<N> = N extends BlankRule ? true : false;

type OptionalInner<C extends ChoiceRule> = C['members'] extends readonly [infer A, infer B]
	? A extends GrammarRule
		? B extends GrammarRule
			? IsBlank<B> extends true
				? A
				: IsBlank<A> extends true
					? B
					: never
			: never
		: never
	: never;

type StripUnderscore<S extends string> = S extends `_${infer R}` ? R : S;

type BaseFieldName<Name extends string> = Name extends RustSupertypes ? StripUnderscore<Name> : Name;

type Shape3Symbol<S extends SeqRule> = ExtractLoneSymbol<S['members']>;

type ExtractLoneSymbol<M extends readonly GrammarRule[], Found extends string | 'none' = 'none'> = M extends readonly [
	infer Head,
	...infer Tail
]
	? Head extends SymbolRule
		? Found extends 'none'
			? Tail extends readonly GrammarRule[]
				? ExtractLoneSymbol<Tail, Head['name']>
				: never
			: never
		: Head extends { type: 'STRING' } | { type: 'PATTERN' }
			? Tail extends readonly GrammarRule[]
				? ExtractLoneSymbol<Tail, Found>
				: never
			: never
	: Found extends 'none'
		? never
		: Found;

type MemberWrapName<N extends GrammarRule> = N extends SymbolRule
	? N['name'] extends `_${string}`
		? N['name'] extends RustSupertypes
			? N['name']
			: never
		: N['name']
	: N extends ChoiceRule
		? OptionalInner<N> extends infer Inner
			? Inner extends SymbolRule
				? Inner['name'] extends `_${string}`
					? never
					: Inner['name']
				: Inner extends SeqRule
					? Shape3Symbol<Inner> extends infer SymName
						? SymName extends `_${string}`
							? never
							: SymName extends string
								? SymName
								: never
						: never
					: never
			: never
		: never;

type CountBase<
	M extends readonly GrammarRule[],
	Target extends string,
	Acc extends unknown[] = []
> = M extends readonly [infer Head, ...infer Tail]
	? Head extends GrammarRule
		? Tail extends readonly GrammarRule[]
			? MemberWrapName<Head> extends infer WName
				? WName extends string
					? BaseFieldName<WName> extends Target
						? CountBase<Tail, Target, [...Acc, 1]>
						: CountBase<Tail, Target, Acc>
					: CountBase<Tail, Target, Acc>
				: CountBase<Tail, Target, Acc>
			: Acc['length']
		: Acc['length']
	: Acc['length'];

type FieldNameFor<WName extends string, AllMembers extends readonly GrammarRule[]> =
	CountBase<AllMembers, BaseFieldName<WName>> extends 1 ? BaseFieldName<WName> : string;

type WrapShape1<Name extends string, SymLeaf extends SymbolRule> = FieldRule & {
	type: 'FIELD';
	name: Name;
	content: SymLeaf;
};

type ReplaceOptionalMembers<M extends readonly GrammarRule[], NewX extends GrammarRule> = {
	[K in keyof M]: M[K] extends BlankRule ? M[K] : NewX;
};

type WrapShape3Members<M extends readonly GrammarRule[], Name extends string> = {
	[K in keyof M]: M[K] extends SymbolRule ? WrapShape1<Name, M[K]> : M[K];
};

type EnrichMember<N extends GrammarRule, AllMembers extends readonly GrammarRule[]> =
	MemberWrapName<N> extends infer WName
		? [WName] extends [never]
			? N
			: WName extends string
				? FieldNameFor<WName, AllMembers> extends infer FName
					? FName extends string
						? N extends SymbolRule
							? WrapShape1<FName, N>
							: N extends ChoiceRule
								? N['members'] extends infer CM extends readonly GrammarRule[]
									? OptionalInner<N> extends infer Inner
										? Inner extends SymbolRule
											? ChoiceRule & { type: 'CHOICE'; members: ReplaceOptionalMembers<CM, WrapShape1<FName, Inner>> }
											: Inner extends SeqRule
												? Inner['members'] extends infer SM extends readonly GrammarRule[]
													? ChoiceRule & {
															type: 'CHOICE';
															members: ReplaceOptionalMembers<
																CM,
																SeqRule & { type: 'SEQ'; members: WrapShape3Members<SM, FName> }
															>;
														}
													: N
												: N
										: N
									: N
								: N
						: N
					: N
				: N
		: N;

type EnrichSeqMembers<M extends readonly GrammarRule[]> = {
	[K in keyof M]: M[K] extends GrammarRule ? EnrichMember<M[K], M> : M[K];
};

type EnrichRepeatContent<C extends GrammarRule> = C extends SeqRule
	? { type: 'SEQ'; members: EnrichSeqMembers<C['members']> }
	: C;

export type EnrichRule<N extends GrammarRule> =
	IsPrec<N> extends true
		? N extends PrecRuleUnion
			? RewrapPrec<N, EnrichRule<N['content']>>
			: N
		: N extends SeqRule
			? { type: 'SEQ'; members: EnrichSeqMembers<N['members']> }
			: N extends RepeatRule
				? { type: 'REPEAT'; content: EnrichRepeatContent<N['content']> }
				: N extends Repeat1Rule
					? { type: 'REPEAT1'; content: EnrichRepeatContent<N['content']> }
					: N;

export type { GrammarRule, SeqRule, ChoiceRule, SymbolRule, FieldRule };
