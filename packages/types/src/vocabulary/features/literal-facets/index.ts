export type * from './literal.ts';

/** Literal facets: `null`, the parts of a float and the radix prefix of an integer. */
export interface LiteralFacets {
	readonly 'literal-facets': true;
}
