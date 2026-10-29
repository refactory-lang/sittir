import type { PhaseName } from '../types/rule.ts';
import type { Grammar, PhaseRuleOf } from './types.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import { matchesWordShape } from '../util/word-matcher.ts';

export interface BaseCtxInit<P extends PhaseName> {
	readonly grammar: Grammar<P>;
	readonly diagnostics: DiagnosticSink;
	readonly wordMatcher?: RegExp;
}

export abstract class BaseCtx<P extends PhaseName> {
	readonly grammar: Grammar<P>;
	readonly diagnostics: DiagnosticSink;
	readonly #wordMatcher: RegExp | undefined;
	#walker?: RuleWalker<PhaseRuleOf<P>>;

	abstract get rules(): Record<string, PhaseRuleOf<P>>;

	constructor(init: BaseCtxInit<P>) {
		this.grammar = init.grammar;
		this.diagnostics = init.diagnostics;
		this.#wordMatcher = init.wordMatcher;
	}

	isWordShaped(text: string): boolean {
		return matchesWordShape(text, this.#wordMatcher);
	}

	get walker(): RuleWalker<PhaseRuleOf<P>> {
		if (!this.#walker) this.#walker = new RuleWalker(this.rules, this.diagnostics);
		return this.#walker;
	}
}
