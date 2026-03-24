import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OmittingTypeAnnotation, Type } from '../types.js';


class OmittingTypeAnnotationBuilder extends Builder<OmittingTypeAnnotation> {
  private _children: Builder<Type>[] = [];

  constructor(children: Builder<Type>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('-?:');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OmittingTypeAnnotation {
    return {
      kind: 'omitting_type_annotation',
      children: this._children[0]!.build(ctx),
    } as OmittingTypeAnnotation;
  }

  override get nodeKind(): 'omitting_type_annotation' { return 'omitting_type_annotation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '-?:', type: '-?:' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { OmittingTypeAnnotationBuilder };

export function omitting_type_annotation(children: Builder<Type>): OmittingTypeAnnotationBuilder {
  return new OmittingTypeAnnotationBuilder(children);
}

export interface OmittingTypeAnnotationOptions {
  nodeKind: 'omitting_type_annotation';
  children: Builder<Type> | (Builder<Type>)[];
}

export namespace omitting_type_annotation {
  export function from(input: Omit<OmittingTypeAnnotationOptions, 'nodeKind'> | Builder<Type> | (Builder<Type>)[]): OmittingTypeAnnotationBuilder {
    const options: Omit<OmittingTypeAnnotationOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<OmittingTypeAnnotationOptions, 'nodeKind'>
      : { children: input } as Omit<OmittingTypeAnnotationOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new OmittingTypeAnnotationBuilder(_ctor);
    return b;
  }
}
