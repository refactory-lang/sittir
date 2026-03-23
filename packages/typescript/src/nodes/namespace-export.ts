import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, NamespaceExport, String } from '../types.js';


class NamespaceExportBuilder extends Builder<NamespaceExport> {
  private _children: Builder<Identifier | String>[] = [];

  constructor(...children: Builder<Identifier | String>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('*');
    parts.push('as');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NamespaceExport {
    return {
      kind: 'namespace_export',
      children: this._children.map(c => c.build(ctx)),
    } as NamespaceExport;
  }

  override get nodeKind(): string { return 'namespace_export'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '*', type: '*' });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { NamespaceExportBuilder };

export function namespace_export(...children: Builder<Identifier | String>[]): NamespaceExportBuilder {
  return new NamespaceExportBuilder(...children);
}

export interface NamespaceExportOptions {
  children?: Builder<Identifier | String> | string | (Builder<Identifier | String> | string)[];
}

export namespace namespace_export {
  export function from(options: NamespaceExportOptions): NamespaceExportBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new NamespaceExportBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v));
    return b;
  }
}
