import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AddingTypeAnnotation, Type } from '../types.js';


class AddingTypeAnnotationBuilder extends Builder<AddingTypeAnnotation> {
  private _children: Builder<Type>[] = [];

  constructor(children: Builder<Type>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('+?:');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AddingTypeAnnotation {
    return {
      kind: 'adding_type_annotation',
      children: this._children[0]!.build(ctx),
    } as AddingTypeAnnotation;
  }

  override get nodeKind(): 'adding_type_annotation' { return 'adding_type_annotation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '+?:', type: '+?:' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { AddingTypeAnnotationBuilder };

export function adding_type_annotation(children: Builder<Type>): AddingTypeAnnotationBuilder {
  return new AddingTypeAnnotationBuilder(children);
}

export interface AddingTypeAnnotationOptions {
  nodeKind: 'adding_type_annotation';
  children: Builder<Type> | (Builder<Type>)[];
}

export namespace adding_type_annotation {
  export function from(input: Omit<AddingTypeAnnotationOptions, 'nodeKind'> | Builder<Type> | (Builder<Type>)[]): AddingTypeAnnotationBuilder {
    const options: Omit<AddingTypeAnnotationOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<AddingTypeAnnotationOptions, 'nodeKind'>
      : { children: input } as Omit<AddingTypeAnnotationOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AddingTypeAnnotationBuilder(_ctor);
    return b;
  }
}
