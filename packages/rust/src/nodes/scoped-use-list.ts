import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ScopedUseList } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ScopedUseListBuilder extends BaseBuilder<ScopedUseList> {
  private _list: Child;
  private _path?: Child;

  constructor(list: Child) {
    super();
    this._list = list;
  }

  path(value: Child): this {
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
      list: this.renderChild(this._list, ctx),
      path: this._path ? this.renderChild(this._path, ctx) : undefined,
    } as unknown as ScopedUseList;
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

export function scoped_use_list(list: Child): ScopedUseListBuilder {
  return new ScopedUseListBuilder(list);
}
