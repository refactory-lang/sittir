// Today's shape: factories are not generic over their children.
import type * as T from '../../../../packages/typescript/src/types.ts';
import type { Admit } from '../../../../packages/types/src/node-surface.ts';

export declare function block(...c: Admit<T.Statement>[]): T.StatementBlock.Bound;
export declare function whileS(c: { condition: Admit<T.ParenthesizedExpression>; body: Admit<T.Statement> }): T.WhileStatement.Bound;
export declare function ifS(c: { condition: Admit<T.ParenthesizedExpression>; consequence: Admit<T.Statement> }): T.IfStatement.Bound;
export declare function exprS(e: Admit<T.Expression>): T.ExpressionStatement.Bound;
export declare function paren(e: Admit<T.Expression>): T.ParenthesizedExpression.Bound;
export declare function awaitE(e: Admit<T.Expression>): T.AwaitExpression.Bound;
export declare function bin(l: Admit<T.Expression>, r: Admit<T.Expression>): T.BinaryExpression.Bound;
export declare function call(f: Admit<T.Expression>, ...args: Admit<T.Expression>[]): T.CallExpression.Bound;
export declare function ident(name: string): T.Identifier.Bound;
export declare function breakS(): T.BreakStatement.Bound;
export declare function returnS(e?: Admit<T.Expression>): T.ReturnStatement.Bound;
export declare function fn(c: { name: string; async?: boolean; body: Admit<T.StatementBlock> }): T.FunctionDeclaration.Bound;
export declare function program(...c: Admit<T.Statement>[]): T.Program.Bound;
