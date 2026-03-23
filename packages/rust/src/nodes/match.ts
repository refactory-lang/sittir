import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, MatchBlock, MatchExpression } from '../types.js';


class MatchBuilder extends Builder<MatchExpression> {
  private _body!: Builder;
  private _value: Builder;

  constructor(value: Builder) {
    super();
    this._value = value;
  }

  body(value: Builder): this {
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      value: this.renderChild(this._value, ctx),
    } as unknown as MatchExpression;
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

export type { MatchBuilder };

export function match(value: Builder): MatchBuilder {
  return new MatchBuilder(value);
}

export interface MatchExpressionOptions {
  body: Builder<MatchBlock>;
  value: Builder<Expression>;
}

export namespace match {
  export function from(options: MatchExpressionOptions): MatchBuilder {
    const b = new MatchBuilder(options.value);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
