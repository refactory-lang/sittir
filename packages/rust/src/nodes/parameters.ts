import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, Parameter, Parameters, SelfParameter, Type, VariadicParameter } from '../types.js';


class ParametersBuilder extends Builder<Parameters> {
  private _children: Builder<Type | AttributeItem | Parameter | SelfParameter | VariadicParameter>[] = [];

  constructor() { super(); }

  children(...value: Builder<Type | AttributeItem | Parameter | SelfParameter | VariadicParameter>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    if (this._children[3]) parts.push(this.renderChild(this._children[3]!, ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Parameters {
    return {
      kind: 'parameters',
      children: this._children.map(c => c.build(ctx)),
    } as Parameters;
  }

  override get nodeKind(): string { return 'parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    if (this._children[3]) parts.push({ kind: 'builder', builder: this._children[3]! });
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { ParametersBuilder };

export function parameters(): ParametersBuilder {
  return new ParametersBuilder();
}

export interface ParametersOptions {
  children?: Builder<Type | AttributeItem | Parameter | SelfParameter | VariadicParameter> | (Builder<Type | AttributeItem | Parameter | SelfParameter | VariadicParameter>)[];
}

export namespace parameters {
  export function from(options: ParametersOptions): ParametersBuilder {
    const b = new ParametersBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
