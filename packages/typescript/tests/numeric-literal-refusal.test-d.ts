/**
 * Type-level pin: a numeric leaf's entry refuses, at compile time, the
 * literals its runtime guard refuses: a negative one, a non-integer for an
 * integer leaf, an integer past MAX_SAFE_INTEGER.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import { ir } from '../src/ir.ts';
import { ir as strictIr } from '../src/ir-strict.ts';
import { TSKindId } from '../src/kinds.ts';

export function numericLeafEntriesRefuseUnbuildableLiterals(): void {
	ir.number.decimal(3);
	ir.number.decimal(3n);
	ir.number.decimal('3');
	const widened = Math.random();
	ir.number.decimal(widened);

	// @ts-expect-error a negative literal is refused
	ir.number.decimal(-1);
	// @ts-expect-error a non-integer literal is refused by an integer leaf
	ir.number.decimal(1.5);
	// @ts-expect-error a literal past MAX_SAFE_INTEGER is refused
	ir.number.decimal(9007199254740992);
}

export function structuralNumericBuildersRefuseUnbuildableLiterals(): void {
	ir.number.hex(255);
	ir.number.hex(255n);
	ir.number.hex('ff');
	ir.number.floatPoint({ integer: 1, fraction: 5 });
	const widened = Math.random();
	ir.number.hex(widened);
	ir.number.floatPoint({ integer: widened, fraction: 5 });

	// @ts-expect-error a negative literal is refused
	ir.number.hex(-1);
	// @ts-expect-error a non-integer literal is refused by a radix builder
	ir.number.hex(1.5);
	// @ts-expect-error a negative literal is refused in a config slot
	ir.number.floatPoint({ integer: -1, fraction: 5 });
	// @ts-expect-error a literal past MAX_SAFE_INTEGER is refused in a config slot
	ir.number.floatPoint({ integer: 9007199254740992, fraction: 5 });
}

export function configLiteralsKeepTheirUnknownKeyCheck(): void {
	// @ts-expect-error a misspelled key is refused, strict
	strictIr.number.floatPoint({ integer: 1, fraction: 5, exponnet: 2 });
	// @ts-expect-error a misspelled key is refused, loose
	ir.number.floatPoint({ integer: 1, fraction: 5, exponnet: 2 });
}

export function unionArgumentsAreJudgedMemberByMember(): void {
	const clean = Math.random() > 0.5 ? ({ integer: 1, fraction: 5 } as const) : ({ integer: 2, fraction: 6, exponent: 3 } as const);
	ir.number.floatPoint(clean);
	strictIr.number.floatPoint(clean);
	const dirty = Math.random() > 0.5 ? ({ integer: 1, fraction: 5, exponent: -1 } as const) : ({ integer: 1, fraction: 5 } as const);
	// @ts-expect-error a union member with a negative slot is refused, loose
	ir.number.floatPoint(dirty);
	// @ts-expect-error a union member with a negative slot is refused, strict
	strictIr.number.floatPoint(dirty);
	const mixed = Math.random() > 0.5 ? (42 as const) : ({ content: -1 } as const);
	// @ts-expect-error a bare number beside a negative config is refused
	ir.number.hex(mixed);
}

export function aSlotWidenedToANumberRefusesANegativeLiteral(): void {
	ir.binaryExpression({ left: 1, operator: '+', right: 2 });
	ir.binaryExpression({ left: 1.5, operator: '+', right: 2n });
	const widened = Math.random();
	ir.binaryExpression({ left: widened, operator: '+', right: -widened });

	// @ts-expect-error a negative literal is refused in a slot a number reaches by widening
	ir.binaryExpression({ left: -1, operator: '+', right: 2 });
	// @ts-expect-error a negative fraction is refused there too
	ir.binaryExpression({ left: 1, operator: '+', right: -1.5 });
	const negativeBigint = { left: -1n, operator: '+', right: 2 } as const;
	// @ts-expect-error and a negative bigint
	ir.binaryExpression(negativeBigint);
}

export function everyCallingConventionRefusesANegativeLiteral(): void {
	ir.expressionStatement(1);
	ir.returnStatement({ expression: 1 });
	ir.arguments(1, 2);
	ir.array(1);
	ir.array([1, 2]);
	ir.array({ elements: [1, 2] });

	// @ts-expect-error a bare negative literal is refused
	ir.expressionStatement(-1);
	// @ts-expect-error a negative literal is refused in a config's slot
	ir.returnStatement({ expression: -1 });
	// @ts-expect-error a negative item is refused in a list's rest form
	ir.arguments(1, -1);
	// @ts-expect-error a bare negative item is refused
	ir.array(-1);
	// @ts-expect-error a negative item is refused in a list's array form
	ir.array([1, -1]);
	// @ts-expect-error a negative item is refused in a list's config form
	ir.array({ elements: [-1] });
}

export function aNegativeLiteralIsRefusedAtAnyDepth(): void {
	ir.returnStatement({ expression: { $type: TSKindId.BinaryExpression, left: 1, operator: '+', right: 2 } });
	ir.array([{ $type: TSKindId.BinaryExpression, left: 1, operator: '+', right: 2 }]);

	// @ts-expect-error a negative literal is refused in a config nested in another
	ir.returnStatement({ expression: { $type: TSKindId.BinaryExpression, left: -1, operator: '+', right: 2 } });
	// @ts-expect-error a negative literal is refused in a config nested in a list item
	ir.array([{ $type: TSKindId.BinaryExpression, left: 1, operator: '+', right: -2 }]);
}

export function anOptionalLooseInputRefusesAnInlineNegativeBigint(): void {
	ir.binaryExpression({ left: 1n, operator: '+', right: 2 });
	// @ts-expect-error a negative bigint literal is refused, as a negative number literal is
	ir.binaryExpression({ left: -1n, operator: '+', right: 2 });
	// @ts-expect-error a negative number literal is refused
	ir.binaryExpression({ left: -1, operator: '+', right: 2 });
	const config = { left: -1n, operator: '+', right: 2 } as const;
	// @ts-expect-error a negative bigint literal held in a constant is refused
	ir.binaryExpression(config);
}
