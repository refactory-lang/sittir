import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, JsxAttribute, JsxExpression, JsxNamespaceName, JsxOpeningElement, MemberExpression, TypeArguments } from '../types.js';


class JsxOpeningElementBuilder extends Builder<JsxOpeningElement> {
  private _attribute: Builder<JsxAttribute | JsxExpression>[] = [];
  private _name?: Builder<Identifier | JsxNamespaceName | MemberExpression>;
  private _typeArguments?: Builder<TypeArguments>;

  constructor() { super(); }

  attribute(...value: Builder<JsxAttribute | JsxExpression>[]): this {
    this._attribute = value;
    return this;
  }

  name(value: Builder<Identifier | JsxNamespaceName | MemberExpression>): this {
    this._name = value;
    return this;
  }

  typeArguments(value: Builder<TypeArguments>): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._attribute.length > 0) parts.push(this.renderChildren(this._attribute, ', ', ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): JsxOpeningElement {
    return {
      kind: 'jsx_opening_element',
      attribute: this._attribute.map(c => c.build(ctx)),
      name: this._name?.build(ctx),
      typeArguments: this._typeArguments?.build(ctx),
    } as JsxOpeningElement;
  }

  override get nodeKind(): string { return 'jsx_opening_element'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._attribute) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'attribute' });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export type { JsxOpeningElementBuilder };

export function jsx_opening_element(): JsxOpeningElementBuilder {
  return new JsxOpeningElementBuilder();
}

export interface JsxOpeningElementOptions {
  attribute?: Builder<JsxAttribute | JsxExpression> | (Builder<JsxAttribute | JsxExpression>)[];
  name?: Builder<Identifier | JsxNamespaceName | MemberExpression>;
  typeArguments?: Builder<TypeArguments>;
}

export namespace jsx_opening_element {
  export function from(options: JsxOpeningElementOptions): JsxOpeningElementBuilder {
    const b = new JsxOpeningElementBuilder();
    if (options.attribute !== undefined) {
      const _v = options.attribute;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.attribute(..._arr);
    }
    if (options.name !== undefined) b.name(options.name);
    if (options.typeArguments !== undefined) b.typeArguments(options.typeArguments);
    return b;
  }
}
