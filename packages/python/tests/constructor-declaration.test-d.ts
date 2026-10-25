/**
 * Type-level pin: a constructor declaration's name is fixed text its builder
 * stamps, so it is not an input.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import { ir } from '../src/ir.ts';

export function constructorNameIsNotAnInput(): void {
	const parameters = ir.parameters({});
	const body = ir.suiteEmpty({ newline: '\n' });

	ir.constructorDeclaration({ parameters, body });

	// @ts-expect-error the name is fixed text, not an input
	ir.constructorDeclaration({ name: '__init__', parameters, body });
}
