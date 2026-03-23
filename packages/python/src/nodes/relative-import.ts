import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DottedName, ImportPrefix, RelativeImport } from '../types.js';


class RelativeImportBuilder extends Builder<RelativeImport> {
  private _children: Builder<DottedName | ImportPrefix>[] = [];

  constructor(...children: Builder<DottedName | ImportPrefix>[]) {
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

  override get nodeKind(): string { return 'relative_import'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { RelativeImportBuilder };

export function relative_import(...children: Builder<DottedName | ImportPrefix>[]): RelativeImportBuilder {
  return new RelativeImportBuilder(...children);
}

export interface RelativeImportOptions {
  children: Builder<DottedName | ImportPrefix> | (Builder<DottedName | ImportPrefix>)[];
}

export namespace relative_import {
  export function from(options: RelativeImportOptions): RelativeImportBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new RelativeImportBuilder(..._arr);
    return b;
  }
}
