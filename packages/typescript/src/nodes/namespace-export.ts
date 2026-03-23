import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { NamespaceExport } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class NamespaceExportBuilder extends BaseBuilder<NamespaceExport> {
  private _children: Child[] = [];

  constructor(children: Child) {
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

  build(ctx?: RenderContext): NamespaceExport {
    return {
      kind: 'namespace_export',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as NamespaceExport;
  }

  override get nodeKind(): string { return 'namespace_export'; }

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

export function namespace_export(children: Child): NamespaceExportBuilder {
  return new NamespaceExportBuilder(children);
}
