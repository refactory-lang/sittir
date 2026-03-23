import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { NamespaceImport } from '../types.js';


class NamespaceImportBuilder extends BaseBuilder<NamespaceImport> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('*');
    parts.push('as');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NamespaceImport {
    return {
      kind: 'namespace_import',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as NamespaceImport;
  }

  override get nodeKind(): string { return 'namespace_import'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '*', type: '*' });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function namespace_import(children: BaseBuilder): NamespaceImportBuilder {
  return new NamespaceImportBuilder(children);
}
