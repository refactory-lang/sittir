import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UseWildcard } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class UseWildcardBuilder extends BaseBuilder<UseWildcard> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('*');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UseWildcard {
    return {
      kind: 'use_wildcard',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as UseWildcard;
  }

  override get nodeKind(): string { return 'use_wildcard'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '*', type: '*' });
    return parts;
  }
}

export function use_wildcard(): UseWildcardBuilder {
  return new UseWildcardBuilder();
}
