import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClosureParameters, Parameter, Pattern } from '../types.js';


class ClosureParametersBuilder extends Builder<ClosureParameters> {
  private _children: Builder<Pattern | Parameter>[] = [];

  constructor() { super(); }

  children(...value: Builder<Pattern | Parameter>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('|');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push('|');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClosureParameters {
    return {
      kind: 'closure_parameters',
      children: this._children.map(c => c.build(ctx)),
    } as ClosureParameters;
  }

  override get nodeKind(): string { return 'closure_parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '|', type: '|' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '|', type: '|' });
    return parts;
  }
}

export type { ClosureParametersBuilder };

export function closure_parameters(): ClosureParametersBuilder {
  return new ClosureParametersBuilder();
}

export interface ClosureParametersOptions {
  children?: Builder<Pattern | Parameter> | (Builder<Pattern | Parameter>)[];
}

export namespace closure_parameters {
  export function from(options: ClosureParametersOptions): ClosureParametersBuilder {
    const b = new ClosureParametersBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
