import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExternModifier, StringLiteral } from '../types.js';
import { string_literal } from './string-literal.js';
import type { StringLiteralOptions } from './string-literal.js';


class ExternModifierBuilder extends Builder<ExternModifier> {
  private _children: Builder<StringLiteral>[] = [];

  constructor() { super(); }

  children(...value: Builder<StringLiteral>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('extern');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExternModifier {
    return {
      kind: 'extern_modifier',
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as ExternModifier;
  }

  override get nodeKind(): 'extern_modifier' { return 'extern_modifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'extern', type: 'extern' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ExternModifierBuilder };

export function extern_modifier(): ExternModifierBuilder {
  return new ExternModifierBuilder();
}

export interface ExternModifierOptions {
  nodeKind: 'extern_modifier';
  children?: Builder<StringLiteral> | Omit<StringLiteralOptions, 'nodeKind'> | (Builder<StringLiteral> | Omit<StringLiteralOptions, 'nodeKind'>)[];
}

export namespace extern_modifier {
  export function from(input: Omit<ExternModifierOptions, 'nodeKind'> | Builder<StringLiteral> | Omit<StringLiteralOptions, 'nodeKind'> | (Builder<StringLiteral> | Omit<StringLiteralOptions, 'nodeKind'>)[]): ExternModifierBuilder {
    const options: Omit<ExternModifierOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ExternModifierOptions, 'nodeKind'>
      : { children: input } as Omit<ExternModifierOptions, 'nodeKind'>;
    const b = new ExternModifierBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : string_literal.from(_x)));
    }
    return b;
  }
}
