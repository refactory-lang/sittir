import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportAlias } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ImportAliasBuilder extends BaseBuilder<ImportAlias> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportAlias {
    return {
      kind: 'import_alias',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ImportAlias;
  }

  override get nodeKind(): string { return 'import_alias'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function import_alias(children: Child[]): ImportAliasBuilder {
  return new ImportAliasBuilder(children);
}
