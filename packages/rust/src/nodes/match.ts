import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MatchExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class MatchBuilder extends BaseBuilder<MatchExpression> {
  private _body: Child;
  private _value!: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  value(value: Child): this {
    this._value = value;
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
      body: this.renderChild(this._body, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
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

export function match(body: Child): MatchBuilder {
  return new MatchBuilder(body);
}
