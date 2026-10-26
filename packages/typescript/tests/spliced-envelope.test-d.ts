/**
 * Type-level pins for a slot that splices a hidden rule: the direct value of
 * a rest pattern admits the lhs_expression envelope, and no other envelope.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

function assignedTo(source: string) {
	const statement = ts.parse(source).statements()[0]!;
	if (!ts.is.expressionStatement(statement)) return undefined;
	const assignment = statement.expression();
	return ts.is.assignmentExpression(assignment) ? assignment.left() : undefined;
}

export function envelopeAdmittedAsTheDirectValue(): string | undefined {
	const left = assignedTo('a.b = 1;\n');
	if (left === undefined || !ts.is.lhsExpression(left)) return undefined;
	return ts.build.restPattern(left).$render();
}

export function otherEnvelopesRefused(): void {
	const program = ts.parse('x;\n');
	// @ts-expect-error a program is not an lhs_expression envelope
	ts.build.restPattern(program);
}
