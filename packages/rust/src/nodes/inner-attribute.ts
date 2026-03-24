import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, InnerAttributeItem } from '../types.js';
import { attribute } from './attribute.js';
import type { AttributeOptions } from './attribute.js';


class InnerAttributeBuilder extends Builder<InnerAttributeItem> {
  private _children: Builder<Attribute>[] = [];

  constructor(children: Builder<Attribute>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('#');
    parts.push('!');
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): InnerAttributeItem {
    return {
      kind: 'inner_attribute_item',
      children: this._children[0]!.build(ctx),
    } as InnerAttributeItem;
  }

  override get nodeKind(): 'inner_attribute_item' { return 'inner_attribute_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '#', type: '#' });
    parts.push({ kind: 'token', text: '!', type: '!' });
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { InnerAttributeBuilder };

export function inner_attribute(children: Builder<Attribute>): InnerAttributeBuilder {
  return new InnerAttributeBuilder(children);
}

export interface InnerAttributeItemOptions {
  nodeKind: 'inner_attribute_item';
  children: Builder<Attribute> | Omit<AttributeOptions, 'nodeKind'> | (Builder<Attribute> | Omit<AttributeOptions, 'nodeKind'>)[];
}

export namespace inner_attribute {
  export function from(input: Omit<InnerAttributeItemOptions, 'nodeKind'> | Builder<Attribute> | Omit<AttributeOptions, 'nodeKind'> | (Builder<Attribute> | Omit<AttributeOptions, 'nodeKind'>)[]): InnerAttributeBuilder {
    const options: Omit<InnerAttributeItemOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<InnerAttributeItemOptions, 'nodeKind'>
      : { children: input } as Omit<InnerAttributeItemOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new InnerAttributeBuilder(_ctor instanceof Builder ? _ctor : attribute.from(_ctor));
    return b;
  }
}
