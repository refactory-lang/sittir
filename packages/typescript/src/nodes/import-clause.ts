import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, ImportClause, NamedImports, NamespaceImport } from '../types.js';
import { namespace_import } from './namespace-import.js';
import type { NamespaceImportOptions } from './namespace-import.js';
import { named_imports } from './named-imports.js';
import type { NamedImportsOptions } from './named-imports.js';


class ImportClauseBuilder extends Builder<ImportClause> {
  private _children: Builder<NamespaceImport | NamedImports | Identifier>[] = [];

  constructor(...children: Builder<NamespaceImport | NamedImports | Identifier>[]) {
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

  override get nodeKind(): 'import_clause' { return 'import_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ImportClauseBuilder };

export function import_clause(...children: Builder<NamespaceImport | NamedImports | Identifier>[]): ImportClauseBuilder {
  return new ImportClauseBuilder(...children);
}

export interface ImportClauseOptions {
  nodeKind: 'import_clause';
  children?: Builder<NamespaceImport | NamedImports | Identifier> | string | NamespaceImportOptions | NamedImportsOptions | (Builder<NamespaceImport | NamedImports | Identifier> | string | NamespaceImportOptions | NamedImportsOptions)[];
}

export namespace import_clause {
  export function from(input: Omit<ImportClauseOptions, 'nodeKind'> | Builder<NamespaceImport | NamedImports | Identifier> | string | NamespaceImportOptions | NamedImportsOptions | (Builder<NamespaceImport | NamedImports | Identifier> | string | NamespaceImportOptions | NamedImportsOptions)[]): ImportClauseBuilder {
    const options: Omit<ImportClauseOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ImportClauseOptions, 'nodeKind'>
      : { children: input } as Omit<ImportClauseOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ImportClauseBuilder(..._arr.map(_v => { if (typeof _v === 'string') return new LeafBuilder('identifier', _v); if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'namespace_import': return namespace_import.from(_v);   case 'named_imports': return named_imports.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
