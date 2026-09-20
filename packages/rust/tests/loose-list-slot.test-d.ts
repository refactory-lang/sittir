/**
 * Type-level pins for a list-envelope slot on the loose surface: the slot
 * takes one element bare, an array of elements, or the built envelope, and
 * a list wrapper takes its options object first and only first.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { Delimiter, ir } from '@sittir/rust';

const edit = ir.identifier('Edit');

// One element bare, an array, and the envelope itself all fit the slot.
ir.genericType({ type: 'Vec', typeArguments: edit });
ir.genericType({ type: 'Vec', typeArguments: [edit] });
ir.genericType({ type: 'Vec', typeArguments: 'Edit' });
ir.genericType({ type: 'Vec', typeArguments: ['Edit', 'Other'] });
ir.genericType({ type: 'Vec', typeArguments: ir.typeArguments.strict(ir.typeArgumentsElements.strict(edit)) });

// The options object is first and optional, on both surfaces.
ir.typeArgumentsElements(edit);
ir.typeArgumentsElements({ delimiter: Delimiter.Trailing }, edit);
ir.typeArgumentsElements.strict(edit);
ir.typeArgumentsElements.strict({ delimiter: Delimiter.Trailing }, edit);

// A trailing options object is not a spelling.
// @ts-expect-error the options object is the first parameter
ir.typeArgumentsElements(edit, { delimiter: Delimiter.Trailing });
// @ts-expect-error the options object is the first parameter
ir.typeArgumentsElements.strict(edit, { delimiter: Delimiter.Trailing });
