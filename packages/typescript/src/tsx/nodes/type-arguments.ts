import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeArguments } from '../types.js';


class TypeArgumentsBuilder extends Builder<TypeArguments> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('<');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeArguments {
    return {
      kind: 'type_arguments',
      children: this._children.map(c => c.build(ctx)),
    } as TypeArguments;
  }

  override get nodeKind(): string { return 'type_arguments'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '<', type: '<' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { TypeArgumentsBuilder };

export function type_arguments(...children: Builder[]): TypeArgumentsBuilder {
  return new TypeArgumentsBuilder(...children);
}

export interface TypeArgumentsOptions {
  children: Builder | (Builder)[];
}

export namespace type_arguments {
  export function from(options: TypeArgumentsOptions): TypeArgumentsBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new TypeArgumentsBuilder(..._arr);
    return b;
  }
}
