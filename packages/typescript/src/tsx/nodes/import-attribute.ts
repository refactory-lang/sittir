import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportAttribute } from '../types.js';


class ImportAttributeBuilder extends Builder<ImportAttribute> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('with');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportAttribute {
    return {
      kind: 'import_attribute',
      children: this._children[0]?.build(ctx),
    } as ImportAttribute;
  }

  override get nodeKind(): string { return 'import_attribute'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'with', type: 'with' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ImportAttributeBuilder };

export function import_attribute(children: Builder): ImportAttributeBuilder {
  return new ImportAttributeBuilder(children);
}

export interface ImportAttributeOptions {
  children: Builder | (Builder)[];
}

export namespace import_attribute {
  export function from(options: ImportAttributeOptions): ImportAttributeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ImportAttributeBuilder(_ctor);
    return b;
  }
}
