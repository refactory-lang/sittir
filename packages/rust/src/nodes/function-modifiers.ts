import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExternModifier, FunctionModifiers } from '../types.js';
import { extern_modifier } from './extern-modifier.js';
import type { ExternModifierOptions } from './extern-modifier.js';


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

  override get nodeKind(): 'function_modifiers' { return 'function_modifiers'; }

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
  nodeKind: 'function_modifiers';
  children?: Builder<ExternModifier> | Omit<ExternModifierOptions, 'nodeKind'> | (Builder<ExternModifier> | Omit<ExternModifierOptions, 'nodeKind'>)[];
}

export namespace function_modifiers {
  export function from(input: Omit<FunctionModifiersOptions, 'nodeKind'> | Builder<ExternModifier> | Omit<ExternModifierOptions, 'nodeKind'> | (Builder<ExternModifier> | Omit<ExternModifierOptions, 'nodeKind'>)[]): FunctionModifiersBuilder {
    const options: Omit<FunctionModifiersOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<FunctionModifiersOptions, 'nodeKind'>
      : { children: input } as Omit<FunctionModifiersOptions, 'nodeKind'>;
    const b = new FunctionModifiersBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : extern_modifier.from(_x)));
    }
    return b;
  }
}
