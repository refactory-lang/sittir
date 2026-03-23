import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Declaration, Decorator, ExportClause, ExportStatement, Expression, Identifier, NamespaceExport } from '../types.js';


class ExportStatementBuilder extends Builder<ExportStatement> {
  private _declaration?: Builder<Declaration>;
  private _decorator: Builder<Decorator>[] = [];
  private _source?: Builder;
  private _value?: Builder<Expression>;
  private _children: Builder<ExportClause | Expression | Identifier | NamespaceExport>[] = [];

  constructor() { super(); }

  declaration(value: Builder<Declaration>): this {
    this._declaration = value;
    return this;
  }

  decorator(...value: Builder<Decorator>[]): this {
    this._decorator = value;
    return this;
  }

  source(value: Builder): this {
    this._source = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<ExportClause | Expression | Identifier | NamespaceExport>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('export');
    parts.push('*');
    parts.push('from');
    if (this._source) parts.push(this.renderChild(this._source, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._declaration) parts.push(this.renderChild(this._declaration, ctx));
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExportStatement {
    return {
      kind: 'export_statement',
      declaration: this._declaration?.build(ctx),
      decorator: this._decorator.map(c => c.build(ctx)),
      source: this._source?.build(ctx),
      value: this._value?.build(ctx),
      children: this._children[0]?.build(ctx),
    } as ExportStatement;
  }

  override get nodeKind(): string { return 'export_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'export', type: 'export' });
    parts.push({ kind: 'token', text: '*', type: '*' });
    parts.push({ kind: 'token', text: 'from', type: 'from' });
    if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._declaration) parts.push({ kind: 'builder', builder: this._declaration, fieldName: 'declaration' });
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
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
  declaration?: Builder<Declaration>;
  decorator?: Builder<Decorator> | (Builder<Decorator>)[];
  source?: Builder;
  value?: Builder<Expression>;
  children?: Builder<ExportClause | Expression | Identifier | NamespaceExport> | (Builder<ExportClause | Expression | Identifier | NamespaceExport>)[];
}

export namespace export_statement {
  export function from(options: ExportStatementOptions): ExportStatementBuilder {
    const b = new ExportStatementBuilder();
    if (options.declaration !== undefined) b.declaration(options.declaration);
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr);
    }
    if (options.source !== undefined) b.source(options.source);
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
