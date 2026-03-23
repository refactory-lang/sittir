import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportAttribute } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ImportAttributeBuilder extends BaseBuilder<ImportAttribute> {
  private _children: Child[] = [];

  constructor(children: Child) {
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
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ImportAttribute;
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

export function import_attribute(children: Child): ImportAttributeBuilder {
  return new ImportAttributeBuilder(children);
}
