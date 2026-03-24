import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, Self, Super, UseAsClause } from '../types.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';


class UseAsClauseBuilder extends Builder<UseAsClause> {
  private _path: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>;
  private _alias!: Builder<Identifier>;

  constructor(path: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>) {
    super();
    this._path = path;
  }

  alias(value: Builder<Identifier>): this {
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
      path: this._path.build(ctx),
      alias: this._alias ? this._alias.build(ctx) : undefined,
    } as UseAsClause;
  }

  override get nodeKind(): 'use_as_clause' { return 'use_as_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._path) parts.push({ kind: 'builder', builder: this._path, fieldName: 'path' });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    return parts;
  }
}

export type { UseAsClauseBuilder };

export function use_as_clause(path: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>): UseAsClauseBuilder {
  return new UseAsClauseBuilder(path);
}

export interface UseAsClauseOptions {
  nodeKind: 'use_as_clause';
  path: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier> | Omit<ScopedIdentifierOptions, 'nodeKind'>;
  alias: Builder<Identifier> | string;
}

export namespace use_as_clause {
  export function from(options: Omit<UseAsClauseOptions, 'nodeKind'>): UseAsClauseBuilder {
    const _ctor = options.path;
    const b = new UseAsClauseBuilder(_ctor instanceof Builder ? _ctor : scoped_identifier.from(_ctor));
    if (options.alias !== undefined) {
      const _v = options.alias;
      b.alias(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    return b;
  }
}
