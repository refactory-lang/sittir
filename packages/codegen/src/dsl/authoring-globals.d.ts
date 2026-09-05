import type {
	SeqRule,
	ChoiceRule,
	FieldRule,
	RepeatRule,
	Repeat1Rule,
	TokenRule,
	AliasRule,
	AuthoringRule,
	ToGrammarRule,
	AuthoringRulesToRules,
	SymbolRule,
	StringRule,
	PrecRule,
	PrecLeftRule,
	PrecRightRule,
	PrecDynamicRule,
	ImmediateTokenRule,
	BlankRule
} from '../grammar-shapes/grammar-json.ts';

declare global {
	function seq<M extends readonly AuthoringRule[]>(...members: M): SeqRule<AuthoringRulesToRules<M>>;
	function choice<M extends readonly AuthoringRule[]>(...members: M): ChoiceRule<AuthoringRulesToRules<M>>;
	function field<const N extends string, R extends AuthoringRule>(name: N, rule: R): FieldRule<N, ToGrammarRule<R>>;
	function optional<R extends AuthoringRule>(rule: R): ChoiceRule<[ToGrammarRule<R>, BlankRule]>;
	function repeat<R extends AuthoringRule>(rule: R): RepeatRule<ToGrammarRule<R>>;
	function repeat1<R extends AuthoringRule>(rule: R): Repeat1Rule<ToGrammarRule<R>>;

	declare const token: {
		<R extends AuthoringRule>(rule: R): TokenRule<ToGrammarRule<R>>;
		immediate<R extends AuthoringRule>(rule: R): ImmediateTokenRule<ToGrammarRule<R>>;
	};

	declare const prec: {
		<R extends AuthoringRule>(value: number | string, rule: R): PrecRule<ToGrammarRule<R>>;
		left<R extends AuthoringRule>(value: number | string, rule: R): PrecLeftRule<ToGrammarRule<R>>;
		right<R extends AuthoringRule>(value: number | string, rule: R): PrecRightRule<ToGrammarRule<R>>;
		dynamic<R extends AuthoringRule>(value: number, rule: R): PrecDynamicRule<ToGrammarRule<R>>;
	};

	function alias<R extends AuthoringRule, V extends string>(
		rule: R,
		value: V | SymbolRule<V>
	): AliasRule<V, ToGrammarRule<R>>;

	function sym<N extends string>(name: N): SymbolRule<N>;

	function string<const S extends string>(value: S): StringRule<S>;
	function indent(): { readonly type: 'INDENT' };
	function dedent(): { readonly type: 'DEDENT' };

	function blank(): BlankRule;
}

export {};
