import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MethodDefinition, Object, Pair, ShorthandPropertyIdentifier, SpreadElement } from '../types.js';
import { pair } from './pair.js';
import type { PairOptions } from './pair.js';
import { spread_element } from './spread-element.js';
import type { SpreadElementOptions } from './spread-element.js';
import { method_definition } from './method-definition.js';
import type { MethodDefinitionOptions } from './method-definition.js';


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
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Object {
    return {
      kind: 'object',
      children: this._children.map(c => c.build(ctx)),
    } as Object;
  }

  override get nodeKind(): 'object' { return 'object'; }

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
  nodeKind: 'object';
  children?: Builder<Pair | SpreadElement | MethodDefinition | ShorthandPropertyIdentifier> | PairOptions | SpreadElementOptions | MethodDefinitionOptions | (Builder<Pair | SpreadElement | MethodDefinition | ShorthandPropertyIdentifier> | PairOptions | SpreadElementOptions | MethodDefinitionOptions)[];
}

export namespace object {
  export function from(input: Omit<ObjectOptions, 'nodeKind'> | Builder<Pair | SpreadElement | MethodDefinition | ShorthandPropertyIdentifier> | PairOptions | SpreadElementOptions | MethodDefinitionOptions | (Builder<Pair | SpreadElement | MethodDefinition | ShorthandPropertyIdentifier> | PairOptions | SpreadElementOptions | MethodDefinitionOptions)[]): ObjectBuilder {
    const options: Omit<ObjectOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ObjectOptions, 'nodeKind'>
      : { children: input } as Omit<ObjectOptions, 'nodeKind'>;
    const b = new ObjectBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'pair': return pair.from(_v);   case 'spread_element': return spread_element.from(_v);   case 'method_definition': return method_definition.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
