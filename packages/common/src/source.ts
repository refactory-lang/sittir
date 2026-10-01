import type { AnyUntypedNode } from '@sittir/types';

export const Source = { Ts: 0, Sg: 1, Factory: 2 } as const satisfies Record<string, NonNullable<AnyUntypedNode['$source']>>;

export type Source = (typeof Source)[keyof typeof Source];
