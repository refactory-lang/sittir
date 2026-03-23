import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, NamespaceExport } from '../types.js';


class NamespaceExportBuilder extends Builder<NamespaceExport> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
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

export type { NamespaceExportBuilder };

export function namespace_export(children: Builder): NamespaceExportBuilder {
  return new NamespaceExportBuilder(children);
}

export interface NamespaceExportOptions {
  children: Builder<Identifier> | (Builder<Identifier>)[];
}

export namespace namespace_export {
  export function from(options: NamespaceExportOptions): NamespaceExportBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new NamespaceExportBuilder(_ctor);
    return b;
  }
}
