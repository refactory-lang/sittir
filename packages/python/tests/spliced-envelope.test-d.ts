/**
 * Type-level pins for a slot that splices a hidden rule: it admits that
 * rule's envelope beside the rule's arms, and no other envelope or kind.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const pyStrict = await createEngine(python, { api: 'strict' });

const two = () => py.build.integerDecimal.plain('2');
const negative = () => pyStrict.build.simplePattern.negative(py.build.integerDecimal.plain('1'));

export function envelopeAdmittedWhereItsRuleIsSpliced(): string[] {
	const statements = py.parse('a; b\n').statements()[0]!;
	const pattern = pyStrict.build.unionPattern({ left: two(), right: two() });
	if (!py.is.simpleStatements(statements)) return [];
	return [
		pyStrict.build.unionPattern({ left: negative(), right: two() }).$render(),
		py.build.unionPattern({ left: two(), right: negative() }).$render(),
		pattern.$with.left(negative()).$render(),
		py.build.suiteInline(statements).$render()
	];
}

export function otherEnvelopesAndKindsRefused(): void {
	const statements = py.parse('a; b\n').statements()[0]!;
	if (!py.is.simpleStatements(statements)) return;
	// @ts-expect-error a simple_statements envelope is not a simple_pattern's
	pyStrict.build.unionPattern({ left: statements, right: two() });
	// @ts-expect-error a Parameters node is neither a simple pattern arm nor its envelope
	pyStrict.build.unionPattern({ left: py.build.parameters(), right: two() });
	// @ts-expect-error a simple_pattern envelope is not a simple_statements'
	py.build.suiteInline(negative());
}
