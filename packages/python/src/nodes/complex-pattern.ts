import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { ComplexPattern, Float, Integer } from '../types.js';


class ComplexPatternBuilder extends Builder<ComplexPattern> {
  private _children: Builder<Integer | Float>[] = [];

  constructor(...children: Builder<Integer | Float>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('+');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ComplexPattern {
    return {
      kind: 'complex_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as ComplexPattern;
  }

  override get nodeKind(): 'complex_pattern' { return 'complex_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: '+', type: '+' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ComplexPatternBuilder };

export function complex_pattern(...children: Builder<Integer | Float>[]): ComplexPatternBuilder {
  return new ComplexPatternBuilder(...children);
}

export interface ComplexPatternOptions {
  nodeKind: 'complex_pattern';
  children?: Builder<Integer | Float> | LeafOptions<'integer'> | LeafOptions<'float'> | (Builder<Integer | Float> | LeafOptions<'integer'> | LeafOptions<'float'>)[];
}

export namespace complex_pattern {
  export function from(input: Omit<ComplexPatternOptions, 'nodeKind'> | Builder<Integer | Float> | LeafOptions<'integer'> | LeafOptions<'float'> | (Builder<Integer | Float> | LeafOptions<'integer'> | LeafOptions<'float'>)[]): ComplexPatternBuilder {
    const options: Omit<ComplexPatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ComplexPatternOptions, 'nodeKind'>
      : { children: input } as Omit<ComplexPatternOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ComplexPatternBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'integer': return new LeafBuilder('integer', (_v as LeafOptions).text!);   case 'float': return new LeafBuilder('float', (_v as LeafOptions).text!); } throw new Error('unreachable'); }));
    return b;
  }
}
