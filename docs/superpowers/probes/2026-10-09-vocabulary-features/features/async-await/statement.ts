import type { GrammarContext } from '../../context.ts';
export namespace Statement {
	export namespace Loop {
		export interface For<G extends GrammarContext> {
			readonly async?: boolean;
			readonly await?: boolean;
		}
	}
	export interface With<G extends GrammarContext> {
		readonly async?: boolean;
	}
}
