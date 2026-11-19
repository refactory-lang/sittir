/**
 * Type-level pins: a declared default that pins two fields admits both or
 * neither, in the loose and the strict entry alike.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const loose = await createEngine(typescript);
const strict = await createEngine(typescript, { api: 'strict' });

const members = [...(loose.build.objectType({ members: [loose.build.propertySignature({ name: 'x' })] }).members() ?? [])];

export function bothOrNeitherLoose(): unknown[] {
	return [
		loose.build.objectType({ members }),
		loose.build.objectType({ members, opening: '{|', closing: '|}' }),
		loose.build.interfaceBody({ members }),
		loose.build.interfaceBody({ members, opening: '{|', closing: '|}' })
	];
}

export function bothOrNeitherStrict(): unknown[] {
	return [
		strict.build.objectType({ members }),
		strict.build.objectType({ members, opening: typescript.kinds.LbracePipe, closing: typescript.kinds.PipeRbrace }),
		strict.build.interfaceBody({ members }),
		strict.build.interfaceBody({ members, opening: typescript.kinds.LbracePipe, closing: typescript.kinds.PipeRbrace })
	];
}

export function oneAloneIsATypeError(): unknown[] {
	return [
		// @ts-expect-error opening without closing
		loose.build.objectType({ members, opening: '{|' }),
		// @ts-expect-error closing without opening
		loose.build.objectType({ members, closing: '|}' }),
		// @ts-expect-error opening without closing
		loose.build.interfaceBody({ members, opening: '{|' }),
		// @ts-expect-error closing without opening
		loose.build.interfaceBody({ members, closing: '|}' }),
		// @ts-expect-error opening without closing
		strict.build.objectType({ members, opening: typescript.kinds.LbracePipe }),
		// @ts-expect-error closing without opening
		strict.build.objectType({ members, closing: typescript.kinds.PipeRbrace }),
		// @ts-expect-error opening without closing
		strict.build.interfaceBody({ members, opening: typescript.kinds.LbracePipe }),
		// @ts-expect-error closing without opening
		strict.build.interfaceBody({ members, closing: typescript.kinds.PipeRbrace })
	];
}
