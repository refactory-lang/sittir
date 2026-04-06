import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BoundedType } from '../types.js';


class BoundedTypeBuilder extends BaseBuilder<BoundedType> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('+');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BoundedType {
    return {
      kind: 'bounded_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as BoundedType;
  }

  override get nodeKind(): string { return 'bounded_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '+', type: '+' });
    return parts;
  }
}

export function bounded_type(children: BaseBuilder[]): BoundedTypeBuilder {
  return new BoundedTypeBuilder(children);
}
