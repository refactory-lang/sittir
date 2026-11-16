/**
 * Type-level pins: a field a refine form pins has no `$with` setter.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const loose = await createEngine(typescript);
const strict = await createEngine(typescript, { api: 'strict' });

const object = loose.build.identifier('a');
const property = loose.build.identifier('b');
const members = [loose.build.propertySignature({ name: 'x' })];
const declarators = [loose.build.variableDeclaratorPlain({ name: loose.build.identifier('x'), value: loose.build.identifier('y') })] as [
	ReturnType<typeof loose.build.variableDeclaratorPlain>
];

export function removedSettersAreErrors(): unknown[] {
	return [
		// @ts-expect-error the operator is chosen by the form builder
		loose.build.memberExpression({ object, property }).$with.operator,
		// @ts-expect-error the kind is chosen by the form builder
		loose.build.usingDeclaration({ variableDeclarators: declarators }).$with.kind,
		// @ts-expect-error the pair is chosen by the form builder
		loose.build.objectType({ members }).$with.opening,
		// @ts-expect-error the pair is chosen by the form builder
		loose.build.objectType({ members }).$with.closing,
		// @ts-expect-error the pair is chosen by the form builder
		loose.build.interfaceBody({ members }).$with.opening,
		// @ts-expect-error the pair is chosen by the form builder
		loose.build.interfaceBody({ members }).$with.closing,
		// @ts-expect-error the pair is chosen by the form builder
		strict.build.objectType({ members: strict.build.objectType({}).members() }).$with.opening
	];
}

export function otherSettersRemain(): unknown[] {
	return [loose.build.objectType({ members }).$with.members, loose.build.memberExpression({ object, property }).$with.object];
}
