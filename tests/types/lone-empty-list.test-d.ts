import type { Seat } from '@sittir/types';
import type { ImplementsClause as typescriptImplementsClause } from '../../packages/typescript/src/types.ts';
import type { Parameters as scmParameters } from '../../packages/scm/src/types.ts';
import type { AssertStatement as pythonAssertStatement } from '../../packages/python/src/types.ts';
import type { ComprehensionClauses as pythonComprehensionClauses } from '../../packages/python/src/types.ts';
import type { ExceptClauseExceptionList as pythonExceptClauseExceptionList } from '../../packages/python/src/types.ts';
import type { TraitBounds as rustTraitBounds } from '../../packages/rust/src/types.ts';

declare const typescriptImplementsClauseBuild: Seat<typescriptImplementsClause.LooseArgs, unknown>;
typescriptImplementsClauseBuild('a', 'b');
typescriptImplementsClauseBuild(['a', 'b']);
// @ts-expect-error a list holds at least one item
typescriptImplementsClauseBuild();
// @ts-expect-error a lone empty array is the item list
typescriptImplementsClauseBuild([]);
typescriptImplementsClauseBuild([[]]);
typescriptImplementsClauseBuild([], 'a');

declare const scmParametersBuild: Seat<scmParameters.LooseArgs, unknown>;
scmParametersBuild('a', 'b');
scmParametersBuild(['a', 'b']);
// @ts-expect-error a list holds at least one item
scmParametersBuild();
// @ts-expect-error a lone empty array is the item list
scmParametersBuild([]);
scmParametersBuild([[]]);
scmParametersBuild([], 'a');

declare const pythonAssertStatementBuild: Seat<pythonAssertStatement.LooseArgs, unknown>;
pythonAssertStatementBuild('a', 'b');
pythonAssertStatementBuild(['a', 'b']);
// @ts-expect-error a list holds at least one item
pythonAssertStatementBuild();
// @ts-expect-error a lone empty array is the item list
pythonAssertStatementBuild([]);
pythonAssertStatementBuild([[]]);
pythonAssertStatementBuild([], 'a');

declare const pythonComprehensionClausesBuild: Seat<pythonComprehensionClauses.LooseArgs, unknown>;
pythonComprehensionClausesBuild('a', 'b');
pythonComprehensionClausesBuild(['a', 'b']);
// @ts-expect-error a list holds at least one item
pythonComprehensionClausesBuild();
// @ts-expect-error a lone empty array is the item list
pythonComprehensionClausesBuild([]);
pythonComprehensionClausesBuild([[]]);
pythonComprehensionClausesBuild([], 'a');

declare const pythonExceptClauseExceptionListBuild: Seat<pythonExceptClauseExceptionList.LooseArgs, unknown>;
pythonExceptClauseExceptionListBuild('a', 'b');
pythonExceptClauseExceptionListBuild(['a', 'b']);
// @ts-expect-error a list holds at least one item
pythonExceptClauseExceptionListBuild();
// @ts-expect-error a lone empty array is the item list
pythonExceptClauseExceptionListBuild([]);
pythonExceptClauseExceptionListBuild([[]]);
pythonExceptClauseExceptionListBuild([], 'a');

declare const rustTraitBoundsBuild: Seat<rustTraitBounds.LooseArgs, unknown>;
rustTraitBoundsBuild('a', 'b');
rustTraitBoundsBuild(['a', 'b']);
// @ts-expect-error a list holds at least one item
rustTraitBoundsBuild();
// @ts-expect-error a lone empty array is the item list
rustTraitBoundsBuild([]);
// @ts-expect-error no rust item is an empty array
rustTraitBoundsBuild([[]]);
// @ts-expect-error no rust item is an empty array
rustTraitBoundsBuild([], 'a');
