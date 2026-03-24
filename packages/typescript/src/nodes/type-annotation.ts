import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Type, TypeAnnotation } from '../types.js';


class TypeAnnotationBuilder extends Builder<TypeAnnotation> {
  private _children: Builder<Type>[] = [];

  constructor(children: Builder<Type>) {
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
      children: this._children[0]!.build(ctx),
    } as TypeAnnotation;
  }

  override get nodeKind(): 'type_annotation' { return 'type_annotation'; }

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

export function type_annotation(children: Builder<Type>): TypeAnnotationBuilder {
  return new TypeAnnotationBuilder(children);
}

export interface TypeAnnotationOptions {
  nodeKind: 'type_annotation';
  children: Builder<Type> | (Builder<Type>)[];
}

export namespace type_annotation {
  export function from(input: Omit<TypeAnnotationOptions, 'nodeKind'> | Builder<Type> | (Builder<Type>)[]): TypeAnnotationBuilder {
    const options: Omit<TypeAnnotationOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TypeAnnotationOptions, 'nodeKind'>
      : { children: input } as Omit<TypeAnnotationOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TypeAnnotationBuilder(_ctor);
    return b;
  }
}
