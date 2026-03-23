import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Asserts, Identifier, This, TypePredicate } from '../types.js';


class AssertsBuilder extends Builder<Asserts> {
  private _children: Builder<TypePredicate | Identifier | This>[] = [];

  constructor(...children: Builder<TypePredicate | Identifier | This>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('asserts');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Asserts {
    return {
      kind: 'asserts',
      children: this._children.map(c => c.build(ctx)),
    } as Asserts;
  }

  override get nodeKind(): string { return 'asserts'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'asserts', type: 'asserts' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { AssertsBuilder };

export function asserts(...children: Builder<TypePredicate | Identifier | This>[]): AssertsBuilder {
  return new AssertsBuilder(...children);
}

export interface AssertsOptions {
  children?: Builder<TypePredicate | Identifier | This> | (Builder<TypePredicate | Identifier | This>)[];
}

export namespace asserts {
  export function from(options: AssertsOptions): AssertsBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new AssertsBuilder(..._arr);
    return b;
  }
}
