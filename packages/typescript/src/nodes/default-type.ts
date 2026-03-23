import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DefaultType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class DefaultTypeBuilder extends BaseBuilder<DefaultType> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('=');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DefaultType {
    return {
      kind: 'default_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as DefaultType;
  }

  override get nodeKind(): string { return 'default_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '=', type: '=' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function default_type(children: Child): DefaultTypeBuilder {
  return new DefaultTypeBuilder(children);
}
