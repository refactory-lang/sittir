import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportAttribute, ImportClause, ImportRequireClause, ImportStatement, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';


class ImportStatementBuilder extends Builder<ImportStatement> {
  private _source?: Builder<String>;
  private _children: Builder<ImportClause | ImportRequireClause | ImportAttribute>[] = [];

  constructor(...children: Builder<ImportClause | ImportRequireClause | ImportAttribute>[]) {
    super();
    this._children = children;
  }

  source(value: Builder<String>): this {
    this._source = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('import');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._source) parts.push(this.renderChild(this._source, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportStatement {
    return {
      kind: 'import_statement',
      source: this._source?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ImportStatement;
  }

  override get nodeKind(): string { return 'import_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'import', type: 'import' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ImportStatementBuilder };

export function import_statement(...children: Builder<ImportClause | ImportRequireClause | ImportAttribute>[]): ImportStatementBuilder {
  return new ImportStatementBuilder(...children);
}

export interface ImportStatementOptions {
  source?: Builder<String> | StringOptions;
  children?: Builder<ImportClause | ImportRequireClause | ImportAttribute> | (Builder<ImportClause | ImportRequireClause | ImportAttribute>)[];
}

export namespace import_statement {
  export function from(options: ImportStatementOptions): ImportStatementBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ImportStatementBuilder(..._arr);
    if (options.source !== undefined) {
      const _v = options.source;
      b.source(_v instanceof Builder ? _v : string.from(_v as StringOptions));
    }
    return b;
  }
}
