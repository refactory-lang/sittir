import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { IfExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class IfBuilder extends BaseBuilder<IfExpression> {
  private _alternative?: Child;
  private _condition: Child;
  private _consequence!: Child;

  constructor(condition: Child) {
    super();
    this._condition = condition;
  }

  alternative(value: Child): this {
    this._alternative = value;
    return this;
  }

  consequence(value: Child): this {
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
      alternative: this._alternative ? this.renderChild(this._alternative, ctx) : undefined,
      condition: this.renderChild(this._condition, ctx),
      consequence: this._consequence ? this.renderChild(this._consequence, ctx) : undefined,
    } as unknown as IfExpression;
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

export function if_(condition: Child): IfBuilder {
  return new IfBuilder(condition);
}
