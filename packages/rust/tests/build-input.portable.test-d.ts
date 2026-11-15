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

export const lineComment: V.BuildInput<RustMap, 'comment.line'> = { $path: 'comment.line', $value: ' x' };
// @ts-expect-error a line comment builds from its text, never from a content member
export const lineCommentContent: V.BuildInput<RustMap, 'comment.line'> = { $path: 'comment.line', content: ' x' };
export const docComment: V.BuildInput<RustMap, 'comment.line.doc'> = { $path: 'comment.line.doc', $value: ' x' };
// @ts-expect-error a type argument holds its argument as its value, never as content
export const typeArgumentContent: V.BuildInput<RustMap, 'element.type_argument'>['content'] = 'u8';
// @ts-expect-error an expression statement holds its expression, never content
export const statementContent: V.BuildInput<RustMap, 'statement.expression'>['content'] = 'x';
