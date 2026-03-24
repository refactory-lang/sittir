import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Declaration, Decorator, ExportClause, ExportStatement, Expression, Identifier, NamespaceExport, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';
import { namespace_export } from './namespace-export.js';
import type { NamespaceExportOptions } from './namespace-export.js';
import { export_clause } from './export-clause.js';
import type { ExportClauseOptions } from './export-clause.js';


class ExportStatementBuilder extends Builder<ExportStatement> {
  private _source?: Builder<String>;
  private _decorator: Builder<Decorator>[] = [];
  private _declaration?: Builder<Declaration>;
  private _value?: Builder<Expression>;
  private _children: Builder<NamespaceExport | ExportClause | Expression | Identifier>[] = [];

  constructor() { super(); }

  source(value: Builder<String>): this {
    this._source = value;
    return this;
  }

  decorator(...value: Builder<Decorator>[]): this {
    this._decorator = value;
    return this;
  }

  declaration(value: Builder<Declaration>): this {
    this._declaration = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<NamespaceExport | ExportClause | Expression | Identifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    parts.push('export');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._declaration) parts.push(this.renderChild(this._declaration, ctx));
    if (this._source) {
      parts.push('from');
      if (this._source) parts.push(this.renderChild(this._source, ctx));
    }
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExportStatement {
    return {
      kind: 'export_statement',
      source: this._source ? this._source.build(ctx) : undefined,
      decorator: this._decorator.map(c => c.build(ctx)),
      declaration: this._declaration ? this._declaration.build(ctx) : undefined,
      value: this._value ? this._value.build(ctx) : undefined,
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as ExportStatement;
  }

  override get nodeKind(): 'export_statement' { return 'export_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    parts.push({ kind: 'token', text: 'export', type: 'export' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._declaration) parts.push({ kind: 'builder', builder: this._declaration, fieldName: 'declaration' });
    if (this._source) {
      parts.push({ kind: 'token', text: 'from', type: 'from' });
      if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    }
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { ExportStatementBuilder };

export function export_statement(): ExportStatementBuilder {
  return new ExportStatementBuilder();
}

export interface ExportStatementOptions {
  nodeKind: 'export_statement';
  source?: Builder<String> | Omit<StringOptions, 'nodeKind'>;
  decorator?: Builder<Decorator> | Omit<DecoratorOptions, 'nodeKind'> | (Builder<Decorator> | Omit<DecoratorOptions, 'nodeKind'>)[];
  declaration?: Builder<Declaration>;
  value?: Builder<Expression>;
  children?: Builder<NamespaceExport | ExportClause | Expression | Identifier> | NamespaceExportOptions | ExportClauseOptions | (Builder<NamespaceExport | ExportClause | Expression | Identifier> | NamespaceExportOptions | ExportClauseOptions)[];
}

export namespace export_statement {
  export function from(options: Omit<ExportStatementOptions, 'nodeKind'>): ExportStatementBuilder {
    const b = new ExportStatementBuilder();
    if (options.source !== undefined) {
      const _v = options.source;
      b.source(_v instanceof Builder ? _v : string.from(_v));
    }
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v)));
    }
    if (options.declaration !== undefined) b.declaration(options.declaration);
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'namespace_export': return namespace_export.from(_v);   case 'export_clause': return export_clause.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
