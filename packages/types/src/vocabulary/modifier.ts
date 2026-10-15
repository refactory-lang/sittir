import type { GrammarContext } from './context.ts';
export interface Modifier<G extends GrammarContext<G>> {
	readonly $kind: 'modifier';
}
