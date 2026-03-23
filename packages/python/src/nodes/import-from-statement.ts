import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AliasedImport, DottedName, ImportFromStatement, RelativeImport, WildcardImport } from '../types.js';


class ImportFromStatementBuilder extends Builder<ImportFromStatement> {
  private _moduleName: Builder<DottedName | RelativeImport>;
  private _name: Builder<AliasedImport | DottedName>[] = [];
  private _children: Builder<WildcardImport>[] = [];

  constructor(moduleName: Builder<DottedName | RelativeImport>) {
    super();
    this._moduleName = moduleName;
  }

  name(...value: Builder<AliasedImport | DottedName>[]): this {
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
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._name.length > 0) parts.push(this.renderChildren(this._name, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportFromStatement {
    return {
      kind: 'import_from_statement',
      moduleName: this._moduleName.build(ctx),
      name: this._name.map(c => c.build(ctx)),
      children: this._children[0]?.build(ctx),
    } as ImportFromStatement;
  }

  override get nodeKind(): string { return 'import_from_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'from', type: 'from' });
    if (this._moduleName) parts.push({ kind: 'builder', builder: this._moduleName, fieldName: 'moduleName' });
    parts.push({ kind: 'token', text: 'import', type: 'import' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    for (const child of this._name) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'name' });
    }
    return parts;
  }
}

export type { ImportFromStatementBuilder };

export function import_from_statement(moduleName: Builder<DottedName | RelativeImport>): ImportFromStatementBuilder {
  return new ImportFromStatementBuilder(moduleName);
}

export interface ImportFromStatementOptions {
  moduleName: Builder<DottedName | RelativeImport>;
  name?: Builder<AliasedImport | DottedName> | (Builder<AliasedImport | DottedName>)[];
  children?: Builder<WildcardImport> | string | (Builder<WildcardImport> | string)[];
}

export namespace import_from_statement {
  export function from(options: ImportFromStatementOptions): ImportFromStatementBuilder {
    const b = new ImportFromStatementBuilder(options.moduleName);
    if (options.name !== undefined) {
      const _v = options.name;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.name(..._arr);
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('wildcard_import', _x) : _x));
    }
    return b;
  }
}
