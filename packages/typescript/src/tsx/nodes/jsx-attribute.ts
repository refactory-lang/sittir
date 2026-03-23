import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { JsxAttribute, JsxElement, JsxExpression, JsxNamespaceName, JsxSelfClosingElement, PropertyIdentifier } from '../types.js';


class JsxAttributeBuilder extends Builder<JsxAttribute> {
  private _children: Builder<JsxElement | JsxExpression | JsxNamespaceName | JsxSelfClosingElement | PropertyIdentifier>[] = [];

  constructor(...children: Builder<JsxElement | JsxExpression | JsxNamespaceName | JsxSelfClosingElement | PropertyIdentifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): JsxAttribute {
    return {
      kind: 'jsx_attribute',
      children: this._children.map(c => c.build(ctx)),
    } as JsxAttribute;
  }

  override get nodeKind(): string { return 'jsx_attribute'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { JsxAttributeBuilder };

export function jsx_attribute(...children: Builder<JsxElement | JsxExpression | JsxNamespaceName | JsxSelfClosingElement | PropertyIdentifier>[]): JsxAttributeBuilder {
  return new JsxAttributeBuilder(...children);
}

export interface JsxAttributeOptions {
  children: Builder<JsxElement | JsxExpression | JsxNamespaceName | JsxSelfClosingElement | PropertyIdentifier> | (Builder<JsxElement | JsxExpression | JsxNamespaceName | JsxSelfClosingElement | PropertyIdentifier>)[];
}

export namespace jsx_attribute {
  export function from(options: JsxAttributeOptions): JsxAttributeBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new JsxAttributeBuilder(..._arr);
    return b;
  }
}
