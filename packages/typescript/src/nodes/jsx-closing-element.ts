import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, JsxClosingElement, JsxNamespaceName, MemberExpression } from '../types.js';


class JsxClosingElementBuilder extends Builder<JsxClosingElement> {
  private _name?: Builder<Identifier | MemberExpression | JsxNamespaceName>;

  constructor() { super(); }

  name(value: Builder<Identifier | MemberExpression | JsxNamespaceName>): this {
    this._name = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('</');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): JsxClosingElement {
    return {
      kind: 'jsx_closing_element',
      name: this._name?.build(ctx),
    } as JsxClosingElement;
  }

  override get nodeKind(): string { return 'jsx_closing_element'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '</', type: '</' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { JsxClosingElementBuilder };

export function jsx_closing_element(): JsxClosingElementBuilder {
  return new JsxClosingElementBuilder();
}

export interface JsxClosingElementOptions {
  name?: Builder<Identifier | MemberExpression | JsxNamespaceName> | string;
}

export namespace jsx_closing_element {
  export function from(options: JsxClosingElementOptions): JsxClosingElementBuilder {
    const b = new JsxClosingElementBuilder();
    if (options.name !== undefined) {
      const _v = options.name;
      b.name(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    return b;
  }
}
