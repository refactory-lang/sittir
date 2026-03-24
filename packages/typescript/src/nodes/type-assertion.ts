import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, TypeArguments, TypeAssertion } from '../types.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';


class TypeAssertionBuilder extends Builder<TypeAssertion> {
  private _children: Builder<TypeArguments | Expression>[] = [];

  constructor(...children: Builder<TypeArguments | Expression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeAssertion {
    return {
      kind: 'type_assertion',
      children: this._children.map(c => c.build(ctx)),
    } as TypeAssertion;
  }

  override get nodeKind(): 'type_assertion' { return 'type_assertion'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { TypeAssertionBuilder };

export function type_assertion(...children: Builder<TypeArguments | Expression>[]): TypeAssertionBuilder {
  return new TypeAssertionBuilder(...children);
}

export interface TypeAssertionOptions {
  nodeKind: 'type_assertion';
  children?: Builder<TypeArguments | Expression> | Omit<TypeArgumentsOptions, 'nodeKind'> | (Builder<TypeArguments | Expression> | Omit<TypeArgumentsOptions, 'nodeKind'>)[];
}

export namespace type_assertion {
  export function from(input: Omit<TypeAssertionOptions, 'nodeKind'> | Builder<TypeArguments | Expression> | Omit<TypeArgumentsOptions, 'nodeKind'> | (Builder<TypeArguments | Expression> | Omit<TypeArgumentsOptions, 'nodeKind'>)[]): TypeAssertionBuilder {
    const options: Omit<TypeAssertionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TypeAssertionOptions, 'nodeKind'>
      : { children: input } as Omit<TypeAssertionOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new TypeAssertionBuilder(..._arr.map(_v => _v instanceof Builder ? _v : type_arguments.from(_v)));
    return b;
  }
}
