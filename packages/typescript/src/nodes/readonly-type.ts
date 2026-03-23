import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ReadonlyType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ReadonlyTypeBuilder extends BaseBuilder<ReadonlyType> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('readonly');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReadonlyType {
    return {
      kind: 'readonly_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ReadonlyType;
  }

  override get nodeKind(): string { return 'readonly_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'readonly' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function readonly_type(children: Child): ReadonlyTypeBuilder {
  return new ReadonlyTypeBuilder(children);
}
