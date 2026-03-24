import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AliasedImport, DottedName, ImportFromStatement, RelativeImport, WildcardImport } from '../types.js';
import { relative_import } from './relative-import.js';
import type { RelativeImportOptions } from './relative-import.js';
import { dotted_name } from './dotted-name.js';
import type { DottedNameOptions } from './dotted-name.js';
import { aliased_import } from './aliased-import.js';
import type { AliasedImportOptions } from './aliased-import.js';


class ImportFromStatementBuilder extends Builder<ImportFromStatement> {
  private _moduleName: Builder<RelativeImport | DottedName>;
  private _name: Builder<DottedName | AliasedImport>[] = [];
  private _children: Builder<WildcardImport>[] = [];

  constructor(moduleName: Builder<RelativeImport | DottedName>) {
    super();
    this._moduleName = moduleName;
  }

  name(...value: Builder<DottedName | AliasedImport>[]): this {
    this._name = value;
    return this;
  }

  children(...value: Builder<WildcardImport>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('from');
    if (this._moduleName) parts.push(this.renderChild(this._moduleName, ctx));
    parts.push('import');
    if (this._name.length > 0) {
      parts.push(',');
      if (this._name.length > 0) parts.push(this.renderChildren(this._name, ', ', ctx));
    }
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportFromStatement {
    return {
      kind: 'import_from_statement',
      moduleName: this._moduleName.build(ctx),
      name: this._name.map(c => c.build(ctx)),
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as ImportFromStatement;
  }

  override get nodeKind(): 'import_from_statement' { return 'import_from_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'from', type: 'from' });
    if (this._moduleName) parts.push({ kind: 'builder', builder: this._moduleName, fieldName: 'moduleName' });
    parts.push({ kind: 'token', text: 'import', type: 'import' });
    if (this._name.length > 0) {
      parts.push({ kind: 'token', text: ',', type: ',' });
      for (const child of this._name) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'name' });
      }
    }
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ImportFromStatementBuilder };

export function import_from_statement(moduleName: Builder<RelativeImport | DottedName>): ImportFromStatementBuilder {
  return new ImportFromStatementBuilder(moduleName);
}

export interface ImportFromStatementOptions {
  nodeKind: 'import_from_statement';
  moduleName: Builder<RelativeImport | DottedName> | RelativeImportOptions | DottedNameOptions;
  name?: Builder<DottedName | AliasedImport> | DottedNameOptions | AliasedImportOptions | (Builder<DottedName | AliasedImport> | DottedNameOptions | AliasedImportOptions)[];
  children?: Builder<WildcardImport> | string | (Builder<WildcardImport> | string)[];
}

export namespace import_from_statement {
  export function from(options: Omit<ImportFromStatementOptions, 'nodeKind'>): ImportFromStatementBuilder {
    const _raw = options.moduleName;
    let _ctor: Builder<RelativeImport | DottedName>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'relative_import': _ctor = relative_import.from(_raw); break;
        case 'dotted_name': _ctor = dotted_name.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new ImportFromStatementBuilder(_ctor);
    if (options.name !== undefined) {
      const _v = options.name;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.name(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'dotted_name': return dotted_name.from(_v);   case 'aliased_import': return aliased_import.from(_v); } throw new Error('unreachable'); }));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('wildcard_import', _x) : _x));
    }
    return b;
  }
}
