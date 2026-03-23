import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TokenTreePattern } from '../types.js';


class TokenTreePatternBuilder extends BaseBuilder<TokenTreePattern> {
  private _children: BaseBuilder[] = [];

  constructor() { super(); }

  children(value: BaseBuilder[]): this {
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

  build(ctx?: RenderContext): TokenTreePattern {
    return {
      kind: 'token_tree_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TokenTreePattern;
  }

  override get nodeKind(): string { return 'token_tree_pattern'; }

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

export function token_tree_pattern(): TokenTreePatternBuilder {
  return new TokenTreePatternBuilder();
}
