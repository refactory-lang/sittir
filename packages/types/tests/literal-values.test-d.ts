import type { GrammarMap, Literal } from '../src/vocabulary/index.ts';

export function numericValue<G extends GrammarMap>(literal: Exclude<Literal.Number.Any<G>, Literal.Number.Negative<G>>): number | bigint {
	return literal.$value;
}

export function negativeValue<G extends GrammarMap>(literal: Literal.Number.Negative<G>): undefined {
	return literal.$value;
}

export function floatValue<G extends GrammarMap>(literal: Literal.Number.Float.Any<G>): number {
	return literal.$value;
}

export function bigIntegerValue<G extends GrammarMap>(literal: Literal.Number.Integer.Big.Any<G>): bigint {
	return literal.$value;
}

export function integerValue<G extends GrammarMap>(literal: Literal.Number.Integer.Hex<G>): number | bigint {
	return literal.$value;
}

export function booleanValue<G extends GrammarMap>(literal: Literal.Boolean.Any<G>): boolean {
	return literal.$value;
}

export function trueValue<G extends GrammarMap>(literal: Literal.Boolean.True<G>): true {
	return literal.$value;
}

export function falseValue<G extends GrammarMap>(literal: Literal.Boolean.False<G>): false {
	return literal.$value;
}
