import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RestType, Type } from '../types.js';


class RestTypeBuilder extends Builder<RestType> {
  private _children: Builder<Type>[] = [];

  constructor(children: Builder<Type>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('...');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RestType {
    return {
      kind: 'rest_type',
      children: this._children[0]!.build(ctx),
    } as RestType;
  }

  override get nodeKind(): 'rest_type' { return 'rest_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '...', type: '...' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { RestTypeBuilder };

export function rest_type(children: Builder<Type>): RestTypeBuilder {
  return new RestTypeBuilder(children);
}

export interface RestTypeOptions {
  nodeKind: 'rest_type';
  children: Builder<Type> | (Builder<Type>)[];
}

export namespace rest_type {
  export function from(input: Omit<RestTypeOptions, 'nodeKind'> | Builder<Type> | (Builder<Type>)[]): RestTypeBuilder {
    const options: Omit<RestTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<RestTypeOptions, 'nodeKind'>
      : { children: input } as Omit<RestTypeOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new RestTypeBuilder(_ctor);
    return b;
  }
}
