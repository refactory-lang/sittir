/**
 * Type-level pins for a list-envelope slot on the loose surface: the slot
 * takes one element bare, an array of elements, or the built envelope, and
 * a list wrapper takes its options object first and only first.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { Delimiter } from '@sittir/common/utils';
import rust from '@sittir/rust';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

const edit = rs.build.identifier('Edit');

// One element bare, an array, and the envelope itself all fit the slot.
rs.build.genericType({ type: 'Vec', typeArguments: edit });
rs.build.genericType({ type: 'Vec', typeArguments: [edit] });
rs.build.genericType({ type: 'Vec', typeArguments: 'Edit' });
rs.build.genericType({ type: 'Vec', typeArguments: ['Edit', 'Other'] });
rs.build.genericType({ type: 'Vec', typeArguments: rs.build.typeArguments.strict(rs.build.typeArgumentsElements.strict(edit)) });

// The options object is first and optional, on both surfaces.
rs.build.typeArgumentsElements(edit);
rs.build.typeArgumentsElements({ delimiter: Delimiter.Trailing }, edit);
rs.build.typeArgumentsElements.strict(edit);
rs.build.typeArgumentsElements.strict({ delimiter: Delimiter.Trailing }, edit);

// A trailing options object is not a spelling.
// @ts-expect-error the options object is the first parameter
rs.build.typeArgumentsElements(edit, { delimiter: Delimiter.Trailing });
// @ts-expect-error the options object is the first parameter
rs.build.typeArgumentsElements.strict(edit, { delimiter: Delimiter.Trailing });
