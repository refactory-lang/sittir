import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TernaryExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TernaryBuilder extends BaseBuilder<TernaryExpression> {
  private _alternative: Child;
  private _condition!: Child;
  private _consequence!: Child;

  constructor(alternative: Child) {
    super();
    this._alternative = alternative;
  }

  condition(value: Child): this {
    this._condition = value;
    return this;
  }

  consequence(value: Child): this {
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
      alternative: this.renderChild(this._alternative, ctx),
      condition: this._condition ? this.renderChild(this._condition, ctx) : undefined,
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

export function ternary(alternative: Child): TernaryBuilder {
  return new TernaryBuilder(alternative);
}
