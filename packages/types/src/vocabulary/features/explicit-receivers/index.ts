export type * from './declaration.ts';
export type * from './expression.ts';
export type * from './type.ts';

/** Explicit receivers: a function declares the receiver it is called on as a parameter. */
export interface ExplicitReceivers {
	readonly 'explicit-receivers': true;
}
