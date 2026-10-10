export type * from './declaration.ts';
export type * from './expression.ts';

/** Encapsulation: a member hidden from code outside its class, flagged where it is declared and where it is read. */
export interface Encapsulation {
	readonly encapsulation: true;
}
