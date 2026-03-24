import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OptionalType, Type } from '../types.js';


class OptionalTypeBuilder extends Builder<OptionalType> {
  private _children: Builder<Type>[] = [];

  constructor(children: Builder<Type>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('?');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OptionalType {
    return {
      kind: 'optional_type',
      children: this._children[0]!.build(ctx),
    } as OptionalType;
  }

  override get nodeKind(): 'optional_type' { return 'optional_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '?', type: '?' });
    return parts;
  }
}

export type { OptionalTypeBuilder };

export function optional_type(children: Builder<Type>): OptionalTypeBuilder {
  return new OptionalTypeBuilder(children);
}

export interface OptionalTypeOptions {
  nodeKind: 'optional_type';
  children: Builder<Type> | (Builder<Type>)[];
}

export namespace optional_type {
  export function from(input: Omit<OptionalTypeOptions, 'nodeKind'> | Builder<Type> | (Builder<Type>)[]): OptionalTypeBuilder {
    const options: Omit<OptionalTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<OptionalTypeOptions, 'nodeKind'>
      : { children: input } as Omit<OptionalTypeOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new OptionalTypeBuilder(_ctor);
    return b;
  }
}
