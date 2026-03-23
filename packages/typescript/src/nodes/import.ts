import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportAttribute, ImportClause, ImportRequireClause, ImportStatement } from '../types.js';


class ImportBuilder extends Builder<ImportStatement> {
  private _source?: Builder;
  private _children: Builder[] = [];

  constructor() { super(); }

  source(value: Builder): this {
    this._source = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('import');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('from');
    if (this._source) parts.push(this.renderChild(this._source, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportStatement {
    return {
      kind: 'import_statement',
      source: this._source ? this.renderChild(this._source, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ImportStatement;
  }

  override get nodeKind(): string { return 'import_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'import', type: 'import' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'from', type: 'from' });
    if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ImportBuilder };

export function import_(): ImportBuilder {
  return new ImportBuilder();
}

export interface ImportStatementOptions {
  source?: Builder;
  children?: Builder<ImportAttribute | ImportClause | ImportRequireClause> | (Builder<ImportAttribute | ImportClause | ImportRequireClause>)[];
}

export namespace import_ {
  export function from(options: ImportStatementOptions): ImportBuilder {
    const b = new ImportBuilder();
    if (options.source !== undefined) b.source(options.source);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
