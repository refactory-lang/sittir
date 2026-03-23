import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, ImportRequireClause } from '../types.js';


class ImportRequireClauseBuilder extends Builder<ImportRequireClause> {
  private _source: Builder;
  private _children: Builder<Identifier>[] = [];

  constructor(source: Builder) {
    super();
    this._source = source;
  }

  children(...value: Builder<Identifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('=');
    parts.push('require');
    parts.push('(');
    if (this._source) parts.push(this.renderChild(this._source, ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportRequireClause {
    return {
      kind: 'import_require_clause',
      source: this._source.build(ctx),
      children: this._children[0]?.build(ctx),
    } as ImportRequireClause;
  }

  override get nodeKind(): string { return 'import_require_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '=', type: '=' });
    parts.push({ kind: 'token', text: 'require', type: 'require' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { ImportRequireClauseBuilder };

export function import_require_clause(source: Builder): ImportRequireClauseBuilder {
  return new ImportRequireClauseBuilder(source);
}

export interface ImportRequireClauseOptions {
  source: Builder;
  children?: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace import_require_clause {
  export function from(options: ImportRequireClauseOptions): ImportRequireClauseBuilder {
    const b = new ImportRequireClauseBuilder(options.source);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('identifier', _x) : _x));
    }
    return b;
  }
}
