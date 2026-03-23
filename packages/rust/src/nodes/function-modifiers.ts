import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExternModifier, FunctionModifiers } from '../types.js';


class FunctionModifiersBuilder extends Builder<FunctionModifiers> {
  private _children: Builder<ExternModifier>[] = [];

  constructor() { super(); }

  children(...value: Builder<ExternModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('async');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionModifiers {
    return {
      kind: 'function_modifiers',
      children: this._children.map(c => c.build(ctx)),
    } as FunctionModifiers;
  }

  override get nodeKind(): string { return 'function_modifiers'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'async', type: 'async' });
    return parts;
  }
}

export type { FunctionModifiersBuilder };

export function function_modifiers(): FunctionModifiersBuilder {
  return new FunctionModifiersBuilder();
}

export interface FunctionModifiersOptions {
  children?: Builder<ExternModifier> | (Builder<ExternModifier>)[];
}

export namespace function_modifiers {
  export function from(options: FunctionModifiersOptions): FunctionModifiersBuilder {
    const b = new FunctionModifiersBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
