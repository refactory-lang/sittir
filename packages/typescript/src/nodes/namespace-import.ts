import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, NamespaceImport } from '../types.js';


class NamespaceImportBuilder extends Builder<NamespaceImport> {
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

export type { NamespaceImportBuilder };

export function namespace_import(children: Builder): NamespaceImportBuilder {
  return new NamespaceImportBuilder(children);
}

export interface NamespaceImportOptions {
  children: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace namespace_import {
  export function from(options: NamespaceImportOptions): NamespaceImportBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new NamespaceImportBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    return b;
  }
}
