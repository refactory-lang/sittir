import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TokenTree } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TokenTreeBuilder extends BaseBuilder<TokenTree> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TokenTree {
    return {
      kind: 'token_tree',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TokenTree;
  }

  override get nodeKind(): string { return 'token_tree'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export function token_tree(): TokenTreeBuilder {
  return new TokenTreeBuilder();
}
