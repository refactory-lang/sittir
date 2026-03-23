import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ParenthesizedTypeBuilder extends BaseBuilder<ParenthesizedType> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('parenthesized');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ParenthesizedType {
    return {
      kind: 'parenthesized_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ParenthesizedType;
  }

  override get nodeKind(): string { return 'parenthesized_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'parenthesized' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function parenthesized_type(children: Child): ParenthesizedTypeBuilder {
  return new ParenthesizedTypeBuilder(children);
}
