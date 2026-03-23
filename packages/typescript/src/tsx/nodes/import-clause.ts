import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, ImportClause, NamedImports, NamespaceImport } from '../types.js';


class ImportClauseBuilder extends Builder<ImportClause> {
  private _children: Builder<Identifier | NamedImports | NamespaceImport>[] = [];

  constructor(...children: Builder<Identifier | NamedImports | NamespaceImport>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportClause {
    return {
      kind: 'import_clause',
      children: this._children.map(c => c.build(ctx)),
    } as ImportClause;
  }

  override get nodeKind(): string { return 'import_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ImportClauseBuilder };

export function import_clause(...children: Builder<Identifier | NamedImports | NamespaceImport>[]): ImportClauseBuilder {
  return new ImportClauseBuilder(...children);
}

export interface ImportClauseOptions {
  children: Builder<Identifier | NamedImports | NamespaceImport> | (Builder<Identifier | NamedImports | NamespaceImport>)[];
}

export namespace import_clause {
  export function from(options: ImportClauseOptions): ImportClauseBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ImportClauseBuilder(..._arr);
    return b;
  }
}
