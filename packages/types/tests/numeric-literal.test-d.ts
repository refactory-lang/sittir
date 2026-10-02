import type { NumericLiteral } from '../src/index.ts';

declare function integer<const N extends string | number | bigint>(value: N & NumericLiteral<N, true>): void;
declare function float<const N extends string | number | bigint>(value: N & NumericLiteral<N, false>): void;

integer(5);
integer(0);
integer(7n);
integer('0x1f');
integer(9007199254740991);
float(1.5);
float(0);
declare const plain: number;
integer(plain);
float(plain);
declare const big: bigint;
integer(big);
declare const text: string;
integer(text);
declare const widened: string | number;
integer(widened);

// @ts-expect-error a negative literal is refused
integer(-1);
// @ts-expect-error a negative literal is refused by a float builder too
float(-1.5);
// @ts-expect-error a negative bigint literal is refused
integer(-3n);
// @ts-expect-error a non-integer literal is refused by an integer builder
integer(1.5);
// @ts-expect-error a fractional exponent form is refused by an integer builder
integer(1e-7);
// @ts-expect-error a literal past MAX_SAFE_INTEGER is refused
integer(9007199254740992);
// @ts-expect-error a literal past MAX_SAFE_INTEGER is refused (exponent form)
integer(1e21);

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const pinned = <T extends true>(): T | void => undefined;
pinned<Equal<NumericLiteral<-1, true>, { readonly 'a numeric builder takes a non-negative value': -1 }>>();
pinned<Equal<NumericLiteral<1.5, true>, { readonly 'this numeric builder takes an integer': 1.5 }>>();
pinned<Equal<NumericLiteral<9007199254740992, true>, { readonly 'an unsafe integer: pass a bigint': 9007199254740992 }>>();
