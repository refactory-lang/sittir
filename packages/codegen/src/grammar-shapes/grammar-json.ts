export interface SeqRule<M extends readonly GrammarRule[] = readonly GrammarRule[]> {
	readonly type: 'SEQ';
	readonly members: M;
}
export interface ChoiceRule<M extends readonly GrammarRule[] = readonly GrammarRule[]> {
	readonly type: 'CHOICE';
	readonly members: M;
}
export interface SymbolRule<Name extends string = string> {
	readonly type: 'SYMBOL';
	readonly name: Name;
}
export interface StringRule<V extends string = string> {
	readonly type: 'STRING';
	readonly value: V;
}
export interface PatternRule<V extends string | RegExp | RustRegex = string> {
	readonly type: 'PATTERN';
	readonly value: V;
	readonly flags?: string;
}
export interface BlankRule {
	readonly type: 'BLANK';
}
export interface RepeatRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'REPEAT';
	readonly content: C;
}
export interface Repeat1Rule<C extends GrammarRule = GrammarRule> {
	readonly type: 'REPEAT1';
	readonly content: C;
}
export interface FieldRule<N extends string = string, C extends GrammarRule = GrammarRule> {
	readonly type: 'FIELD';
	readonly name: N;
	readonly content: C;
}
export interface AliasRule<V extends string = string, C extends GrammarRule = GrammarRule> {
	readonly type: 'ALIAS';
	readonly value: V;
	readonly named: boolean;
	readonly content: C;
}
export interface TokenRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'TOKEN';
	readonly content: C;
}
export interface ImmediateTokenRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'IMMEDIATE_TOKEN';
	readonly content: C;
}
export interface PrecRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'PREC';
	readonly value: number;
	readonly content: C;
}
export interface PrecLeftRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'PREC_LEFT';
	readonly value: number;
	readonly content: C;
}
export interface PrecRightRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'PREC_RIGHT';
	readonly value: number;
	readonly content: C;
}
export interface PrecDynamicRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'PREC_DYNAMIC';
	readonly value: number;
	readonly content: C;
}

export type GrammarRule =
	| SeqRule<readonly GrammarRule[]>
	| ChoiceRule<readonly GrammarRule[]>
	| SymbolRule<string>
	| StringRule<string>
	| PatternRule<string>
	| BlankRule
	| RepeatRule<GrammarRule>
	| Repeat1Rule<GrammarRule>
	| FieldRule<string, GrammarRule>
	| AliasRule<string, GrammarRule>
	| TokenRule<GrammarRule>
	| ImmediateTokenRule<GrammarRule>
	| PrecRule<GrammarRule>
	| PrecLeftRule<GrammarRule>
	| PrecRightRule<GrammarRule>
	| PrecDynamicRule<GrammarRule>;

export type AuthoringRule = GrammarRule | string | RegExp;

export type ToGrammarRule<S extends string | RegExp | GrammarRule> = S extends string
	? StringRule<S>
	: S extends RegExp
		? PatternRule<string>
		: S extends GrammarRule
			? S
			: S;

export type AuthoringRulesToRules<M extends readonly AuthoringRule[]> = M extends readonly [
	infer Head extends AuthoringRule,
	...infer Rest extends AuthoringRule[]
]
	? [ToGrammarRule<Head>, ...AuthoringRulesToRules<Rest>]
	: [];

export interface GrammarJson {
	readonly name: string;
	readonly rules: Readonly<Record<string, GrammarRule>>;
	readonly supertypeNames?: readonly string[];
}

export type PrecRuleUnion = PrecRule | PrecLeftRule | PrecRightRule | PrecDynamicRule;

export type SingleContentWrapper = RepeatRule | Repeat1Rule | FieldRule | AliasRule | TokenRule | ImmediateTokenRule;

export type MutableDeep<T> = T extends readonly (infer _U)[]
	? { -readonly [K in keyof T]: MutableDeep<T[K]> }
	: T extends object
		? { -readonly [K in keyof T]: MutableDeep<T[K]> }
		: T;
