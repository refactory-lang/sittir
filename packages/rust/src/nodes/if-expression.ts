import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElseClause, Expression, IfExpression, LetChain, LetCondition } from '../types.js';


class IfExpressionBuilder extends Builder<IfExpression> {
  private _alternative?: Builder<ElseClause>;
  private _condition: Builder<Expression | LetChain | LetCondition>;
  private _consequence!: Builder<Block>;

  constructor(condition: Builder<Expression | LetChain | LetCondition>) {
    super();
    this._condition = condition;
  }

  alternative(value: Builder<ElseClause>): this {
    this._alternative = value;
    return this;
  }

  consequence(value: Builder<Block>): this {
    this._consequence = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('if');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._consequence) parts.push(this.renderChild(this._consequence, ctx));
    if (this._alternative) parts.push(this.renderChild(this._alternative, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IfExpression {
    return {
      kind: 'if_expression',
      alternative: this._alternative?.build(ctx),
      condition: this._condition.build(ctx),
      consequence: this._consequence?.build(ctx),
    } as IfExpression;
  }

  override get nodeKind(): string { return 'if_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'if', type: 'if' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._consequence) parts.push({ kind: 'builder', builder: this._consequence, fieldName: 'consequence' });
    if (this._alternative) parts.push({ kind: 'builder', builder: this._alternative, fieldName: 'alternative' });
    return parts;
  }
}

export type { IfExpressionBuilder };

export function if_expression(condition: Builder<Expression | LetChain | LetCondition>): IfExpressionBuilder {
  return new IfExpressionBuilder(condition);
}

export interface IfExpressionOptions {
  alternative?: Builder<ElseClause>;
  condition: Builder<Expression | LetChain | LetCondition>;
  consequence: Builder<Block>;
}

export namespace if_expression {
  export function from(options: IfExpressionOptions): IfExpressionBuilder {
    const b = new IfExpressionBuilder(options.condition);
    if (options.alternative !== undefined) b.alternative(options.alternative);
    if (options.consequence !== undefined) b.consequence(options.consequence);
    return b;
  }
}
