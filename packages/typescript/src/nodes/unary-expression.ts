import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, UnaryExpression } from '../types.js';


class UnaryExpressionBuilder extends Builder<UnaryExpression> {
  private _operator!: Builder;
  private _argument: Builder<Expression>;

  constructor(argument: Builder<Expression>) {
    super();
    this._argument = argument;
  }

  operator(value: Builder): this {
    this._operator = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
    if (this._argument) parts.push(this.renderChild(this._argument, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnaryExpression {
    return {
      kind: 'unary_expression',
      operator: this._operator ? this.buildChild(this._operator, ctx) : undefined,
      argument: this._argument.build(ctx),
    } as UnaryExpression;
  }

  override get nodeKind(): 'unary_expression' { return 'unary_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    return parts;
  }
}

export type { UnaryExpressionBuilder };

export function unary_expression(argument: Builder<Expression>): UnaryExpressionBuilder {
  return new UnaryExpressionBuilder(argument);
}

export interface UnaryExpressionOptions {
  nodeKind: 'unary_expression';
  operator: Builder;
  argument: Builder<Expression>;
}

export namespace unary_expression {
  export function from(options: Omit<UnaryExpressionOptions, 'nodeKind'>): UnaryExpressionBuilder {
    const b = new UnaryExpressionBuilder(options.argument);
    if (options.operator !== undefined) b.operator(options.operator);
    return b;
  }
}
