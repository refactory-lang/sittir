import type { Engine } from '@sittir/types';
import type { RustAPI } from '@sittir/rust';

declare const rs: Engine<RustAPI>;

rs.build.enumVariant({ name: 'V', body: { $type: rs.kinds.FieldDeclaration, name: 'a', type: 'i32' } });
// @ts-expect-error a kind name is not a kind id
rs.build.enumVariant({ name: 'V', body: { $type: 'field_declaration', name: 'a', type: 'i32' } });
