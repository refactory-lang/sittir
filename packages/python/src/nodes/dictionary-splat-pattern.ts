import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, DictionarySplatPattern, Identifier, Subscript } from '../types.js';
import { subscript } from './subscript.js';
import type { SubscriptOptions } from './subscript.js';
import { attribute } from './attribute.js';
import type { AttributeOptions } from './attribute.js';


class DictionarySplatPatternBuilder extends Builder<DictionarySplatPattern> {
  private _children: Builder<Identifier | Subscript | Attribute>[] = [];

  constructor(children: Builder<Identifier | Subscript | Attribute>) {
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
      children: this._children[0]!.build(ctx),
    } as DictionarySplatPattern;
  }

  override get nodeKind(): 'dictionary_splat_pattern' { return 'dictionary_splat_pattern'; }

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

export function dictionary_splat_pattern(children: Builder<Identifier | Subscript | Attribute>): DictionarySplatPatternBuilder {
  return new DictionarySplatPatternBuilder(children);
}

export interface DictionarySplatPatternOptions {
  nodeKind: 'dictionary_splat_pattern';
  children: Builder<Identifier | Subscript | Attribute> | SubscriptOptions | AttributeOptions | (Builder<Identifier | Subscript | Attribute> | SubscriptOptions | AttributeOptions)[];
}

export namespace dictionary_splat_pattern {
  export function from(input: Omit<DictionarySplatPatternOptions, 'nodeKind'> | Builder<Identifier | Subscript | Attribute> | SubscriptOptions | AttributeOptions | (Builder<Identifier | Subscript | Attribute> | SubscriptOptions | AttributeOptions)[]): DictionarySplatPatternBuilder {
    const options: Omit<DictionarySplatPatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<DictionarySplatPatternOptions, 'nodeKind'>
      : { children: input } as Omit<DictionarySplatPatternOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<Identifier | Subscript | Attribute>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'subscript': _resolved = subscript.from(_ctor); break;
        case 'attribute': _resolved = attribute.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new DictionarySplatPatternBuilder(_resolved);
    return b;
  }
}
