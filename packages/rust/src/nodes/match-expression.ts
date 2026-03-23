import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, MatchBlock, MatchExpression } from '../types.js';


class MatchExpressionBuilder extends Builder<MatchExpression> {
  private _body!: Builder<MatchBlock>;
  private _value: Builder<Expression>;

  constructor(value: Builder<Expression>) {
    super();
    this._value = value;
  }

  body(value: Builder<MatchBlock>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('match');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MatchExpression {
    return {
      kind: 'match_expression',
      body: this._body?.build(ctx),
      value: this._value.build(ctx),
    } as MatchExpression;
  }

  override get nodeKind(): string { return 'match_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'match', type: 'match' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { MatchExpressionBuilder };

export function match_expression(value: Builder<Expression>): MatchExpressionBuilder {
  return new MatchExpressionBuilder(value);
}

export interface MatchExpressionOptions {
  body: Builder<MatchBlock>;
  value: Builder<Expression>;
}

export namespace match_expression {
  export function from(options: MatchExpressionOptions): MatchExpressionBuilder {
    const b = new MatchExpressionBuilder(options.value);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
