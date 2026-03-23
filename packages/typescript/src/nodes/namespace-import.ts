import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { NamespaceImport } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class NamespaceImportBuilder extends BaseBuilder<NamespaceImport> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function namespace_import(children: Child): NamespaceImportBuilder {
  return new NamespaceImportBuilder(children);
}
