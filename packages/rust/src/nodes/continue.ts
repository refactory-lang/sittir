import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ContinueExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ContinueBuilder extends BaseBuilder<ContinueExpression> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('continue');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ContinueExpression {
    return {
      kind: 'continue_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ContinueExpression;
  }

  override get nodeKind(): string { return 'continue_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'continue' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function continue_(): ContinueBuilder {
  return new ContinueBuilder();
}
