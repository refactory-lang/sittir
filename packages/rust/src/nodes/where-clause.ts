import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { WhereClause, WherePredicate } from '../types.js';
import { where_predicate } from './where-predicate.js';
import type { WherePredicateOptions } from './where-predicate.js';


class WhereClauseBuilder extends Builder<WhereClause> {
  private _children: Builder<WherePredicate>[] = [];

  constructor() { super(); }

  children(...value: Builder<WherePredicate>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('where');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WhereClause {
    return {
      kind: 'where_clause',
      children: this._children.map(c => c.build(ctx)),
    } as WhereClause;
  }

  override get nodeKind(): 'where_clause' { return 'where_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'where', type: 'where' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { WhereClauseBuilder };

export function where_clause(): WhereClauseBuilder {
  return new WhereClauseBuilder();
}

export interface WhereClauseOptions {
  nodeKind: 'where_clause';
  children?: Builder<WherePredicate> | Omit<WherePredicateOptions, 'nodeKind'> | (Builder<WherePredicate> | Omit<WherePredicateOptions, 'nodeKind'>)[];
}

export namespace where_clause {
  export function from(input: Omit<WhereClauseOptions, 'nodeKind'> | Builder<WherePredicate> | Omit<WherePredicateOptions, 'nodeKind'> | (Builder<WherePredicate> | Omit<WherePredicateOptions, 'nodeKind'>)[]): WhereClauseBuilder {
    const options: Omit<WhereClauseOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<WhereClauseOptions, 'nodeKind'>
      : { children: input } as Omit<WhereClauseOptions, 'nodeKind'>;
    const b = new WhereClauseBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : where_predicate.from(_x)));
    }
    return b;
  }
}
