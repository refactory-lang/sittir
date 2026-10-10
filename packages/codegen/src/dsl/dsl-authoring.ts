import { field as fieldImpl, type FieldOptions, type FieldPlaceholder } from './primitives/field.ts';
import { alias as aliasImpl, type AliasPlaceholder } from './primitives/alias.ts';
import { rule as ruleImpl, type RulePlaceholder } from './primitives/rule.ts';
import { role as roleImpl } from './primitives/role.ts';
import { refine as refineImpl, type FormMap } from './primitives/refine.ts';
import type { GrammarResult, EnrichedGrammar } from './enrich.ts';
import type { WiredOpts } from './wire/wire.ts';
import type {
	FieldRule,
	AliasRule,
	GrammarRule,
	GrammarJson,
	AuthoringRule,
	SymbolRule,
	ToGrammarRule,
	PrecRule,
	PrecLeftRule,
	PrecRightRule,
	PrecDynamicRule,
	TokenRule,
	ImmediateTokenRule
} from '../grammar-shapes/grammar-json.ts';

export { variant } from './primitives/variant.ts';
export { group } from './primitives/group.ts';
export { flatten } from './primitives/flatten.ts';
export { regex } from './primitives/regex.ts';
export { arm } from './primitives/arm.ts';
export { preference } from './primitives/preference.ts';
export { enrich } from './enrich.ts';
export type { GrammarResult } from './enrich.ts';
export { wire } from './wire/wire.ts';
export { sittirGrammar } from './sittir-grammar.ts';
export { reauthored, vocabulary } from './primitives/rule-cause.ts';
export type { RuleCause, RuleCauseDeclaration } from './primitives/rule-cause.ts';
export type { WireConfig, WiredOpts } from './wire/wire.ts';

interface AuthoringField {
	<const N extends string>(name: N): FieldPlaceholder<N>;
	<const N extends string>(name: N, content: AuthoringRule, options?: FieldOptions): FieldRule<N, GrammarRule>;
}
export const field = fieldImpl as unknown as AuthoringField;

interface AuthoringAlias {
	(name: string): AliasPlaceholder;
	(rule: AuthoringRule, value?: string | AuthoringRule): AliasRule<string, GrammarRule>;
}
export const alias = aliasImpl as unknown as AuthoringAlias;

interface AuthoringNewRule {
	(name: string, body: ($: Readonly<Record<string, SymbolRule<string>>>) => AuthoringRule): RulePlaceholder;
}
export const rule = ruleImpl as unknown as AuthoringNewRule;

interface AuthoringRole {
	(symbol: SymbolRule<string>, roleName: 'indent' | 'dedent' | 'newline'): SymbolRule<string>;
}
export const role = roleImpl as unknown as AuthoringRole;

interface AuthoringRefine {
	<R extends AuthoringRule>(original: R, forms: FormMap): R;
}
export const refine = refineImpl as unknown as AuthoringRefine;

interface AuthoringPrec {
	<R extends AuthoringRule>(value: number | string, rule: R): PrecRule<ToGrammarRule<R>>;
	left<R extends AuthoringRule>(rule: R): PrecLeftRule<ToGrammarRule<R>>;
	left<R extends AuthoringRule>(value: number | string, rule: R): PrecLeftRule<ToGrammarRule<R>>;
	right<R extends AuthoringRule>(rule: R): PrecRightRule<ToGrammarRule<R>>;
	right<R extends AuthoringRule>(value: number | string, rule: R): PrecRightRule<ToGrammarRule<R>>;
	dynamic<R extends AuthoringRule>(value: number, rule: R): PrecDynamicRule<ToGrammarRule<R>>;
}
export const prec = (globalThis as unknown as { prec: unknown }).prec as unknown as AuthoringPrec;

interface AuthoringToken {
	<R extends AuthoringRule>(rule: R): TokenRule<ToGrammarRule<R>>;
	immediate<R extends AuthoringRule>(rule: R): ImmediateTokenRule<ToGrammarRule<R>>;
}
export const token = (globalThis as unknown as { token: unknown }).token as unknown as AuthoringToken;

interface AuthoringGrammar {
	<B extends GrammarJson>(base: EnrichedGrammar<B>, options: WiredOpts): GrammarResult;
}
export const grammar = (globalThis as unknown as { grammar: unknown }).grammar as unknown as AuthoringGrammar;
