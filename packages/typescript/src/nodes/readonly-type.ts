import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ReadonlyType } from '../types.js';


class ReadonlyTypeBuilder extends BaseBuilder<ReadonlyType> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('readonly');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    parts.push({ kind: 'token', text: 'readonly', type: 'readonly' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function readonly_type(children: BaseBuilder): ReadonlyTypeBuilder {
  return new ReadonlyTypeBuilder(children);
}
