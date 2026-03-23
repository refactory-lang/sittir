import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, UnaryExpression } from '../types.js';


class UnaryBuilder extends Builder<UnaryExpression> {
  private _argument: Builder<Expression>;
  private _operator!: Builder;

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
      argument: this._argument.build(ctx),
      operator: this._operator?.build(ctx),
    } as UnaryExpression;
  }

  override get nodeKind(): string { return 'unary_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    return parts;
  }
}

export type { UnaryBuilder };

export function unary(argument: Builder<Expression>): UnaryBuilder {
  return new UnaryBuilder(argument);
}

export interface UnaryExpressionOptions {
  argument: Builder<Expression>;
  operator: Builder;
}

export namespace unary {
  export function from(options: UnaryExpressionOptions): UnaryBuilder {
    const b = new UnaryBuilder(options.argument);
    if (options.operator !== undefined) b.operator(options.operator);
    return b;
  }
}
