import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ThrowStatement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ThrowBuilder extends BaseBuilder<ThrowStatement> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('throw');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ThrowStatement {
    return {
      kind: 'throw_statement',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ThrowStatement;
  }

  override get nodeKind(): string { return 'throw_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'throw', type: 'throw' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function throw_(children: Child): ThrowBuilder {
  return new ThrowBuilder(children);
}
