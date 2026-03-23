import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MethodDefinition, Object, Pair, ShorthandPropertyIdentifier, SpreadElement } from '../types.js';


class ObjectBuilder extends Builder<Object> {
  private _children: Builder<Pair | SpreadElement | MethodDefinition | ShorthandPropertyIdentifier>[] = [];

  constructor() { super(); }

  children(...value: Builder<Pair | SpreadElement | MethodDefinition | ShorthandPropertyIdentifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Object {
    return {
      kind: 'object',
      children: this._children.map(c => c.build(ctx)),
    } as Object;
  }

  override get nodeKind(): string { return 'object'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { ObjectBuilder };

export function object(): ObjectBuilder {
  return new ObjectBuilder();
}

export interface ObjectOptions {
  children?: Builder<Pair | SpreadElement | MethodDefinition | ShorthandPropertyIdentifier> | (Builder<Pair | SpreadElement | MethodDefinition | ShorthandPropertyIdentifier>)[];
}

export namespace object {
  export function from(options: ObjectOptions): ObjectBuilder {
    const b = new ObjectBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
