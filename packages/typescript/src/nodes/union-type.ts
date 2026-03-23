import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UnionType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class UnionTypeBuilder extends BaseBuilder<UnionType> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('union');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnionType {
    return {
      kind: 'union_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as UnionType;
  }

  override get nodeKind(): string { return 'union_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'union' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function union_type(children: Child[]): UnionTypeBuilder {
  return new UnionTypeBuilder(children);
}
