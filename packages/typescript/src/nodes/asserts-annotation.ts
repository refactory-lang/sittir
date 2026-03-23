import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Asserts, AssertsAnnotation } from '../types.js';
import { asserts } from './asserts.js';
import type { AssertsOptions } from './asserts.js';


class AssertsAnnotationBuilder extends Builder<AssertsAnnotation> {
  private _children: Builder<Asserts>[] = [];

  constructor(children: Builder<Asserts>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push(':');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AssertsAnnotation {
    return {
      kind: 'asserts_annotation',
      children: this._children[0]?.build(ctx),
    } as AssertsAnnotation;
  }

  override get nodeKind(): string { return 'asserts_annotation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: ':', type: ':' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { AssertsAnnotationBuilder };

export function asserts_annotation(children: Builder<Asserts>): AssertsAnnotationBuilder {
  return new AssertsAnnotationBuilder(children);
}

export interface AssertsAnnotationOptions {
  children: Builder<Asserts> | AssertsOptions | (Builder<Asserts> | AssertsOptions)[];
}

export namespace asserts_annotation {
  export function from(options: AssertsAnnotationOptions): AssertsAnnotationBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AssertsAnnotationBuilder(_ctor instanceof Builder ? _ctor : asserts.from(_ctor as AssertsOptions));
    return b;
  }
}
