import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, AttributeItem } from '../types.js';
import { attribute as attribute__dep } from './attribute.js';
import type { AttributeOptions } from './attribute.js';


class AttributeBuilder extends Builder<AttributeItem> {
  private _children: Builder<Attribute>[] = [];

  constructor(children: Builder<Attribute>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('#');
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AttributeItem {
    return {
      kind: 'attribute_item',
      children: this._children[0]!.build(ctx),
    } as AttributeItem;
  }

  override get nodeKind(): 'attribute_item' { return 'attribute_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '#', type: '#' });
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { AttributeBuilder };

export function attribute(children: Builder<Attribute>): AttributeBuilder {
  return new AttributeBuilder(children);
}

export interface AttributeItemOptions {
  nodeKind: 'attribute_item';
  children: Builder<Attribute> | Omit<AttributeOptions, 'nodeKind'> | (Builder<Attribute> | Omit<AttributeOptions, 'nodeKind'>)[];
}

export namespace attribute {
  export function from(input: Omit<AttributeItemOptions, 'nodeKind'> | Builder<Attribute> | Omit<AttributeOptions, 'nodeKind'> | (Builder<Attribute> | Omit<AttributeOptions, 'nodeKind'>)[]): AttributeBuilder {
    const options: Omit<AttributeItemOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<AttributeItemOptions, 'nodeKind'>
      : { children: input } as Omit<AttributeItemOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AttributeBuilder(_ctor instanceof Builder ? _ctor : attribute__dep.from(_ctor));
    return b;
  }
}
