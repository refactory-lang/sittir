import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, ImportAlias, NestedIdentifier } from '../types.js';


class ImportAliasBuilder extends Builder<ImportAlias> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('import');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('=');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
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
    parts.push({ kind: 'token', text: 'import', type: 'import' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ImportAliasBuilder };

export function import_alias(...children: Builder[]): ImportAliasBuilder {
  return new ImportAliasBuilder(...children);
}

export interface ImportAliasOptions {
  children: Builder<Identifier | NestedIdentifier> | (Builder<Identifier | NestedIdentifier>)[];
}

export namespace import_alias {
  export function from(options: ImportAliasOptions): ImportAliasBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ImportAliasBuilder(..._arr);
    return b;
  }
}
