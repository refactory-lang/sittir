import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, ScopedUseList, Self, Super, UseAsClause, UseList, UseWildcard } from '../types.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';
import { use_as_clause } from './use-as-clause.js';
import type { UseAsClauseOptions } from './use-as-clause.js';
import { scoped_use_list } from './scoped-use-list.js';
import type { ScopedUseListOptions } from './scoped-use-list.js';
import { use_wildcard } from './use-wildcard.js';
import type { UseWildcardOptions } from './use-wildcard.js';


class UseListBuilder extends Builder<UseList> {
  private _children: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard>[] = [];

  constructor() { super(); }

  children(...value: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UseList {
    return {
      kind: 'use_list',
      children: this._children.map(c => c.build(ctx)),
    } as UseList;
  }

  override get nodeKind(): 'use_list' { return 'use_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { UseListBuilder };

export function use_list(): UseListBuilder {
  return new UseListBuilder();
}

export interface UseListOptions {
  nodeKind: 'use_list';
  children?: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard> | ScopedIdentifierOptions | UseAsClauseOptions | ScopedUseListOptions | UseWildcardOptions | (Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard> | ScopedIdentifierOptions | UseAsClauseOptions | ScopedUseListOptions | UseWildcardOptions)[];
}

export namespace use_list {
  export function from(input: Omit<UseListOptions, 'nodeKind'> | Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard> | ScopedIdentifierOptions | UseAsClauseOptions | ScopedUseListOptions | UseWildcardOptions | (Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard> | ScopedIdentifierOptions | UseAsClauseOptions | ScopedUseListOptions | UseWildcardOptions)[]): UseListBuilder {
    const options: Omit<UseListOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<UseListOptions, 'nodeKind'>
      : { children: input } as Omit<UseListOptions, 'nodeKind'>;
    const b = new UseListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'scoped_identifier': return scoped_identifier.from(_v);   case 'use_as_clause': return use_as_clause.from(_v);   case 'scoped_use_list': return scoped_use_list.from(_v);   case 'use_wildcard': return use_wildcard.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
