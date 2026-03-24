import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, ScopedUseList, Self, Super, UseList } from '../types.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';
import { use_list } from './use-list.js';
import type { UseListOptions } from './use-list.js';


class ScopedUseListBuilder extends Builder<ScopedUseList> {
  private _path?: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>;
  private _list: Builder<UseList>;

  constructor(list: Builder<UseList>) {
    super();
    this._list = list;
  }

  path(value: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>): this {
    this._path = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._path) parts.push(this.renderChild(this._path, ctx));
    parts.push('::');
    if (this._list) parts.push(this.renderChild(this._list, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ScopedUseList {
    return {
      kind: 'scoped_use_list',
      path: this._path ? this._path.build(ctx) : undefined,
      list: this._list.build(ctx),
    } as ScopedUseList;
  }

  override get nodeKind(): 'scoped_use_list' { return 'scoped_use_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._path) parts.push({ kind: 'builder', builder: this._path, fieldName: 'path' });
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._list) parts.push({ kind: 'builder', builder: this._list, fieldName: 'list' });
    return parts;
  }
}

export type { ScopedUseListBuilder };

export function scoped_use_list(list: Builder<UseList>): ScopedUseListBuilder {
  return new ScopedUseListBuilder(list);
}

export interface ScopedUseListOptions {
  nodeKind: 'scoped_use_list';
  path?: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier> | Omit<ScopedIdentifierOptions, 'nodeKind'>;
  list: Builder<UseList> | Omit<UseListOptions, 'nodeKind'>;
}

export namespace scoped_use_list {
  export function from(options: Omit<ScopedUseListOptions, 'nodeKind'>): ScopedUseListBuilder {
    const _ctor = options.list;
    const b = new ScopedUseListBuilder(_ctor instanceof Builder ? _ctor : use_list.from(_ctor));
    if (options.path !== undefined) {
      const _v = options.path;
      b.path(_v instanceof Builder ? _v : scoped_identifier.from(_v));
    }
    return b;
  }
}
