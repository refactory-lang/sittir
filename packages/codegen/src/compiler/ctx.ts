import type { PhaseName } from '../types/rule.ts';
import type { Grammar, PhaseRuleOf } from './types.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';
import type { RuleBuilder } from '../dsl/builders.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';

export interface BaseCtxInit<P extends PhaseName> {
	readonly grammar: Grammar<P>;
	readonly diagnostics: DiagnosticSink;
	readonly wordMatcher?: (s: string) => boolean;
	readonly builder?: RuleBuilder;
}

export abstract class BaseCtx<P extends PhaseName> {
	readonly grammar: Grammar<P>;
	readonly wordMatcher?: (s: string) => boolean;
	readonly diagnostics: DiagnosticSink;
	readonly builder?: RuleBuilder;
	#walker?: RuleWalker<PhaseRuleOf<P>>;

	abstract get rules(): Record<string, PhaseRuleOf<P>>;

	constructor(init: BaseCtxInit<P>) {
		this.grammar = init.grammar;
		this.diagnostics = init.diagnostics;
		this.wordMatcher = init.wordMatcher;
		this.builder = init.builder;
	}

	get walker(): RuleWalker<PhaseRuleOf<P>> {
		if (!this.#walker) this.#walker = new RuleWalker(this.rules, this.diagnostics);
		return this.#walker;
	}
}
