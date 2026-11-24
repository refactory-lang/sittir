export type * from './literal.ts';

/** Literal facets: `null`, and a float spelled with a leading point or with an exponent. */
export interface LiteralFacets {
	readonly 'literal-facets': true;
}
