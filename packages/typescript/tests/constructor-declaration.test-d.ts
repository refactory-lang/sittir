/**
 * Type-level pin: a constructor declaration's name is fixed text its builder
 * stamps, so it is not an input.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import { ir } from '../src/ir.ts';

export function constructorNameIsNotAnInput(): void {
	const parameters = ir.formalParameters({});
	const body = ir.statementBlock({});

	ir.constructorDeclaration({ parameters, body });
	ir.constructorDeclaration({ accessibilityModifier: 'private', parameters, body });

	// @ts-expect-error the name is fixed text, not an input
	ir.constructorDeclaration({ name: 'constructor', parameters, body });
}
