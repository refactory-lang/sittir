import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, DictionarySplatPattern, Identifier, Subscript } from '../types.js';


class DictionarySplatPatternBuilder extends Builder<DictionarySplatPattern> {
  private _children: Builder<Attribute | Identifier | Subscript>[] = [];

  constructor(children: Builder<Attribute | Identifier | Subscript>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('**');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DictionarySplatPattern {
    return {
      kind: 'dictionary_splat_pattern',
      children: this._children[0]?.build(ctx),
    } as DictionarySplatPattern;
  }

  override get nodeKind(): string { return 'dictionary_splat_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '**', type: '**' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { DictionarySplatPatternBuilder };

export function dictionary_splat_pattern(children: Builder<Attribute | Identifier | Subscript>): DictionarySplatPatternBuilder {
  return new DictionarySplatPatternBuilder(children);
}

export interface DictionarySplatPatternOptions {
  children: Builder<Attribute | Identifier | Subscript> | (Builder<Attribute | Identifier | Subscript>)[];
}

export namespace dictionary_splat_pattern {
  export function from(options: DictionarySplatPatternOptions): DictionarySplatPatternBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new DictionarySplatPatternBuilder(_ctor);
    return b;
  }
}
