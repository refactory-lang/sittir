import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FormalParameters, OptionalParameter, RequiredParameter } from '../types.js';


class FormalParametersBuilder extends Builder<FormalParameters> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FormalParameters {
    return {
      kind: 'formal_parameters',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FormalParameters;
  }

  override get nodeKind(): string { return 'formal_parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { FormalParametersBuilder };

export function formal_parameters(): FormalParametersBuilder {
  return new FormalParametersBuilder();
}

export interface FormalParametersOptions {
  children?: Builder<OptionalParameter | RequiredParameter> | (Builder<OptionalParameter | RequiredParameter>)[];
}

export namespace formal_parameters {
  export function from(options: FormalParametersOptions): FormalParametersBuilder {
    const b = new FormalParametersBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
