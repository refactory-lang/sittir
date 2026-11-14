import { ir } from '../src/ir.ts';
import { TSKindId } from '../src/kinds.ts';

const a = TSKindId.Undefined as never;

export function aRouteWhoseParentKeysSitInOtherMembersTakesTheArmsOwnConfig(): void {
	ir.binaryExpression.in({ left: a, right: a });

	// @ts-expect-error the route's input is the arm's own config; the seat key is the parent builder's
	ir.binaryExpression.in({ binaryExpressionIn: { left: a, right: a } });
	// @ts-expect-error operator sits only in the other members of the choice, so it cannot be present beside the arm
	ir.binaryExpression.in({ left: a, operator: '+', right: a });

	ir.binaryExpression({ binaryExpressionIn: { left: a, right: a } });
	ir.binaryExpression({ left: a, operator: '+', right: a });
}
