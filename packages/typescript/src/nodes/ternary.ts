import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, TernaryExpression } from '../types.js';


class TernaryBuilder extends Builder<TernaryExpression> {
  private _alternative!: Builder;
  private _condition: Builder;
  private _consequence!: Builder;

  constructor(condition: Builder) {
    super();
    this._condition = condition;
  }

  alternative(value: Builder): this {
    this._alternative = value;
    return this;
  }

  consequence(value: Builder): this {
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
      alternative: this._alternative ? this.renderChild(this._alternative, ctx) : undefined,
      condition: this.renderChild(this._condition, ctx),
      consequence: this._consequence ? this.renderChild(this._consequence, ctx) : undefined,
    } as unknown as TernaryExpression;
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

export type { TernaryBuilder };

export function ternary(condition: Builder): TernaryBuilder {
  return new TernaryBuilder(condition);
}

export interface TernaryExpressionOptions {
  alternative: Builder<Expression>;
  condition: Builder<Expression>;
  consequence: Builder<Expression>;
}

export namespace ternary {
  export function from(options: TernaryExpressionOptions): TernaryBuilder {
    const b = new TernaryBuilder(options.condition);
    if (options.alternative !== undefined) b.alternative(options.alternative);
    if (options.consequence !== undefined) b.consequence(options.consequence);
    return b;
  }
}
