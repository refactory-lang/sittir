import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { HtmlCharacterReference, JsxClosingElement, JsxElement, JsxExpression } from '../types.js';
import { jsx_closing_element } from './jsx-closing-element.js';
import type { JsxClosingElementOptions } from './jsx-closing-element.js';


class JsxElementBuilder extends Builder<JsxElement> {
  private _openTag: Builder;
  private _closeTag!: Builder<JsxClosingElement>;
  private _children: Builder<HtmlCharacterReference | JsxElement | JsxExpression>[] = [];

  constructor(openTag: Builder) {
    super();
    this._openTag = openTag;
  }

  closeTag(value: Builder<JsxClosingElement>): this {
    this._closeTag = value;
    return this;
  }

  children(...value: Builder<HtmlCharacterReference | JsxElement | JsxExpression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._openTag) parts.push(this.renderChild(this._openTag, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._closeTag) parts.push(this.renderChild(this._closeTag, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): JsxElement {
    return {
      kind: 'jsx_element',
      openTag: this._openTag.build(ctx),
      closeTag: this._closeTag?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as JsxElement;
  }

  override get nodeKind(): string { return 'jsx_element'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._openTag) parts.push({ kind: 'builder', builder: this._openTag, fieldName: 'openTag' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._closeTag) parts.push({ kind: 'builder', builder: this._closeTag, fieldName: 'closeTag' });
    return parts;
  }
}

export type { JsxElementBuilder };

export function jsx_element(openTag: Builder): JsxElementBuilder {
  return new JsxElementBuilder(openTag);
}

export interface JsxElementOptions {
  openTag: Builder;
  closeTag: Builder<JsxClosingElement> | JsxClosingElementOptions;
  children?: Builder<HtmlCharacterReference | JsxElement | JsxExpression> | (Builder<HtmlCharacterReference | JsxElement | JsxExpression>)[];
}

export namespace jsx_element {
  export function from(options: JsxElementOptions): JsxElementBuilder {
    const b = new JsxElementBuilder(options.openTag);
    if (options.closeTag !== undefined) {
      const _v = options.closeTag;
      b.closeTag(_v instanceof Builder ? _v : jsx_closing_element.from(_v as JsxClosingElementOptions));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
