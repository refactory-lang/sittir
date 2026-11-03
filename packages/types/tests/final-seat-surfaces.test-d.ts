import type { Admit, KeyRefusesEmpty, LooseValue } from '../src/index.ts';

type Expect<T extends true> = T;
type Not<T extends boolean> = T extends true ? false : true;

interface Arm {
	readonly $type: 1;
}
interface LastArm {
	readonly $type: 2;
}
type Arms = readonly [...Arm[], LastArm];

declare const arm: Admit<Arm>;
declare const last: Admit<LastArm>;
declare const looseArm: LooseValue<Arm>;
declare const looseLast: LooseValue<LastArm>;

export const admitsRestThenLast: Admit<Arms> = [arm, arm, last];
export const admitsLastAlone: Admit<Arms> = [last];
// @ts-expect-error the last seat's kind holds only the last element
export const refusesLastBeforeRest: Admit<Arms> = [arm, last, arm];
// @ts-expect-error the last element is of the last seat's kind
export const refusesRestLast: Admit<Arms> = [last, arm];
// @ts-expect-error a final seat holds its last element
export const refusesEmpty: Admit<Arms> = [];
export const admitsEmptyWhereTheSlotMayBeEmpty: Admit<Arms | readonly []> = [];

export const looseAdmitsRestThenLast: LooseValue<Arms> = [looseArm, looseArm, looseLast];
export const looseAdmitsOneLast: LooseValue<Arms> = looseLast;
// @ts-expect-error a loose final seat keeps its order
export const looseRefusesLastBeforeRest: LooseValue<Arms> = [looseArm, looseLast, looseArm];

export type Cases = [
	Expect<KeyRefusesEmpty<{ readonly arms: Arms }, 'arms'>>,
	Expect<KeyRefusesEmpty<{ readonly arms: LooseValue<Arms> }, 'arms'>>,
	Expect<Not<KeyRefusesEmpty<{ readonly arms: Arms | readonly [] }, 'arms'>>>
];
