import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, TernaryExpression } from '../types.js';


class TernaryExpressionBuilder extends Builder<TernaryExpression> {
  private _alternative!: Builder<Expression>;
  private _condition: Builder<Expression>;
  private _consequence!: Builder<Expression>;

  constructor(condition: Builder<Expression>) {
    super();
    this._condition = condition;
  }

  alternative(value: Builder<Expression>): this {
    this._alternative = value;
    return this;
  }

  consequence(value: Builder<Expression>): this {
    this._consequence = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._consequence) parts.push(this.renderChild(this._consequence, ctx));
    parts.push(':');
    if (this._alternative) parts.push(this.renderChild(this._alternative, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TernaryExpression {
    return {
      kind: 'ternary_expression',
      alternative: this._alternative?.build(ctx),
      condition: this._condition.build(ctx),
      consequence: this._consequence?.build(ctx),
    } as TernaryExpression;
  }

  override get nodeKind(): string { return 'ternary_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._consequence) parts.push({ kind: 'builder', builder: this._consequence, fieldName: 'consequence' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._alternative) parts.push({ kind: 'builder', builder: this._alternative, fieldName: 'alternative' });
    return parts;
  }
}

export type { TernaryExpressionBuilder };

export function ternary_expression(condition: Builder<Expression>): TernaryExpressionBuilder {
  return new TernaryExpressionBuilder(condition);
}

export interface TernaryExpressionOptions {
  alternative: Builder<Expression>;
  condition: Builder<Expression>;
  consequence: Builder<Expression>;
}

export namespace ternary_expression {
  export function from(options: TernaryExpressionOptions): TernaryExpressionBuilder {
    const b = new TernaryExpressionBuilder(options.condition);
    if (options.alternative !== undefined) b.alternative(options.alternative);
    if (options.consequence !== undefined) b.consequence(options.consequence);
    return b;
  }
}
