import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericPattern } from '../types.js';


class GenericPatternBuilder extends BaseBuilder<GenericPattern> {
  private _typeArguments: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(typeArguments: BaseBuilder) {
    super();
    this._typeArguments = typeArguments;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('::');
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericPattern {
    return {
      kind: 'generic_pattern',
      typeArguments: this.renderChild(this._typeArguments, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as GenericPattern;
  }

  override get nodeKind(): string { return 'generic_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export function generic_pattern(typeArguments: BaseBuilder): GenericPatternBuilder {
  return new GenericPatternBuilder(typeArguments);
}
