import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeAnnotation } from '../types.js';


class TypeAnnotationBuilder extends Builder<TypeAnnotation> {
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

  build(ctx?: RenderContext): TypeAnnotation {
    return {
      kind: 'type_annotation',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TypeAnnotation;
  }

  override get nodeKind(): string { return 'type_annotation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: ':', type: ':' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { TypeAnnotationBuilder };

export function type_annotation(children: Builder): TypeAnnotationBuilder {
  return new TypeAnnotationBuilder(children);
}

export interface TypeAnnotationOptions {
  children: Builder | (Builder)[];
}

export namespace type_annotation {
  export function from(options: TypeAnnotationOptions): TypeAnnotationBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TypeAnnotationBuilder(_ctor);
    return b;
  }
}
