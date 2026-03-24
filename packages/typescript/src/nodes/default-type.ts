import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DefaultType, Type } from '../types.js';


class DefaultTypeBuilder extends Builder<DefaultType> {
  private _children: Builder<Type>[] = [];

  constructor(children: Builder<Type>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('=');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DefaultType {
    return {
      kind: 'default_type',
      children: this._children[0]!.build(ctx),
    } as DefaultType;
  }

  override get nodeKind(): 'default_type' { return 'default_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '=', type: '=' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { DefaultTypeBuilder };

export function default_type(children: Builder<Type>): DefaultTypeBuilder {
  return new DefaultTypeBuilder(children);
}

export interface DefaultTypeOptions {
  nodeKind: 'default_type';
  children: Builder<Type> | (Builder<Type>)[];
}

export namespace default_type {
  export function from(input: Omit<DefaultTypeOptions, 'nodeKind'> | Builder<Type> | (Builder<Type>)[]): DefaultTypeBuilder {
    const options: Omit<DefaultTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<DefaultTypeOptions, 'nodeKind'>
      : { children: input } as Omit<DefaultTypeOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new DefaultTypeBuilder(_ctor);
    return b;
  }
}
