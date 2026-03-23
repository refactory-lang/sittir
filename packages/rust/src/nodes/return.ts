import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ReturnExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ReturnBuilder extends BaseBuilder<ReturnExpression> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('return');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReturnExpression {
    return {
      kind: 'return_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ReturnExpression;
  }

  override get nodeKind(): string { return 'return_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'return' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function return_(): ReturnBuilder {
  return new ReturnBuilder();
}
