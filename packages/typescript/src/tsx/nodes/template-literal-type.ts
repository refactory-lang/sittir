import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { StringFragment, TemplateLiteralType, TemplateType } from '../types.js';


class TemplateLiteralTypeBuilder extends Builder<TemplateLiteralType> {
  private _children: Builder<StringFragment | TemplateType>[] = [];

  constructor() { super(); }

  children(...value: Builder<StringFragment | TemplateType>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('`');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('`');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TemplateLiteralType {
    return {
      kind: 'template_literal_type',
      children: this._children.map(c => c.build(ctx)),
    } as TemplateLiteralType;
  }

  override get nodeKind(): string { return 'template_literal_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '`', type: '`' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '`', type: '`' });
    return parts;
  }
}

export type { TemplateLiteralTypeBuilder };

export function template_literal_type(): TemplateLiteralTypeBuilder {
  return new TemplateLiteralTypeBuilder();
}

export interface TemplateLiteralTypeOptions {
  children?: Builder<StringFragment | TemplateType> | (Builder<StringFragment | TemplateType>)[];
}

export namespace template_literal_type {
  export function from(options: TemplateLiteralTypeOptions): TemplateLiteralTypeBuilder {
    const b = new TemplateLiteralTypeBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
