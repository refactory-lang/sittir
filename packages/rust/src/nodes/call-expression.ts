import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, ArrayExpression, AssignmentExpression, AsyncBlock, AwaitExpression, BinaryExpression, Block, BreakExpression, CallExpression, ClosureExpression, CompoundAssignmentExpr, ConstBlock, ContinueExpression, FieldExpression, ForExpression, GenBlock, GenericFunction, Identifier, IfExpression, IndexExpression, Literal, LoopExpression, MacroInvocation, MatchExpression, Metavariable, ParenthesizedExpression, ReferenceExpression, ReturnExpression, ScopedIdentifier, Self, StructExpression, TryBlock, TryExpression, TupleExpression, TypeCastExpression, UnaryExpression, UnitExpression, UnsafeBlock, WhileExpression, YieldExpression } from '../types.js';


class CallExpressionBuilder extends Builder<CallExpression> {
  private _arguments!: Builder<Arguments>;
  private _function: Builder<Literal | ArrayExpression | AssignmentExpression | AsyncBlock | AwaitExpression | BinaryExpression | Block | BreakExpression | CallExpression | ClosureExpression | CompoundAssignmentExpr | ConstBlock | ContinueExpression | FieldExpression | ForExpression | GenBlock | GenericFunction | Identifier | IfExpression | IndexExpression | LoopExpression | MacroInvocation | MatchExpression | Metavariable | ParenthesizedExpression | ReferenceExpression | ReturnExpression | ScopedIdentifier | Self | StructExpression | TryBlock | TryExpression | TupleExpression | TypeCastExpression | UnaryExpression | UnitExpression | UnsafeBlock | WhileExpression | YieldExpression>;

  constructor(function_: Builder<Literal | ArrayExpression | AssignmentExpression | AsyncBlock | AwaitExpression | BinaryExpression | Block | BreakExpression | CallExpression | ClosureExpression | CompoundAssignmentExpr | ConstBlock | ContinueExpression | FieldExpression | ForExpression | GenBlock | GenericFunction | Identifier | IfExpression | IndexExpression | LoopExpression | MacroInvocation | MatchExpression | Metavariable | ParenthesizedExpression | ReferenceExpression | ReturnExpression | ScopedIdentifier | Self | StructExpression | TryBlock | TryExpression | TupleExpression | TypeCastExpression | UnaryExpression | UnitExpression | UnsafeBlock | WhileExpression | YieldExpression>) {
    super();
    this._function = function_;
  }

  arguments(value: Builder<Arguments>): this {
    this._arguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._function) parts.push(this.renderChild(this._function, ctx));
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CallExpression {
    return {
      kind: 'call_expression',
      arguments: this._arguments?.build(ctx),
      function: this._function.build(ctx),
    } as CallExpression;
  }

  override get nodeKind(): string { return 'call_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._function) parts.push({ kind: 'builder', builder: this._function, fieldName: 'function' });
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    return parts;
  }
}

export type { CallExpressionBuilder };

export function call_expression(function_: Builder<Literal | ArrayExpression | AssignmentExpression | AsyncBlock | AwaitExpression | BinaryExpression | Block | BreakExpression | CallExpression | ClosureExpression | CompoundAssignmentExpr | ConstBlock | ContinueExpression | FieldExpression | ForExpression | GenBlock | GenericFunction | Identifier | IfExpression | IndexExpression | LoopExpression | MacroInvocation | MatchExpression | Metavariable | ParenthesizedExpression | ReferenceExpression | ReturnExpression | ScopedIdentifier | Self | StructExpression | TryBlock | TryExpression | TupleExpression | TypeCastExpression | UnaryExpression | UnitExpression | UnsafeBlock | WhileExpression | YieldExpression>): CallExpressionBuilder {
  return new CallExpressionBuilder(function_);
}

export interface CallExpressionOptions {
  arguments: Builder<Arguments>;
  function: Builder<Literal | ArrayExpression | AssignmentExpression | AsyncBlock | AwaitExpression | BinaryExpression | Block | BreakExpression | CallExpression | ClosureExpression | CompoundAssignmentExpr | ConstBlock | ContinueExpression | FieldExpression | ForExpression | GenBlock | GenericFunction | Identifier | IfExpression | IndexExpression | LoopExpression | MacroInvocation | MatchExpression | Metavariable | ParenthesizedExpression | ReferenceExpression | ReturnExpression | ScopedIdentifier | Self | StructExpression | TryBlock | TryExpression | TupleExpression | TypeCastExpression | UnaryExpression | UnitExpression | UnsafeBlock | WhileExpression | YieldExpression>;
}

export namespace call_expression {
  export function from(options: CallExpressionOptions): CallExpressionBuilder {
    const b = new CallExpressionBuilder(options.function);
    if (options.arguments !== undefined) b.arguments(options.arguments);
    return b;
  }
}
