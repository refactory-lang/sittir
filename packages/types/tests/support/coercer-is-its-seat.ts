/**
 * Shared declaration for each grammar's `coercer-is-its-seat` type test: a coercer declared by its seat's
 * signatures has the seat alias's own type, so it accepts and refuses exactly what the alias does.
 *
 * The comparison is TypeScript's identity relation. Mutual assignability cannot answer it: relating one generic
 * signature to another infers the target's type parameter as the source's whole refusing parameter, and the nested
 * refusal that leaves is one TypeScript cannot prove, even between two copies of the same signature.
 */

export type Identical<X, Y> = (<Z>() => Z extends X ? 1 : 2) extends <Z>() => Z extends Y ? 1 : 2 ? true : false;

export type { Expect } from './row-is-the-call.ts';
