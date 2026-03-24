import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DottedName, ImportPrefix, RelativeImport } from '../types.js';
import { dotted_name } from './dotted-name.js';
import type { DottedNameOptions } from './dotted-name.js';


class RelativeImportBuilder extends Builder<RelativeImport> {
  private _children: Builder<ImportPrefix | DottedName>[] = [];

  constructor(...children: Builder<ImportPrefix | DottedName>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RelativeImport {
    return {
      kind: 'relative_import',
      children: this._children.map(c => c.build(ctx)),
    } as RelativeImport;
  }

  override get nodeKind(): 'relative_import' { return 'relative_import'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { RelativeImportBuilder };

export function relative_import(...children: Builder<ImportPrefix | DottedName>[]): RelativeImportBuilder {
  return new RelativeImportBuilder(...children);
}

export interface RelativeImportOptions {
  nodeKind: 'relative_import';
  children?: Builder<ImportPrefix | DottedName> | string | Omit<DottedNameOptions, 'nodeKind'> | (Builder<ImportPrefix | DottedName> | string | Omit<DottedNameOptions, 'nodeKind'>)[];
}

export namespace relative_import {
  export function from(input: Omit<RelativeImportOptions, 'nodeKind'> | Builder<ImportPrefix | DottedName> | string | Omit<DottedNameOptions, 'nodeKind'> | (Builder<ImportPrefix | DottedName> | string | Omit<DottedNameOptions, 'nodeKind'>)[]): RelativeImportBuilder {
    const options: Omit<RelativeImportOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<RelativeImportOptions, 'nodeKind'>
      : { children: input } as Omit<RelativeImportOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new RelativeImportBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('import_prefix', _v) : _v instanceof Builder ? _v : dotted_name.from(_v)));
    return b;
  }
}
