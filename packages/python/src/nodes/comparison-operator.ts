import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ComparisonOperator, PrimaryExpression } from '../types.js';


class ComparisonOperatorBuilder extends Builder<ComparisonOperator> {
  private _operators: Builder[] = [];
  private _children: Builder<PrimaryExpression>[] = [];

  constructor(...operators: Builder[]) {
    super();
    this._operators = operators;
  }

  children(...value: Builder<PrimaryExpression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._operators.length > 0) parts.push(this.renderChildren(this._operators, ', ', ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ComparisonOperator {
    return {
      kind: 'comparison_operator',
      operators: this._operators.map(c => this.buildChild(c, ctx)),
      children: this._children.map(c => c.build(ctx)),
    } as ComparisonOperator;
  }

  override get nodeKind(): 'comparison_operator' { return 'comparison_operator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    for (const child of this._operators) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'operators' });
    }
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ComparisonOperatorBuilder };

export function comparison_operator(...operators: Builder[]): ComparisonOperatorBuilder {
  return new ComparisonOperatorBuilder(...operators);
}

export interface ComparisonOperatorOptions {
  nodeKind: 'comparison_operator';
  operators: Builder | (Builder)[];
  children?: Builder<PrimaryExpression> | (Builder<PrimaryExpression>)[];
}

export namespace comparison_operator {
  export function from(options: Omit<ComparisonOperatorOptions, 'nodeKind'>): ComparisonOperatorBuilder {
    const _ctor = options.operators;
    const _arr = Array.isArray(_ctor) ? _ctor : [_ctor];
    const b = new ComparisonOperatorBuilder(..._arr);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
