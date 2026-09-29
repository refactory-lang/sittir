export const Delimiter = { None: 0, Leading: 1, Trailing: 2, Both: 3 } as const;

export type Delimiter = (typeof Delimiter)[keyof typeof Delimiter];

export declare namespace Delimiter {
	type None = typeof Delimiter.None;
	type Leading = typeof Delimiter.Leading;
	type Trailing = typeof Delimiter.Trailing;
	type Both = typeof Delimiter.Both;
}
