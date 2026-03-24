import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportAttribute, ImportClause, ImportRequireClause, ImportStatement, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { import_clause } from './import-clause.js';
import type { ImportClauseOptions } from './import-clause.js';
import { import_require_clause } from './import-require-clause.js';
import type { ImportRequireClauseOptions } from './import-require-clause.js';
import { import_attribute } from './import-attribute.js';
import type { ImportAttributeOptions } from './import-attribute.js';


class ImportStatementBuilder extends Builder<ImportStatement> {
  private _source?: Builder<String>;
  private _children: Builder<ImportClause | ImportRequireClause | ImportAttribute>[] = [];

  constructor() { super(); }

  source(value: Builder<String>): this {
    this._source = value;
    return this;
  }

  children(...value: Builder<ImportClause | ImportRequireClause | ImportAttribute>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('import');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._source) {
      parts.push('from');
      if (this._source) parts.push(this.renderChild(this._source, ctx));
    }
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportStatement {
    return {
      kind: 'import_statement',
      source: this._source ? this._source.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as ImportStatement;
  }

  override get nodeKind(): 'import_statement' { return 'import_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'import', type: 'import' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._source) {
      parts.push({ kind: 'token', text: 'from', type: 'from' });
      if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    }
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ImportStatementBuilder };

export function import_statement(): ImportStatementBuilder {
  return new ImportStatementBuilder();
}

export interface ImportStatementOptions {
  nodeKind: 'import_statement';
  source?: Builder<String> | Omit<StringOptions, 'nodeKind'>;
  children?: Builder<ImportClause | ImportRequireClause | ImportAttribute> | ImportClauseOptions | ImportRequireClauseOptions | ImportAttributeOptions | (Builder<ImportClause | ImportRequireClause | ImportAttribute> | ImportClauseOptions | ImportRequireClauseOptions | ImportAttributeOptions)[];
}

export namespace import_statement {
  export function from(options: Omit<ImportStatementOptions, 'nodeKind'>): ImportStatementBuilder {
    const b = new ImportStatementBuilder();
    if (options.source !== undefined) {
      const _v = options.source;
      b.source(_v instanceof Builder ? _v : string.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'import_clause': return import_clause.from(_v);   case 'import_require_clause': return import_require_clause.from(_v);   case 'import_attribute': return import_attribute.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
