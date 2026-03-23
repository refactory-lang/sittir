import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertsAnnotation } from '../types.js';


class AssertsAnnotationBuilder extends Builder<AssertsAnnotation> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
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
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AssertsAnnotation;
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

export function asserts_annotation(children: Builder): AssertsAnnotationBuilder {
  return new AssertsAnnotationBuilder(children);
}

export interface AssertsAnnotationOptions {
  children: Builder | (Builder)[];
}

export namespace asserts_annotation {
  export function from(options: AssertsAnnotationOptions): AssertsAnnotationBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AssertsAnnotationBuilder(_ctor);
    return b;
  }
}
