import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UseAsClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class UseAsClauseBuilder extends BaseBuilder<UseAsClause> {
  private _alias: Child;
  private _path!: Child;

  constructor(alias: Child) {
    super();
    this._alias = alias;
  }

  path(value: Child): this {
    this._path = value;
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
      alias: this.renderChild(this._alias, ctx),
      path: this._path ? this.renderChild(this._path, ctx) : undefined,
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

export function use_as_clause(alias: Child): UseAsClauseBuilder {
  return new UseAsClauseBuilder(alias);
}
