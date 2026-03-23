import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AliasedImport, DottedName, ImportStatement } from '../types.js';


class ImportStatementBuilder extends Builder<ImportStatement> {
  private _name: Builder<AliasedImport | DottedName>[] = [];

  constructor(...name: Builder<AliasedImport | DottedName>[]) {
    super();
    this._name = name;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('import');
    if (this._name.length > 0) parts.push(this.renderChildren(this._name, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportStatement {
    return {
      kind: 'import_statement',
      name: this._name.map(c => c.build(ctx)),
    } as ImportStatement;
  }

  override get nodeKind(): string { return 'import_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'import', type: 'import' });
    for (const child of this._name) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'name' });
    }
    return parts;
  }
}

export type { ImportStatementBuilder };

export function import_statement(...name: Builder<AliasedImport | DottedName>[]): ImportStatementBuilder {
  return new ImportStatementBuilder(...name);
}

export interface ImportStatementOptions {
  name: Builder<AliasedImport | DottedName> | (Builder<AliasedImport | DottedName>)[];
}

export namespace import_statement {
  export function from(options: ImportStatementOptions): ImportStatementBuilder {
    const _ctor = options.name;
    const _arr = Array.isArray(_ctor) ? _ctor : [_ctor];
    const b = new ImportStatementBuilder(..._arr);
    return b;
  }
}
