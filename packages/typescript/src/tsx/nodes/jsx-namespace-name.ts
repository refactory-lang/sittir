import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, JsxNamespaceName } from '../types.js';


class JsxNamespaceNameBuilder extends Builder<JsxNamespaceName> {
  private _children: Builder<Identifier>[] = [];

  constructor(...children: Builder<Identifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(':');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): JsxNamespaceName {
    return {
      kind: 'jsx_namespace_name',
      children: this._children.map(c => c.build(ctx)),
    } as JsxNamespaceName;
  }

  override get nodeKind(): string { return 'jsx_namespace_name'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ':', type: ':' });
    return parts;
  }
}

export type { JsxNamespaceNameBuilder };

export function jsx_namespace_name(...children: Builder<Identifier>[]): JsxNamespaceNameBuilder {
  return new JsxNamespaceNameBuilder(...children);
}

export interface JsxNamespaceNameOptions {
  children: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace jsx_namespace_name {
  export function from(options: JsxNamespaceNameOptions): JsxNamespaceNameBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new JsxNamespaceNameBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v));
    return b;
  }
}
