import { nativeRuleFn } from './enrich.ts';
import { field as fieldImpl, type FieldPlaceholder } from './primitives/field.ts';
import { alias as aliasImpl, type AliasPlaceholder } from './primitives/alias.ts';
import { rule as ruleImpl, type RulePlaceholder } from './primitives/rule.ts';
import { role as roleImpl } from './primitives/role.ts';
import { refine as refineImpl, type FormMap } from './primitives/refine.ts';
import { replace as replaceImpl, transform } from './transform/transform.ts';
import type { PatchMap } from './wire/wire.ts';
import type {
	FieldRule,
	AliasRule,
	GrammarRule,
	AuthoringRule,
	SymbolRule,
	ToGrammarRule,
	PrecRule,
	PrecLeftRule,
	PrecRightRule,
	PrecDynamicRule,
	ReservedRule,
	TokenRule,
	ImmediateTokenRule
} from '../grammar-shapes/grammar-json.ts';

export { variant } from './primitives/variant.ts';
export { group } from './primitives/group.ts';
export { flatten } from './primitives/flatten.ts';
export { regex } from './primitives/regex.ts';
export { arm } from './primitives/arm.ts';
export { preference } from './primitives/preference.ts';
export { pendingBase as enrich, layerOptions as wire } from './layer.ts';
export type { LayerConfig, LayerOptions, PendingBase } from './layer.ts';
export type { GrammarResult } from './enrich.ts';
export { lead } from './primitives/lead.ts';
export { match, narrow } from './primitives/narrow.ts';
export { reauthored, vocabulary } from './primitives/rule-cause.ts';
export type { RuleCause, RuleCauseDeclaration } from './primitives/rule-cause.ts';
export type { WireConfig, WiredOpts } from './wire/wire.ts';

interface AuthoringField {
	<const N extends string>(name: N): FieldPlaceholder<N>;
	<const N extends string>(name: N, content: AuthoringRule): FieldRule<N, GrammarRule>;
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

interface AuthoringEdit {
	<R extends AuthoringRule>(previous: R, ...sets: readonly PatchMap[]): R;
}
export const edit = transform as unknown as AuthoringEdit;

type AuthoringReplacement = AuthoringRule | (($: Readonly<Record<string, SymbolRule<string>>>, member: GrammarRule) => AuthoringRule);
interface AuthoringReplace {
	<R extends AuthoringRule>(previous: R, path: string, rule: AuthoringReplacement): R;
}
export const replace = replaceImpl as unknown as AuthoringReplace;

type DslFn = (...args: readonly unknown[]) => unknown;

function runtimeDsl(name: string, member?: string): DslFn {
	return (...args) => {
		const owner = nativeRuleFn<DslFn & Readonly<Record<string, DslFn>>>(name);
		return member === undefined ? owner(...args) : owner[member]!(...args);
	};
}

interface AuthoringPrec {
	<R extends AuthoringRule>(value: number | string, rule: R): PrecRule<ToGrammarRule<R>>;
	left<R extends AuthoringRule>(rule: R): PrecLeftRule<ToGrammarRule<R>>;
	left<R extends AuthoringRule>(value: number | string, rule: R): PrecLeftRule<ToGrammarRule<R>>;
	right<R extends AuthoringRule>(rule: R): PrecRightRule<ToGrammarRule<R>>;
	right<R extends AuthoringRule>(value: number | string, rule: R): PrecRightRule<ToGrammarRule<R>>;
	dynamic<R extends AuthoringRule>(value: number, rule: R): PrecDynamicRule<ToGrammarRule<R>>;
}
export const prec = Object.assign(runtimeDsl('prec'), {
	left: runtimeDsl('prec', 'left'),
	right: runtimeDsl('prec', 'right'),
	dynamic: runtimeDsl('prec', 'dynamic')
}) as unknown as AuthoringPrec;

interface AuthoringReserved {
	<R extends AuthoringRule>(contextName: string, rule: R): ReservedRule<ToGrammarRule<R>>;
}
export const reserved = runtimeDsl('reserved') as unknown as AuthoringReserved;

interface AuthoringToken {
	<R extends AuthoringRule>(rule: R): TokenRule<ToGrammarRule<R>>;
	immediate<R extends AuthoringRule>(rule: R): ImmediateTokenRule<ToGrammarRule<R>>;
}
export const token = Object.assign(runtimeDsl('token'), { immediate: runtimeDsl('token', 'immediate') }) as unknown as AuthoringToken;
