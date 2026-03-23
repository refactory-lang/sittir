import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ShorthandFieldInitializer } from '../types.js';


class ShorthandFieldInitializerBuilder extends BaseBuilder<ShorthandFieldInitializer> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ShorthandFieldInitializer {
    return {
      kind: 'shorthand_field_initializer',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ShorthandFieldInitializer;
  }

  override get nodeKind(): string { return 'shorthand_field_initializer'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function shorthand_field_initializer(children: BaseBuilder[]): ShorthandFieldInitializerBuilder {
  return new ShorthandFieldInitializerBuilder(children);
}
