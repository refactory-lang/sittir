import type { Expression, Statement } from '../src/index.ts';
import type { Path, UseClause } from '../src/types-internal.ts';

// @ts-expect-error an undeclared hidden choice has no alias on the public surface
import type { Path as PublicPath } from '../src/index.ts';
// @ts-expect-error an undeclared hidden choice has no alias on the public surface
import type { UseClause as PublicUseClause } from '../src/index.ts';

export type Surface = [Expression, Statement, Path, UseClause, PublicPath, PublicUseClause];
