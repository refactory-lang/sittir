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
// @ts-expect-error a line comment builds from its text, never from a content slot
export const lineCommentContent: V.BuildInput<RustMap, 'comment.line'> = { $path: 'comment.line', content: ' x' };
export const docComment: V.BuildInput<RustMap, 'comment.line.doc'> = { $path: 'comment.line.doc', $value: ' x' };
export const typeArgument: V.BuildInput<RustMap, 'element.type_argument'>['argument'] = 'u8';
// @ts-expect-error a type argument holds its argument as its argument, never as content
export const typeArgumentContent: V.BuildInput<RustMap, 'element.type_argument'>['content'] = 'u8';
declare const call: V.Read<RustMap, 'expression.call'>;
export const statements: V.BuildInput<RustMap, 'statement.block'>['statements'] = [call];
// @ts-expect-error a statement list holds an expression itself, so no expression statement wraps it
export const expressionStatement: V.BuildInput<RustMap, 'statement.expression'> = { $path: 'statement.expression' };

export const fragment: Binding['fragment'] = 'expr';
// @ts-expect-error a fragment specifier is one of the grammar's fragment tokens
export const notFragment: Binding['fragment'] = 'expression';
export const readFragment: BindingRead['fragment'] = 'ident';

type Integer = V.BuildInput<RustMap, 'literal.number.integer'>;

export const suffix: Integer['suffix'] = 'u8';
export const integerValue: Integer = { $path: 'literal.number.integer', $value: 7, suffix: 'u8' };
export const integerRead: V.Read<RustMap, 'literal.number.integer'> = { $path: 'literal.number.integer', $value: 7, suffix: 'u8' };
// @ts-expect-error a number's digits are written from its $value, never given beside it
export const integerDigits: Integer = { $path: 'literal.number.integer', $value: 7, content: '7' };
// @ts-expect-error an integer suffix is one of the grammar's suffix tokens
export const notSuffix: Integer['suffix'] = 'q8';
// @ts-expect-error a read suffix is one of the grammar's suffix tokens
export const notReadSuffix: V.Read<RustMap, 'literal.number.integer.hex'>['suffix'] = 'q8';

type Returned = V.BuildInput<RustMap, 'statement.return'>['expression'];

export const integerReturned: Returned = 1;
export const floatReturned: Returned = 1.5;
// @ts-expect-error rust builds no bigint number
export const bigintReturned: Returned = 10n;

type LetValue = V.BuildInput<RustMap, 'clause.let'>['value'];

declare const rangeRead: V.Read<RustMap, 'expression.range'>;
declare const exclusiveRangeRead: V.Read<RustMap, 'expression.range.exclusive'>;
export const letExclusiveRange: LetValue = exclusiveRangeRead;
// @ts-expect-error a binary range always reads as an exclusive or an inclusive range, so no slot holds a bare range
export const letRange: LetValue = rangeRead;
export const bareRange: V.BuildInput<RustMap, 'expression.range'> = { $path: 'expression.range' };
export const postfixRange: V.BuildInput<RustMap, 'expression.range'> = { $path: 'expression.range', start: 1 };

type FunctionName = V.BuildInput<RustMap, 'declaration.function'>['name'];

export const tailName: FunctionName = { $path: 'metavariable', $value: 'y' };
export const fullName: FunctionName = { $path: 'identifier.metavariable', $value: 'y' };
export const ownTailName: FunctionName = { $path: 'identifier', $value: 'y' };
// @ts-expect-error a root build takes only the full path, never a tail
export const rootTail: V.PathInput<RustMap, 'identifier.metavariable'> = { $path: 'metavariable', $value: 'y' };

export const arithmeticTail: Returned = { $path: 'arithmetic.add', left: 'a', right: 'b' };
export const compoundTail: Returned = { $path: 'compound.add', left: 'a', right: 'b' };
export const fullAdd: Returned = { $path: 'expression.binary.arithmetic.add', left: 'a', right: 'b' };
// @ts-expect-error add is the last segment of two admitted paths, so it names neither
export const sharedTail: Returned = { $path: 'add', left: 'a', right: 'b' };
// @ts-expect-error a slot takes a path's tail and its full path, and no suffix in between
export const betweenTail: Returned = { $path: 'binary.arithmetic.add', left: 'a', right: 'b' };
