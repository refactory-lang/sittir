/**
 * Type-level pin: a numeric builder refuses, at compile time, the literals
 * its runtime guard refuses.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { ir } from '../src/ir.ts';
import { ir as strictIr } from '../src/ir-strict.ts';

export function integerBuildersRefuseUnbuildableLiterals(): void {
	ir.integerLiteral({ content: 42 });
	ir.integerLiteral({ content: 42n });
	const widened = Math.random();
	ir.integerLiteral({ content: widened });

	// @ts-expect-error a negative literal is refused in a config slot
	ir.integerLiteral({ content: -1 });
	// @ts-expect-error a non-integer literal is refused by an integer builder
	ir.integerLiteral({ content: 1.5 });
}

export function floatBuildersRefuseUnbuildableLiterals(): void {
	ir.floatLiteral(1.5);
	ir.floatLiteral(0);
	const widened = Math.random();
	ir.floatLiteral(widened);

	// @ts-expect-error a negative literal is refused
	ir.floatLiteral(-1.5);
}

export function configLiteralsKeepTheirUnknownKeyCheck(): void {
	// @ts-expect-error a misspelled key is refused, strict
	strictIr.integerLiteral({ content: 1, sufix: 'u8' });
	// @ts-expect-error a misspelled key is refused, loose
	ir.integerLiteral({ content: 1, sufix: 'u8' });
}

export function unionArgumentsAreJudgedMemberByMember(): void {
	const dirty = Math.random() > 0.5 ? ({ content: -1 } as const) : ({ content: 1 } as const);
	// @ts-expect-error a union member with a negative slot is refused
	ir.integerLiteral(dirty);
	const mixed = Math.random() > 0.5 ? (42 as const) : ({ content: -1 } as const);
	// @ts-expect-error a bare number beside a negative config is refused
	ir.integerLiteral(mixed);
}

export function aSlotWidenedToANumberRefusesANegativeLiteral(): void {
	ir.binaryExpression({ left: 1, operator: '+', right: 2.5 });
	const widened = Math.random();
	ir.binaryExpression({ left: widened, operator: '+', right: -widened });

	// @ts-expect-error a negative literal is refused in a slot a number reaches by widening
	ir.binaryExpression({ left: -1, operator: '+', right: 2 });
	// @ts-expect-error a negative fraction is refused there too
	ir.binaryExpression({ left: 1, operator: '+', right: -2.5 });
}

export function everyCallingConventionRefusesANegativeLiteral(): void {
	ir.returnExpression(1);
	ir.arguments(1, 2);
	ir.arrayExpression({ elements: [1, 2] });

	// @ts-expect-error a bare negative literal is refused
	ir.returnExpression(-1);
	// @ts-expect-error a negative item is refused in a list's rest form
	ir.arguments(1, -1);
	// @ts-expect-error a negative item is refused in a config's list slot
	ir.arrayExpression({ elements: [1, -1] });
}
