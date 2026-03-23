import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { PrimaryExpression, UnaryOperator } from '../types.js';


class UnaryOperatorBuilder extends Builder<UnaryOperator> {
  private _argument: Builder<PrimaryExpression>;
  private _operator!: Builder;

  constructor(argument: Builder<PrimaryExpression>) {
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

  build(ctx?: RenderContext): UnaryOperator {
    return {
      kind: 'unary_operator',
      argument: this._argument.build(ctx),
      operator: this._operator?.build(ctx),
    } as UnaryOperator;
  }

  override get nodeKind(): string { return 'unary_operator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    return parts;
  }
}

export type { UnaryOperatorBuilder };

export function unary_operator(argument: Builder<PrimaryExpression>): UnaryOperatorBuilder {
  return new UnaryOperatorBuilder(argument);
}

export interface UnaryOperatorOptions {
  argument: Builder<PrimaryExpression>;
  operator: Builder;
}

export namespace unary_operator {
  export function from(options: UnaryOperatorOptions): UnaryOperatorBuilder {
    const b = new UnaryOperatorBuilder(options.argument);
    if (options.operator !== undefined) b.operator(options.operator);
    return b;
  }
}
