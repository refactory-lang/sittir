import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, Self, Super, UseAsClause } from '../types.js';


class UseAsClauseBuilder extends Builder<UseAsClause> {
  private _alias!: Builder;
  private _path: Builder;

  constructor(path: Builder) {
    super();
    this._path = path;
  }

  alias(value: Builder): this {
    this._alias = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._path) parts.push(this.renderChild(this._path, ctx));
    parts.push('as');
    if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UseAsClause {
    return {
      kind: 'use_as_clause',
      alias: this._alias ? this.renderChild(this._alias, ctx) : undefined,
      path: this.renderChild(this._path, ctx),
    } as unknown as UseAsClause;
  }

  override get nodeKind(): string { return 'use_as_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._path) parts.push({ kind: 'builder', builder: this._path, fieldName: 'path' });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    return parts;
  }
}

export type { UseAsClauseBuilder };

export function use_as_clause(path: Builder): UseAsClauseBuilder {
  return new UseAsClauseBuilder(path);
}

export interface UseAsClauseOptions {
  alias: Builder<Identifier> | string;
  path: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>;
}

export namespace use_as_clause {
  export function from(options: UseAsClauseOptions): UseAsClauseBuilder {
    const b = new UseAsClauseBuilder(options.path);
    if (options.alias !== undefined) {
      const _v = options.alias;
      b.alias(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    return b;
  }
}
