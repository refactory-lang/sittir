import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, ScopedUseList, Self, Super, UseList } from '../types.js';


class ScopedUseListBuilder extends Builder<ScopedUseList> {
  private _list: Builder<UseList>;
  private _path?: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>;

  constructor(list: Builder<UseList>) {
    super();
    this._list = list;
  }

  path(value: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>): this {
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
      list: this._list.build(ctx),
      path: this._path?.build(ctx),
    } as ScopedUseList;
  }

  override get nodeKind(): string { return 'scoped_use_list'; }

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
  list: Builder<UseList>;
  path?: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>;
}

export namespace scoped_use_list {
  export function from(options: ScopedUseListOptions): ScopedUseListBuilder {
    const b = new ScopedUseListBuilder(options.list);
    if (options.path !== undefined) b.path(options.path);
    return b;
  }
}
