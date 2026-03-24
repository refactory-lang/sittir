import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { FloatLiteral, IntegerLiteral, NegativeLiteral } from '../types.js';


class NegativeLiteralBuilder extends Builder<NegativeLiteral> {
  private _children: Builder<IntegerLiteral | FloatLiteral>[] = [];

  constructor(children: Builder<IntegerLiteral | FloatLiteral>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('-');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NegativeLiteral {
    return {
      kind: 'negative_literal',
      children: this._children[0]!.build(ctx),
    } as NegativeLiteral;
  }

  override get nodeKind(): 'negative_literal' { return 'negative_literal'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '-', type: '-' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { NegativeLiteralBuilder };

export function negative_literal(children: Builder<IntegerLiteral | FloatLiteral>): NegativeLiteralBuilder {
  return new NegativeLiteralBuilder(children);
}

export interface NegativeLiteralOptions {
  nodeKind: 'negative_literal';
  children: Builder<IntegerLiteral | FloatLiteral> | LeafOptions<'integer_literal'> | LeafOptions<'float_literal'> | (Builder<IntegerLiteral | FloatLiteral> | LeafOptions<'integer_literal'> | LeafOptions<'float_literal'>)[];
}

export namespace negative_literal {
  export function from(input: Omit<NegativeLiteralOptions, 'nodeKind'> | Builder<IntegerLiteral | FloatLiteral> | LeafOptions<'integer_literal'> | LeafOptions<'float_literal'> | (Builder<IntegerLiteral | FloatLiteral> | LeafOptions<'integer_literal'> | LeafOptions<'float_literal'>)[]): NegativeLiteralBuilder {
    const options: Omit<NegativeLiteralOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<NegativeLiteralOptions, 'nodeKind'>
      : { children: input } as Omit<NegativeLiteralOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<IntegerLiteral | FloatLiteral>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'integer_literal': _resolved = new LeafBuilder('integer_literal', (_ctor as LeafOptions).text!); break;
        case 'float_literal': _resolved = new LeafBuilder('float_literal', (_ctor as LeafOptions).text!); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new NegativeLiteralBuilder(_resolved);
    return b;
  }
}
