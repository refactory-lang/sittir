import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, Lifetime, Literal, TraitBounds, Type, TypeArguments, TypeBinding } from '../types.js';


class TypeArgumentsBuilder extends Builder<TypeArguments> {
  private _children: Builder<Literal | Type | Block | Lifetime | TraitBounds | TypeBinding>[] = [];

  constructor(...children: Builder<Literal | Type | Block | Lifetime | TraitBounds | TypeBinding>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('<');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { TypeArgumentsBuilder };

export function type_arguments(...children: Builder<Literal | Type | Block | Lifetime | TraitBounds | TypeBinding>[]): TypeArgumentsBuilder {
  return new TypeArgumentsBuilder(...children);
}

export interface TypeArgumentsOptions {
  children: Builder<Literal | Type | Block | Lifetime | TraitBounds | TypeBinding> | (Builder<Literal | Type | Block | Lifetime | TraitBounds | TypeBinding>)[];
}

export namespace type_arguments {
  export function from(options: TypeArgumentsOptions): TypeArgumentsBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new TypeArgumentsBuilder(..._arr);
    return b;
  }
}
