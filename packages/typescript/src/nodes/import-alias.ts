import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, ImportAlias, NestedIdentifier } from '../types.js';
import { nested_identifier } from './nested-identifier.js';
import type { NestedIdentifierOptions } from './nested-identifier.js';


class ImportAliasBuilder extends Builder<ImportAlias> {
  private _children: Builder<Identifier | NestedIdentifier>[] = [];

  constructor(...children: Builder<Identifier | NestedIdentifier>[]) {
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
      children: this._children.map(c => c.build(ctx)),
    } as ImportAlias;
  }

  override get nodeKind(): 'import_alias' { return 'import_alias'; }

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

export function import_alias(...children: Builder<Identifier | NestedIdentifier>[]): ImportAliasBuilder {
  return new ImportAliasBuilder(...children);
}

export interface ImportAliasOptions {
  nodeKind: 'import_alias';
  children?: Builder<Identifier | NestedIdentifier> | string | Omit<NestedIdentifierOptions, 'nodeKind'> | (Builder<Identifier | NestedIdentifier> | string | Omit<NestedIdentifierOptions, 'nodeKind'>)[];
}

export namespace import_alias {
  export function from(input: Omit<ImportAliasOptions, 'nodeKind'> | Builder<Identifier | NestedIdentifier> | string | Omit<NestedIdentifierOptions, 'nodeKind'> | (Builder<Identifier | NestedIdentifier> | string | Omit<NestedIdentifierOptions, 'nodeKind'>)[]): ImportAliasBuilder {
    const options: Omit<ImportAliasOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ImportAliasOptions, 'nodeKind'>
      : { children: input } as Omit<ImportAliasOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ImportAliasBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v instanceof Builder ? _v : nested_identifier.from(_v)));
    return b;
  }
}
