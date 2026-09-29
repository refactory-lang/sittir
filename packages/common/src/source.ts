import type { AnyNodeData } from '@sittir/types';

export const Source = { Ts: 0, Sg: 1, Factory: 2 } as const satisfies Record<string, NonNullable<AnyNodeData['$source']>>;

export type Source = (typeof Source)[keyof typeof Source];
