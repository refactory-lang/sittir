import type * as V from '../../types/src/vocabulary/index.ts';
import type { RustMap } from '../src/portable/map.ts';

type Binding = V.BuildInput<RustMap, 'element.macro.token_binding'>;
type BindingRead = V.Read<RustMap, 'element.macro.token_binding'>;

export const readName: BindingRead['name'] = { $path: 'identifier.metavariable', $value: 'x' };
export const valuedName: Binding['name'] = { $path: 'identifier.metavariable', $value: 'y' };
// @ts-expect-error a metavariable builds from its name's text, so a path without a $value builds nothing
export const pathOnlyName: Binding['name'] = { $path: 'identifier.metavariable' };
// @ts-expect-error no route seats a metavariable's bare text
export const textName: Binding['name'] = 'y';

export const repetitionSeparator: V.Read<RustMap, 'element.macro.token_repetition.pattern'>['separator'] = ',';

declare const lifetimeRead: V.Read<RustMap, 'identifier.lifetime'>;
// @ts-expect-error a function's name never reads as a lifetime
export const lifetimeFunctionName: V.BuildInput<RustMap, 'declaration.function'>['name'] = lifetimeRead;
