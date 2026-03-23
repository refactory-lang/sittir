import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, TypeArguments, TypeAssertion } from '../types.js';


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

  override get nodeKind(): string { return 'type_assertion'; }

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
  children?: Builder<TypeArguments | Expression> | (Builder<TypeArguments | Expression>)[];
}

export namespace type_assertion {
  export function from(options: TypeAssertionOptions): TypeAssertionBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new TypeAssertionBuilder(..._arr);
    return b;
  }
}
