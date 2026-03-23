import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, Identifier, ShorthandFieldInitializer } from '../types.js';


class ShorthandFieldInitializerBuilder extends Builder<ShorthandFieldInitializer> {
  private _children: Builder<AttributeItem | Identifier>[] = [];

  constructor(...children: Builder<AttributeItem | Identifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ShorthandFieldInitializer {
    return {
      kind: 'shorthand_field_initializer',
      children: this._children.map(c => c.build(ctx)),
    } as ShorthandFieldInitializer;
  }

  override get nodeKind(): string { return 'shorthand_field_initializer'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ShorthandFieldInitializerBuilder };

export function shorthand_field_initializer(...children: Builder<AttributeItem | Identifier>[]): ShorthandFieldInitializerBuilder {
  return new ShorthandFieldInitializerBuilder(...children);
}

export interface ShorthandFieldInitializerOptions {
  children: Builder<AttributeItem | Identifier> | (Builder<AttributeItem | Identifier>)[];
}

export namespace shorthand_field_initializer {
  export function from(options: ShorthandFieldInitializerOptions): ShorthandFieldInitializerBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ShorthandFieldInitializerBuilder(..._arr);
    return b;
  }
}
