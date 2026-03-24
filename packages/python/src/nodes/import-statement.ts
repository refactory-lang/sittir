import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AliasedImport, DottedName, ImportStatement } from '../types.js';
import { dotted_name } from './dotted-name.js';
import type { DottedNameOptions } from './dotted-name.js';
import { aliased_import } from './aliased-import.js';
import type { AliasedImportOptions } from './aliased-import.js';


class ImportStatementBuilder extends Builder<ImportStatement> {
  private _name: Builder<DottedName | AliasedImport>[] = [];

  constructor(...name: Builder<DottedName | AliasedImport>[]) {
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

  override get nodeKind(): 'import_statement' { return 'import_statement'; }

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

export function import_statement(...name: Builder<DottedName | AliasedImport>[]): ImportStatementBuilder {
  return new ImportStatementBuilder(...name);
}

export interface ImportStatementOptions {
  nodeKind: 'import_statement';
  name: Builder<DottedName | AliasedImport> | DottedNameOptions | AliasedImportOptions | (Builder<DottedName | AliasedImport> | DottedNameOptions | AliasedImportOptions)[];
}

export namespace import_statement {
  export function from(input: Omit<ImportStatementOptions, 'nodeKind'> | Builder<DottedName | AliasedImport> | DottedNameOptions | AliasedImportOptions | (Builder<DottedName | AliasedImport> | DottedNameOptions | AliasedImportOptions)[]): ImportStatementBuilder {
    const options: Omit<ImportStatementOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'name' in input
      ? input as Omit<ImportStatementOptions, 'nodeKind'>
      : { name: input } as Omit<ImportStatementOptions, 'nodeKind'>;
    const _ctor = options.name;
    const _arr = Array.isArray(_ctor) ? _ctor : [_ctor];
    const b = new ImportStatementBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'dotted_name': return dotted_name.from(_v);   case 'aliased_import': return aliased_import.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
