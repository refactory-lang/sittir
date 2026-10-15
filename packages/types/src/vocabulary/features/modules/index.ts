export type * from './clause.ts';
export type * from './expression.ts';
export type * from './statement.ts';

/** Modules: names imported from other files and exported to them. */
export interface Modules {
	readonly modules: true;
}
