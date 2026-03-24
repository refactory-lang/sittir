import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Parameter, Parameters } from '../types.js';


class ParametersBuilder extends Builder<Parameters> {
  private _children: Builder<Parameter>[] = [];

  constructor() { super(); }

  children(...value: Builder<Parameter>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Parameters {
    return {
      kind: 'parameters',
      children: this._children.map(c => c.build(ctx)),
    } as Parameters;
  }

  override get nodeKind(): 'parameters' { return 'parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { ParametersBuilder };

export function parameters(): ParametersBuilder {
  return new ParametersBuilder();
}

export interface ParametersOptions {
  nodeKind: 'parameters';
  children?: Builder<Parameter> | (Builder<Parameter>)[];
}

export namespace parameters {
  export function from(input: Omit<ParametersOptions, 'nodeKind'> | Builder<Parameter> | (Builder<Parameter>)[]): ParametersBuilder {
    const options: Omit<ParametersOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ParametersOptions, 'nodeKind'>
      : { children: input } as Omit<ParametersOptions, 'nodeKind'>;
    const b = new ParametersBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
