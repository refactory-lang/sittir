import type { GrammarContext, Literal } from '../src/vocabulary/index.ts';

export function numericValue<G extends GrammarContext<G>>(literal: Literal.Number.Any<G>): number | bigint {
	return literal.$value;
}

export function floatValue<G extends GrammarContext<G>>(literal: Literal.Number.Float.Any<G>): number {
	return literal.$value;
}

export function bigIntegerValue<G extends GrammarContext<G>>(literal: Literal.Number.Integer.Big.Any<G>): bigint {
	return literal.$value;
}

export function integerValue<G extends GrammarContext<G>>(literal: Literal.Number.Integer.Hex<G>): number | bigint {
	return literal.$value;
}

export function booleanValue<G extends GrammarContext<G>>(literal: Literal.Boolean.Any<G>): boolean {
	return literal.$value;
}

export function trueValue<G extends GrammarContext<G>>(literal: Literal.Boolean.True<G>): true {
	return literal.$value;
}

export function falseValue<G extends GrammarContext<G>>(literal: Literal.Boolean.False<G>): false {
	return literal.$value;
}
