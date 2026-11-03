import type { Expression, Statement } from '../src/index.ts';
import type { UseClause } from '../src/types-internal.ts';

// @ts-expect-error an undeclared hidden choice has no alias on the public surface
import type { UseClause as PublicUseClause } from '../src/index.ts';

export type Surface = [Expression, Statement, UseClause, PublicUseClause];
