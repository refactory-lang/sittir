import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, Identifier, ShorthandFieldInitializer } from '../types.js';
import { attribute } from './attribute-item.js';
import type { AttributeItemOptions } from './attribute-item.js';


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

  override get nodeKind(): 'shorthand_field_initializer' { return 'shorthand_field_initializer'; }

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
  nodeKind: 'shorthand_field_initializer';
  children?: Builder<AttributeItem | Identifier> | string | Omit<AttributeItemOptions, 'nodeKind'> | (Builder<AttributeItem | Identifier> | string | Omit<AttributeItemOptions, 'nodeKind'>)[];
}

export namespace shorthand_field_initializer {
  export function from(input: Omit<ShorthandFieldInitializerOptions, 'nodeKind'> | Builder<AttributeItem | Identifier> | string | Omit<AttributeItemOptions, 'nodeKind'> | (Builder<AttributeItem | Identifier> | string | Omit<AttributeItemOptions, 'nodeKind'>)[]): ShorthandFieldInitializerBuilder {
    const options: Omit<ShorthandFieldInitializerOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ShorthandFieldInitializerOptions, 'nodeKind'>
      : { children: input } as Omit<ShorthandFieldInitializerOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ShorthandFieldInitializerBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v instanceof Builder ? _v : attribute.from(_v)));
    return b;
  }
}
