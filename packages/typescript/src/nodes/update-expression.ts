import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, UpdateExpression } from '../types.js';


class UpdateExpressionBuilder extends Builder<UpdateExpression> {
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
    if (this._argument) parts.push(this.renderChild(this._argument, ctx));
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UpdateExpression {
    return {
      kind: 'update_expression',
      argument: this._argument.build(ctx),
      operator: this._operator?.build(ctx),
    } as UpdateExpression;
  }

  override get nodeKind(): string { return 'update_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    return parts;
  }
}

export type { UpdateExpressionBuilder };

export function update_expression(argument: Builder<Expression>): UpdateExpressionBuilder {
  return new UpdateExpressionBuilder(argument);
}

export interface UpdateExpressionOptions {
  argument: Builder<Expression>;
  operator: Builder;
}

export namespace update_expression {
  export function from(options: UpdateExpressionOptions): UpdateExpressionBuilder {
    const b = new UpdateExpressionBuilder(options.argument);
    if (options.operator !== undefined) b.operator(options.operator);
    return b;
  }
}
